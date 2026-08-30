import type { WorkEntry } from '@/domain/entry/model';
import {
  formatHistoryEntryDate,
  groupHistoryEntries,
} from '@/features/history/historyGrouping';

function createEntry(id: string, occurredAt: string): WorkEntry {
  return {
    id,
    type: 'contribution',
    title: `Entry ${id}`,
    rawNote: `Note ${id}`,
    impactStatement: null,
    occurredAt,
    outcomeType: null,
    status: 'quick_note',
    workAreaId: null,
    evidence: null,
    excludedFromExports: false,
    createdAt: occurredAt,
    updatedAt: occurredAt,
  };
}

describe('History grouping', () => {
  test('groups entries while preserving repository newest-first order', () => {
    const entries = [
      createEntry('august-newer', '2026-08-10T08:00:00.000Z'),
      createEntry('august-older', '2026-08-01T08:00:00.000Z'),
      createEntry('july', '2026-07-31T08:00:00.000Z'),
    ];

    const sections = groupHistoryEntries(entries, 'en-US');

    expect(sections).toHaveLength(2);
    expect(sections[0]?.title).toBe('August 2026');
    expect(sections[0]?.data.map((entry) => entry.id)).toEqual([
      'august-newer',
      'august-older',
    ]);
    expect(sections[1]?.title).toBe('July 2026');
    expect(sections[1]?.data.map((entry) => entry.id)).toEqual(['july']);
  });

  test('does not reorder entries because pagination ordering belongs to the repository', () => {
    const entries = [
      createEntry('first', '2026-08-01T08:00:00.000Z'),
      createEntry('second', '2026-08-10T08:00:00.000Z'),
    ];

    const sections = groupHistoryEntries(entries, 'en-US');

    expect(sections[0]?.data.map((entry) => entry.id)).toEqual([
      'first',
      'second',
    ]);
  });

  test('formats entry dates with the requested locale', () => {
    expect(formatHistoryEntryDate('2026-08-06T08:00:00.000Z', 'en-US')).toMatch(
      /Aug/u,
    );
    expect(formatHistoryEntryDate('2026-08-06T08:00:00.000Z', 'id-ID')).toMatch(
      /Agu/u,
    );
  });
});
