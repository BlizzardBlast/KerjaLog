import * as Crypto from 'expo-crypto';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import {
  parsePortableBackupJson,
  type PortableBackup,
} from '@/domain/portability/model';

export const MAX_PORTABLE_BACKUP_BYTES = 5 * 1024 * 1024;

export type PortableBackupFileAdapter = {
  pickBackup(): Promise<PortableBackup | null>;
  shareBackup(backup: PortableBackup): Promise<void>;
};

export const portableBackupFile: PortableBackupFileAdapter = {
  async pickBackup() {
    let copiedUri: string | null = null;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled) {
        return null;
      }
      const asset = result.assets[0];
      if (!asset) {
        throw new Error('Portable backup selection is unavailable.');
      }
      copiedUri = asset.uri;
      const fileInfo = await FileSystem.getInfoAsync(copiedUri);
      if (
        !fileInfo.exists ||
        typeof fileInfo.size !== 'number' ||
        fileInfo.size > MAX_PORTABLE_BACKUP_BYTES
      ) {
        throw new Error('Portable backup is too large or unavailable.');
      }
      const json = await FileSystem.readAsStringAsync(copiedUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      if (json.length > MAX_PORTABLE_BACKUP_BYTES) {
        throw new Error('Portable backup is too large.');
      }
      return parsePortableBackupJson(json);
    } finally {
      if (copiedUri) {
        await FileSystem.deleteAsync(copiedUri, { idempotent: true });
      }
    }
  },

  async shareBackup(backup) {
    const uri = createTemporaryBackupUri();
    try {
      await FileSystem.writeAsStringAsync(uri, JSON.stringify(backup), {
        encoding: FileSystem.EncodingType.UTF8,
      });
      if (!(await Sharing.isAvailableAsync())) {
        throw new Error('Native file sharing is unavailable.');
      }
      await Sharing.shareAsync(uri, { mimeType: 'application/json' });
    } finally {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    }
  },
};

export function createPortableBackupFilename(now = new Date()): string {
  return `kerjalog-backup-${now.toISOString().slice(0, 10)}.json`;
}

function createTemporaryBackupUri(): string {
  if (!FileSystem.cacheDirectory) {
    throw new Error('Temporary backup storage is unavailable.');
  }
  const filename = createPortableBackupFilename();
  const suffix = Crypto.randomUUID();
  return `${FileSystem.cacheDirectory}${filename.replace('.json', `-${suffix}.json`)}`;
}
