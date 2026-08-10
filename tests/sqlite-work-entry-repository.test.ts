import { getDatabase } from '@/data/database';
import { SQLiteWorkEntryRepository } from '@/data/repositories/SQLiteWorkEntryRepository';

jest.mock('@/data/database', () => ({
  getDatabase: jest.fn(),
}));

const getDatabaseMock = jest.mocked(getDatabase);

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
