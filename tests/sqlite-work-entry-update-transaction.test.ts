import { getDatabase } from '@/data/database';
import { SQLiteWorkEntryRepository } from '@/data/repositories/SQLiteWorkEntryRepository';
import type { UpdateWorkEntry } from '@/domain/entry/model';

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'generated-id'),
}));

jest.mock('@/data/database', () => ({
  getDatabase: jest.fn(),
}));

const getDatabaseMock = jest.mocked(getDatabase);

const updateInput: UpdateWorkEntry = {
  type: 'problem_solved',
  title: 'Resolved reconciliation mismatch',
  rawNote: 'Resolved reconciliation mismatch.',
  impactStatement: 'Corrected the mismatch before submission.',
  impactStatementSource: 'user',
  occurredAt: '2026-08-10T08:00:00.000Z',
  outcomeType: 'error_fixed_or_prevented',
  status: 'review_ready',
  workAreaId: 'area-reconciliation',
  evidence: {
    types: ['number'],
    detail: '7 duplicate rows removed',
  },
  skills: [{ id: 'problem_solving', source: 'rules' }],
  excludedFromExports: false,
};

describe('SQLiteWorkEntryRepository update transaction boundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('reloads the updated detail before the transaction callback completes', async () => {
    let transactionActive = false;
    let readOccurredInsideTransaction = false;
    const reloadError = new Error('detail reload failed');
    const db = {
      runAsync: jest.fn().mockResolvedValue({ changes: 1, lastInsertRowId: 0 }),
      getAllAsync: jest.fn().mockImplementation(async () => {
        readOccurredInsideTransaction = transactionActive;
        throw reloadError;
      }),
      withTransactionAsync: jest.fn(async (operation: () => Promise<void>) => {
        transactionActive = true;
        try {
          await operation();
        } finally {
          transactionActive = false;
        }
      }),
    };

    getDatabaseMock.mockResolvedValue(
      db as unknown as Awaited<ReturnType<typeof getDatabase>>,
    );

    const repository = new SQLiteWorkEntryRepository();

    await expect(repository.update('entry-1', updateInput)).rejects.toBe(
      reloadError,
    );

    expect(readOccurredInsideTransaction).toBe(true);
    expect(db.withTransactionAsync).toHaveBeenCalledTimes(1);
    expect(db.getAllAsync).toHaveBeenCalledTimes(1);
  });
});
