import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import type { PortableBackup } from '@/domain/portability/model';
import {
  createPortableBackupFilename,
  portableBackupFile,
} from '@/platform/portability/portableBackupFile';

jest.mock('expo-crypto', () => ({ randomUUID: jest.fn(() => 'backup-1') }));
jest.mock('expo-document-picker', () => ({ getDocumentAsync: jest.fn() }));
jest.mock('expo-file-system/legacy', () => ({
  cacheDirectory: 'file://cache/',
  EncodingType: { UTF8: 'utf8' },
  deleteAsync: jest.fn(),
  getInfoAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
}));
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));

const backup: PortableBackup = {
  version: 1,
  exportedAt: '2026-09-12T08:00:00.000Z',
  data: {
    workAreas: [],
    entries: [],
    activeDraft: null,
    reviewDrafts: [],
    preferences: {
      themeMode: 'system',
      language: 'en',
      onboarding: {
        version: 1,
        currentStep: 'welcome',
        completed: false,
        weeklyReminderEnabled: false,
        weeklyReminderSchedule: { weekday: 6, hour: 16, minute: 30 },
      },
    },
  },
};

describe('portable backup file adapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(FileSystem.deleteAsync).mockResolvedValue(undefined);
    jest.mocked(FileSystem.writeAsStringAsync).mockResolvedValue(undefined);
    jest.mocked(Sharing.isAvailableAsync).mockResolvedValue(true);
    jest.mocked(Sharing.shareAsync).mockResolvedValue(undefined);
  });

  test('shares a safe temporary filename and removes it afterward', async () => {
    await portableBackupFile.shareBackup(backup);

    expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
      expect.stringMatching(
        /^file:\/\/cache\/kerjalog-backup-\d{4}-\d{2}-\d{2}-backup-1\.json$/u,
      ),
      JSON.stringify(backup),
      { encoding: 'utf8' },
    );
    expect(Sharing.shareAsync).toHaveBeenCalledWith(expect.any(String), {
      mimeType: 'application/json',
    });
    expect(FileSystem.deleteAsync).toHaveBeenCalledWith(expect.any(String), {
      idempotent: true,
    });
    expect(
      createPortableBackupFilename(new Date('2026-09-12T00:00:00.000Z')),
    ).toBe('kerjalog-backup-2026-09-12.json');
  });

  test('returns null without reading data when selection is cancelled', async () => {
    jest.mocked(DocumentPicker.getDocumentAsync).mockResolvedValue({
      canceled: true,
      assets: null,
    });

    await expect(portableBackupFile.pickBackup()).resolves.toBeNull();
    expect(FileSystem.readAsStringAsync).not.toHaveBeenCalled();
  });

  test('validates a copied JSON backup then removes the sensitive cache file', async () => {
    jest.mocked(DocumentPicker.getDocumentAsync).mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: 'file://cache/import.json',
          name: 'import.json',
          mimeType: 'application/json',
          size: 100,
          lastModified: 0,
        },
      ],
    });
    jest.mocked(FileSystem.getInfoAsync).mockResolvedValue({
      exists: true,
      size: 100,
      uri: 'file://cache/import.json',
      isDirectory: false,
      modificationTime: 0,
    });
    jest
      .mocked(FileSystem.readAsStringAsync)
      .mockResolvedValue(JSON.stringify(backup));

    await expect(portableBackupFile.pickBackup()).resolves.toEqual(backup);
    expect(FileSystem.deleteAsync).toHaveBeenCalledWith(
      'file://cache/import.json',
      { idempotent: true },
    );
  });

  test('cleans a copied file when validation fails', async () => {
    jest.mocked(DocumentPicker.getDocumentAsync).mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: 'file://cache/import.json',
          name: 'import.json',
          mimeType: 'application/json',
          size: 100,
          lastModified: 0,
        },
      ],
    });
    jest.mocked(FileSystem.getInfoAsync).mockResolvedValue({
      exists: true,
      size: 100,
      uri: 'file://cache/import.json',
      isDirectory: false,
      modificationTime: 0,
    });
    jest.mocked(FileSystem.readAsStringAsync).mockResolvedValue('{bad json');

    await expect(portableBackupFile.pickBackup()).rejects.toThrow(
      'Portable backup is invalid or unsupported.',
    );
    expect(FileSystem.deleteAsync).toHaveBeenCalledWith(
      'file://cache/import.json',
      { idempotent: true },
    );
  });
});
