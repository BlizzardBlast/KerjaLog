import * as Crypto from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';
import { getDatabase } from '@/data/database';
import { SQLiteWorkEntryRepository } from '@/data/repositories/SQLiteWorkEntryRepository';
import type { CreateWorkEntry } from '@/domain/entry/model';

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(),
}));

jest.mock('@/data/database', () => ({
  getDatabase: jest.fn(),
}));

const getDatabaseMock = jest.mocked(getDatabase);
const randomUUIDMock = jest.mocked(Crypto.randomUUID);

const baseRow = {
  id: 'entry-1',
  type: 'contribution',
  title: 'Helped Finance',
  raw_note: 'Helped Finance reconcile the monthly report.',
  impact_statement: 'Helped Finance reconcile the monthly report.',
  occurred_at: '2026-08-10T08:00:00.000Z',
  outcome_type: 'person_helped',
  status: 'review_ready',
  excluded_from_exports: 0,
  created_at: '2026-08-10T08:01:00.000Z',
  updated_at: '2026-08-10T08:01:00.000Z',
  evidence_type: 'deadline',
  evidence_text_value: 'Completed before Friday close',
};

function useRows(rows: unknown[]) {
  const getAllAsync = jest.fn().mockResolvedValue(rows);

  getDatabaseMock.mockResolvedValue({
    getAllAsync,
  } as unknown as Awaited<ReturnType<typeof getDatabase>>);

  return getAllAsync;
}

function useTransaction() {
  const transaction = {
    runAsync: jest.fn().mockResolvedValue({
      changes: 1,
      lastInsertRowId: 0,
    }),
  };
  const withExclusiveTransactionAsync = jest.fn(
    async (operation: (transaction: SQLiteDatabase) => Promise<void>) => {
      await operation(transaction as unknown as SQLiteDatabase);
    },
  );

  getDatabaseMock.mockResolvedValue({
    withExclusiveTransactionAsync,
  } as unknown as Awaited<ReturnType<typeof getDatabase>>);

  return {
    transaction,
    withExclusiveTransactionAsync,
  };
}

describe('SQLiteWorkEntryRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('findById binds the id and reconstructs joined evidence', async () => {
    const getAllAsync = useRows([
      baseRow,
      {
        ...baseRow,
        evidence_type: 'result',
      },
    ]);
    const repository = new SQLiteWorkEntryRepository();
    const id = "entry-with-'quotes'-and-spaces";

    const entry = await repository.findById(id);

    expect(getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('WHERE work_entries.id = $id'),
      { $id: id },
    );
    expect(entry).toEqual({
      id: 'entry-1',
      type: 'contribution',
      title: 'Helped Finance',
      rawNote: 'Helped Finance reconcile the monthly report.',
      impactStatement: 'Helped Finance reconcile the monthly report.',
      occurredAt: '2026-08-10T08:00:00.000Z',
      outcomeType: 'person_helped',
      status: 'review_ready',
      evidence: {
        types: ['deadline', 'result'],
        detail: 'Completed before Friday close',
      },
      excludedFromExports: false,
      createdAt: '2026-08-10T08:01:00.000Z',
      updatedAt: '2026-08-10T08:01:00.000Z',
    });
  });

  test('findById returns null when the entry is missing', async () => {
    useRows([]);
    const repository = new SQLiteWorkEntryRepository();

    await expect(repository.findById('missing')).resolves.toBeNull();
  });

  test('findRecent binds the limit after limiting work entries before the join', async () => {
    const getAllAsync = useRows([
      baseRow,
      {
        ...baseRow,
        id: 'entry-2',
        title: 'Fixed an issue',
        raw_note: 'Fixed an issue in the report flow.',
        occurred_at: '2026-08-09T08:00:00.000Z',
        created_at: '2026-08-09T08:01:00.000Z',
        updated_at: '2026-08-09T08:01:00.000Z',
        type: 'problem_solved',
        outcome_type: 'error_fixed_or_prevented',
        evidence_type: null,
        evidence_text_value: null,
      },
    ]);
    const repository = new SQLiteWorkEntryRepository();

    const entries = await repository.findRecent(2);

    expect(getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('LIMIT $limit'),
      { $limit: 2 },
    );
    expect(entries).toHaveLength(2);
    expect(entries[0]?.id).toBe('entry-1');
    expect(entries[1]).toMatchObject({
      id: 'entry-2',
      type: 'problem_solved',
      evidence: null,
    });
  });

  test('findRecent rejects invalid limits without opening the database', async () => {
    const repository = new SQLiteWorkEntryRepository();

    await expect(repository.findRecent(-1)).rejects.toThrow(
      'Recent work entry limit must be a non-negative integer.',
    );
    await expect(repository.findRecent(1.5)).rejects.toThrow(
      'Recent work entry limit must be a non-negative integer.',
    );
    await expect(repository.findRecent(0)).resolves.toEqual([]);

    expect(getDatabaseMock).not.toHaveBeenCalled();
  });

  test('create writes the entry and evidence in one transaction with bound values', async () => {
    const { transaction, withExclusiveTransactionAsync } = useTransaction();
    randomUUIDMock
      .mockReturnValueOnce('entry-created')
      .mockReturnValueOnce('evidence-deadline')
      .mockReturnValueOnce('evidence-result');
    const repository = new SQLiteWorkEntryRepository();
    const input: CreateWorkEntry = {
      type: 'contribution',
      title: 'Helped Finance',
      rawNote: 'Helped Finance reconcile the monthly report.',
      impactStatement: 'Helped Finance reconcile the monthly report.',
      occurredAt: '2026-08-10T08:00:00.000Z',
      outcomeType: 'person_helped',
      status: 'review_ready',
      evidence: {
        types: ['deadline', 'result'],
        detail: 'Completed before Friday close',
      },
      excludedFromExports: false,
    };

    const entry = await repository.create(input);

    expect(withExclusiveTransactionAsync).toHaveBeenCalledTimes(1);
    expect(transaction.runAsync).toHaveBeenCalledTimes(3);
    expect(transaction.runAsync).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('INSERT INTO work_entries'),
      expect.objectContaining({
        $id: 'entry-created',
        $rawNote: input.rawNote,
        $excludedFromExports: 0,
      }),
    );
    expect(transaction.runAsync).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO evidence'),
      expect.objectContaining({
        $id: 'evidence-deadline',
        $entryId: 'entry-created',
        $type: 'deadline',
        $textValue: input.evidence?.detail,
      }),
    );
    expect(transaction.runAsync).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('INSERT INTO evidence'),
      expect.objectContaining({
        $id: 'evidence-result',
        $entryId: 'entry-created',
        $type: 'result',
        $textValue: input.evidence?.detail,
      }),
    );
    expect(entry).toMatchObject({
      ...input,
      id: 'entry-created',
    });
    expect(entry.createdAt).toEqual(expect.any(String));
    expect(entry.updatedAt).toBe(entry.createdAt);
  });

  test('rejects invalid persisted domain values', async () => {
    useRows([
      {
        ...baseRow,
        type: 'not-a-real-entry-type',
      },
    ]);
    const repository = new SQLiteWorkEntryRepository();

    await expect(repository.findById('entry-1')).rejects.toThrow(
      'Stored work entry type is invalid.',
    );
  });

  test('rejects inconsistent evidence details for the same entry', async () => {
    useRows([
      baseRow,
      {
        ...baseRow,
        evidence_type: 'result',
        evidence_text_value: 'A different detail',
      },
    ]);
    const repository = new SQLiteWorkEntryRepository();

    await expect(repository.findById('entry-1')).rejects.toThrow(
      'Stored evidence for work entry entry-1 is inconsistent.',
    );
  });
});
