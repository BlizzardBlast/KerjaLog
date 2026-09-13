import * as Crypto from 'expo-crypto';
import { getDatabase } from '@/data/database';
import { SQLiteReviewRepository } from '@/data/repositories/SQLiteReviewRepository';
import type { CreateReviewDraft } from '@/domain/review/model';

jest.mock('expo-crypto', () => ({ randomUUID: jest.fn() }));
jest.mock('@/data/database', () => ({ getDatabase: jest.fn() }));

const getDatabaseMock = jest.mocked(getDatabase);
const randomUUIDMock = jest.mocked(Crypto.randomUUID);

const draft: CreateReviewDraft = {
  title: 'September review',
  purpose: 'performance_self_review',
  period: { startDate: '2026-09-01', endDate: '2026-09-30' },
  document: {
    sections: [
      {
        id: 'highlights',
        title: 'Highlights',
        bullets: ['Simplified the handoff.'],
      },
    ],
  },
  entries: [
    {
      sourceEntryId: 'entry-1',
      title: 'Simplified handoff',
      statement: 'Simplified the handoff.',
      evidenceDetail: 'Team adopted the checklist.',
      occurredAt: '2026-09-02T08:00:00.000Z',
      sortOrder: 0,
    },
  ],
};

describe('SQLiteReviewRepository', () => {
  beforeEach(() => jest.clearAllMocks());

  test('queries only non-private review-ready candidates in the inclusive local period', async () => {
    const getAllAsync = jest.fn().mockResolvedValue([
      {
        id: 'entry-1',
        title: 'Simplified handoff',
        impact_statement: 'Simplified the handoff.',
        raw_note: 'Updated handoff.',
        occurred_at: '2026-09-02T08:00:00.000Z',
        outcome_type: 'work_clearer',
        evidence_type: 'result',
        evidence_detail: 'Team adopted the checklist.',
        skill_id: 'communication',
      },
    ]);
    getDatabaseMock.mockResolvedValue({
      getAllAsync,
    } as unknown as Awaited<ReturnType<typeof getDatabase>>);

    const candidates = await new SQLiteReviewRepository().findCandidates({
      period: draft.period,
      skillId: null,
    });

    expect(candidates).toEqual([expect.objectContaining({ id: 'entry-1' })]);
    expect(candidates[0]).not.toHaveProperty('excludedFromExports');
    expect(getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining("work_entries.status = 'review_ready'"),
      expect.objectContaining({
        $startDate: '2026-09-01',
        $endDate: '2026-09-30',
      }),
    );
    expect(getAllAsync.mock.calls[0]?.[0]).toContain(
      'work_entries.excluded_from_exports = 0',
    );
    expect(getAllAsync.mock.calls[0]?.[0]).toContain(
      "date(work_entries.occurred_at, 'localtime')",
    );
  });

  test('creates a draft and its immutable source snapshots in one keyed transaction', async () => {
    randomUUIDMock.mockReturnValue('review-1');
    const runAsync = jest.fn().mockResolvedValue({ changes: 1 });
    const withTransactionAsync = jest.fn(
      async (operation: () => Promise<void>) => {
        await operation();
      },
    );
    getDatabaseMock.mockResolvedValue({
      runAsync,
      withTransactionAsync,
    } as unknown as Awaited<ReturnType<typeof getDatabase>>);

    const created = await new SQLiteReviewRepository().createDraft(draft);

    expect(withTransactionAsync).toHaveBeenCalledTimes(1);
    expect(runAsync).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('INSERT INTO review_drafts'),
      expect.objectContaining({
        $id: 'review-1',
        $purpose: 'performance_self_review',
      }),
    );
    expect(runAsync).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO review_draft_entries'),
      expect.objectContaining({ $sourceEntryId: 'entry-1' }),
    );
    expect(created).toMatchObject({ id: 'review-1', entries: draft.entries });
  });
});
