import { getDatabase } from '@/data/database';
import { SQLiteWorkEntryRepository } from '@/data/repositories/SQLiteWorkEntryRepository';
import type { CreateWorkEntry } from '@/domain/entry/model';
import { isCanonicalIsoTimestamp } from '@/domain/entry/timestamp';

jest.mock('@/data/database', () => ({ getDatabase: jest.fn() }));
const getDatabaseMock = jest.mocked(getDatabase);

const input: CreateWorkEntry = {
  type: 'contribution',
  title: 'Helped Finance',
  rawNote: 'Helped Finance reconcile the monthly report.',
  impactStatement: 'Helped Finance reconcile the monthly report.',
  impactStatementSource: 'generated',
  occurredAt: '2026-08-10T08:00:00.000Z',
  outcomeType: 'person_helped',
  status: 'review_ready',
  evidence: null,
  excludedFromExports: false,
};

describe('canonical work entry timestamps', () => {
  beforeEach(() => jest.clearAllMocks());

  test('accepts only the canonical UTC representation used for SQLite ordering', () => {
    expect(isCanonicalIsoTimestamp('2026-08-10T08:00:00.000Z')).toBe(true);
    expect(isCanonicalIsoTimestamp('2026-08-10T15:00:00.000+07:00')).toBe(
      false,
    );
    expect(isCanonicalIsoTimestamp('2026-08-10T08:00:00Z')).toBe(false);
    expect(isCanonicalIsoTimestamp('not-a-date')).toBe(false);
  });

  test('rejects noncanonical occurred-at values before opening the database', async () => {
    const repository = new SQLiteWorkEntryRepository();

    await expect(
      repository.commit({
        ...input,
        occurredAt: '2026-08-10T15:00:00.000+07:00',
      }),
    ).rejects.toThrow(
      'Work entry occurred at must be a canonical ISO timestamp.',
    );

    expect(getDatabaseMock).not.toHaveBeenCalled();
  });
});
