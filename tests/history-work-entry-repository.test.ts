import { getDatabase } from '@/data/database';
import {
  buildFtsSearchQuery,
  SQLiteWorkEntryRepository,
} from '@/data/repositories/SQLiteWorkEntryRepository';
import {
  HISTORY_SEARCH_MAX_LENGTH,
  HISTORY_SEARCH_MAX_TERMS,
  type WorkEntryHistoryQuery,
} from '@/domain/entry/history';

jest.mock('@/data/database', () => ({
  getDatabase: jest.fn(),
}));

const getDatabaseMock = jest.mocked(getDatabase);

const baseRow = {
  id: 'entry-3',
  type: 'contribution',
  title: 'Helped Finance close monthly reporting',
  raw_note: 'Helped Finance reconcile the monthly report.',
  impact_statement: 'Finance closed the report on time.',
  occurred_at: '2026-08-10T08:00:00.000Z',
  outcome_type: 'person_helped',
  status: 'review_ready',
  excluded_from_exports: 0,
  created_at: '2026-08-10T08:01:00.000Z',
  updated_at: '2026-08-10T08:01:00.000Z',
  evidence_type: 'deadline',
  evidence_text_value: 'Completed before Friday close',
};

function row(
  id: string,
  occurredAt: string,
  createdAt = occurredAt,
): typeof baseRow {
  return {
    ...baseRow,
    id,
    title: `Entry ${id}`,
    occurred_at: occurredAt,
    created_at: createdAt,
    updated_at: createdAt,
  };
}

function useRows(rows: unknown[]) {
  const getAllAsync = jest.fn().mockResolvedValue(rows);

  getDatabaseMock.mockResolvedValue({
    getAllAsync,
  } as unknown as Awaited<ReturnType<typeof getDatabase>>);

  return getAllAsync;
}

function createQuery(
  overrides: Partial<WorkEntryHistoryQuery> = {},
): WorkEntryHistoryQuery {
  return {
    searchText: '',
    filters: {
      entryType: null,
      hasEvidence: false,
      reviewReadyOnly: false,
    },
    cursor: null,
    limit: 50,
    ...overrides,
  };
}

describe('History work entry repository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('builds a bounded safe prefix FTS query', () => {
    expect(buildFtsSearchQuery('  Finance closing 2026 ')).toBe(
      '"Finance"* AND "closing"* AND "2026"*',
    );
    expect(buildFtsSearchQuery('---')).toBeNull();

    const manyTerms = Array.from(
      { length: HISTORY_SEARCH_MAX_TERMS + 4 },
      (_, index) => `term${index}`,
    ).join(' ');
    const boundedQuery = buildFtsSearchQuery(manyTerms);

    expect(boundedQuery?.split(' AND ')).toHaveLength(HISTORY_SEARCH_MAX_TERMS);
    expect(boundedQuery).not.toContain(`term${HISTORY_SEARCH_MAX_TERMS}`);
  });

  test('queries a bounded first page in stable newest-first order', async () => {
    const getAllAsync = useRows([baseRow]);
    const repository = new SQLiteWorkEntryRepository();

    const page = await repository.findHistory(createQuery({ limit: 10 }));

    expect(getAllAsync).toHaveBeenCalledWith(
      expect.not.stringContaining('MATCH $searchQuery'),
      { $limitPlusOne: 11 },
    );
    const sql = getAllAsync.mock.calls[0]?.[0] ?? '';
    expect(sql).toEqual(
      expect.stringContaining('matching_entries.occurred_at DESC'),
    );
    expect(sql).toEqual(expect.stringContaining('matching_entries.id DESC'));
    expect(page.entries).toHaveLength(1);
    expect(page.nextCursor).toBeNull();
  });

  test('uses FTS to produce candidate ids before applying work-entry filters', async () => {
    const getAllAsync = useRows([baseRow]);
    const repository = new SQLiteWorkEntryRepository();
    const query = createQuery({
      searchText: "Finance closing' OR 1=1 --",
      filters: {
        entryType: 'contribution',
        hasEvidence: true,
        reviewReadyOnly: true,
      },
    });

    await repository.findHistory(query);

    const [sql, parameters] = getAllAsync.mock.calls[0] ?? [];
    expect(sql).toEqual(expect.stringContaining('work_entries.id IN ('));
    expect(sql).toEqual(expect.stringContaining('MATCH $searchQuery'));
    expect(sql).not.toContain(query.searchText);
    expect(parameters).toEqual({
      $limitPlusOne: 51,
      $searchQuery: '"Finance"* AND "closing"* AND "OR"* AND "1"* AND "1"*',
      $entryType: 'contribution',
    });
  });

  test('returns a stable cursor when another page exists', async () => {
    useRows([
      row('entry-3', '2026-08-10T08:00:00.000Z'),
      row('entry-2', '2026-08-09T08:00:00.000Z'),
      row('entry-1', '2026-08-08T08:00:00.000Z'),
    ]);
    const repository = new SQLiteWorkEntryRepository();

    const page = await repository.findHistory(createQuery({ limit: 2 }));

    expect(page.entries.map((entry) => entry.id)).toEqual([
      'entry-3',
      'entry-2',
    ]);
    expect(page.nextCursor).toEqual({
      occurredAt: '2026-08-09T08:00:00.000Z',
      createdAt: '2026-08-09T08:00:00.000Z',
      id: 'entry-2',
    });
  });

  test('applies all cursor fields to the next-page boundary', async () => {
    const getAllAsync = useRows([row('entry-1', '2026-08-08T08:00:00.000Z')]);
    const repository = new SQLiteWorkEntryRepository();
    const cursor = {
      occurredAt: '2026-08-09T08:00:00.000Z',
      createdAt: '2026-08-09T08:01:00.000Z',
      id: 'entry-2',
    };

    await repository.findHistory(createQuery({ cursor, limit: 2 }));

    const [sql, parameters] = getAllAsync.mock.calls[0] ?? [];
    expect(sql).toEqual(expect.stringContaining('work_entries.id < $cursorId'));
    expect(parameters).toMatchObject({
      $limitPlusOne: 3,
      $cursorOccurredAt: cursor.occurredAt,
      $cursorCreatedAt: cursor.createdAt,
      $cursorId: cursor.id,
    });
  });

  test('returns no results for a non-empty search with no searchable tokens', async () => {
    const repository = new SQLiteWorkEntryRepository();

    await expect(
      repository.findHistory(createQuery({ searchText: '---' })),
    ).resolves.toEqual({ entries: [], nextCursor: null });

    expect(getDatabaseMock).not.toHaveBeenCalled();
  });

  test('rejects search text beyond the defensive repository limit', async () => {
    const repository = new SQLiteWorkEntryRepository();

    await expect(
      repository.findHistory(
        createQuery({
          searchText: 'x'.repeat(HISTORY_SEARCH_MAX_LENGTH + 1),
        }),
      ),
    ).rejects.toThrow('History search text must be at most');

    expect(getDatabaseMock).not.toHaveBeenCalled();
  });
});
