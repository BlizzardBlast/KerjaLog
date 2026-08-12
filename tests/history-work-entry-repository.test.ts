import { getDatabase } from '@/data/database';
import {
  buildFtsSearchQuery,
  SQLiteWorkEntryRepository,
} from '@/data/repositories/SQLiteWorkEntryRepository';
import type { WorkEntryHistoryQuery } from '@/domain/entry/history';

jest.mock('@/data/database', () => ({
  getDatabase: jest.fn(),
}));

const getDatabaseMock = jest.mocked(getDatabase);

const baseRow = {
  id: 'entry-1',
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
    ...overrides,
  };
}

describe('History work entry repository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('builds a safe prefix FTS query from searchable tokens', () => {
    expect(buildFtsSearchQuery('  Finance closing 2026 ')).toBe(
      '"Finance"* AND "closing"* AND "2026"*',
    );
    expect(buildFtsSearchQuery('---')).toBeNull();
  });

  test('queries all history in stable newest-first order when no filters are active', async () => {
    const getAllAsync = useRows([baseRow]);
    const repository = new SQLiteWorkEntryRepository();

    const entries = await repository.findHistory(createQuery());

    expect(getAllAsync).toHaveBeenCalledWith(
      expect.not.stringContaining('MATCH $searchQuery'),
      {},
    );
    expect(getAllAsync.mock.calls[0]?.[0]).toEqual(
      expect.stringContaining('matching_entries.occurred_at DESC'),
    );
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      id: 'entry-1',
      title: baseRow.title,
      evidence: {
        detail: baseRow.evidence_text_value,
      },
    });
  });

  test('binds FTS search and practical filters instead of interpolating user input', async () => {
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
    expect(sql).toEqual(expect.stringContaining('MATCH $searchQuery'));
    expect(sql).toEqual(
      expect.stringContaining('work_entries.type = $entryType'),
    );
    expect(sql).toEqual(expect.stringContaining('history_evidence.entry_id'));
    expect(sql).toEqual(
      expect.stringContaining("work_entries.status = 'review_ready'"),
    );
    expect(sql).not.toContain(query.searchText);
    expect(parameters).toEqual({
      $searchQuery: '"Finance"* AND "closing"* AND "OR"* AND "1"* AND "1"*',
      $entryType: 'contribution',
    });
  });

  test('returns no results for a non-empty search with no searchable tokens', async () => {
    const repository = new SQLiteWorkEntryRepository();

    await expect(
      repository.findHistory(createQuery({ searchText: '---' })),
    ).resolves.toEqual([]);

    expect(getDatabaseMock).not.toHaveBeenCalled();
  });
});
