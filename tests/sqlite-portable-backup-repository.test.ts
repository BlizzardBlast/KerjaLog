import * as Crypto from 'expo-crypto';
import { getDatabase } from '@/data/database';
import { SQLitePortableBackupRepository } from '@/data/repositories/SQLitePortableBackupRepository';
import type { PortableBackup } from '@/domain/portability/model';

jest.mock('expo-crypto', () => ({ randomUUID: jest.fn() }));
jest.mock('@/data/database', () => ({ getDatabase: jest.fn() }));

const getDatabaseMock = jest.mocked(getDatabase);
const randomUUIDMock = jest.mocked(Crypto.randomUUID);

const preferences = {
  themeMode: 'dark' as const,
  language: 'id' as const,
  onboarding: {
    version: 1 as const,
    currentStep: 'review-rhythm' as const,
    completed: true,
    workArea: 'operations-administration' as const,
    careerLevel: 'junior-contributor' as const,
    mainGoal: 'performance-review' as const,
    reviewSchedule: 'within-3-months' as const,
    weeklyReminderEnabled: true,
    weeklyReminderSchedule: { weekday: 6 as const, hour: 16, minute: 30 },
  },
};

const backup: PortableBackup = {
  version: 1,
  exportedAt: '2026-09-12T08:00:00.000Z',
  data: {
    workAreas: [
      {
        id: 'area-1',
        name: 'Operations',
        archivedAt: null,
        createdAt: '2026-09-01T08:00:00.000Z',
        updatedAt: '2026-09-01T08:00:00.000Z',
      },
    ],
    entries: [
      {
        id: 'entry-1',
        type: 'contribution',
        title: 'Prepared report',
        rawNote: 'Prepared the weekly report.',
        impactStatement: 'Prepared the weekly report on time.',
        impactStatementSource: 'user',
        occurredAt: '2026-09-02T08:00:00.000Z',
        outcomeType: 'deadline_met',
        status: 'review_ready',
        workAreaId: 'area-1',
        evidence: { types: ['deadline'], detail: 'Submitted Friday.' },
        excludedFromExports: true,
        createdAt: '2026-09-02T08:00:00.000Z',
        updatedAt: '2026-09-02T08:00:00.000Z',
        skills: [{ id: 'execution', source: 'user' }],
      },
    ],
    activeDraft: null,
    reviewDrafts: [
      {
        id: 'review-1',
        title: 'September review',
        purpose: 'performance_self_review',
        period: { startDate: '2026-09-01', endDate: '2026-09-30' },
        document: {
          sections: [
            {
              id: 'highlights',
              title: 'Highlights',
              bullets: ['Prepared the weekly report on time.'],
            },
          ],
        },
        entries: [
          {
            sourceEntryId: 'entry-1',
            title: 'Prepared report',
            statement: 'Prepared the weekly report on time.',
            evidenceDetail: 'Submitted Friday.',
            occurredAt: '2026-09-02T08:00:00.000Z',
            sortOrder: 0,
          },
        ],
        createdAt: '2026-09-03T08:00:00.000Z',
        updatedAt: '2026-09-03T08:00:00.000Z',
      },
    ],
    preferences,
  },
};

describe('SQLitePortableBackupRepository', () => {
  beforeEach(() => jest.clearAllMocks());

  test('exports all local career records and supplied portable preferences', async () => {
    const getAllAsync = jest.fn().mockResolvedValue([]);
    const getFirstAsync = jest.fn().mockResolvedValue(null);
    getDatabaseMock.mockResolvedValue({
      getAllAsync,
      getFirstAsync,
    } as unknown as Awaited<ReturnType<typeof getDatabase>>);

    const exported = await new SQLitePortableBackupRepository().exportBackup(
      preferences,
    );

    expect(exported.data.preferences).toEqual(preferences);
    expect(exported.data).toMatchObject({
      workAreas: [],
      entries: [],
      activeDraft: null,
      reviewDrafts: [],
    });
    expect(getAllAsync).toHaveBeenCalledTimes(6);
  });

  test('replaces career records atomically while retaining the seeded skills catalogue', async () => {
    randomUUIDMock.mockReturnValue('evidence-1');
    const runAsync = jest.fn().mockResolvedValue({ changes: 1 });
    const withTransactionAsync = jest.fn(
      async (operation: () => Promise<void>) => operation(),
    );
    getDatabaseMock.mockResolvedValue({
      runAsync,
      withTransactionAsync,
    } as unknown as Awaited<ReturnType<typeof getDatabase>>);

    await new SQLitePortableBackupRepository().replaceWithBackup(backup);

    expect(withTransactionAsync).toHaveBeenCalledTimes(1);
    expect(runAsync).toHaveBeenNthCalledWith(1, 'DELETE FROM review_drafts');
    expect(runAsync).toHaveBeenNthCalledWith(
      2,
      'DELETE FROM active_work_entry_draft',
    );
    expect(runAsync).toHaveBeenNthCalledWith(3, 'DELETE FROM work_entries');
    expect(runAsync).toHaveBeenNthCalledWith(4, 'DELETE FROM work_areas');
    expect(
      runAsync.mock.calls.some(([sql]) =>
        String(sql).includes('DELETE FROM skills'),
      ),
    ).toBe(false);
    expect(runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO work_entries'),
      expect.objectContaining({
        $id: 'entry-1',
        $excludedFromExports: 1,
      }),
    );
    expect(runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO review_draft_entries'),
      expect.objectContaining({ $reviewDraftId: 'review-1' }),
    );
  });

  test('rejects invalid backups before opening or mutating the database', async () => {
    const invalid = { ...backup, version: 2 };

    await expect(
      new SQLitePortableBackupRepository().replaceWithBackup(
        invalid as PortableBackup,
      ),
    ).rejects.toThrow('Portable backup is invalid or unsupported.');
    expect(getDatabaseMock).not.toHaveBeenCalled();
  });
});
