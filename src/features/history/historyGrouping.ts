import type { WorkEntry } from '@/domain/entry/model';

export type HistorySection = {
  key: string;
  title: string;
  data: WorkEntry[];
};

export function groupHistoryEntries(
  entries: WorkEntry[],
  locale: string,
): HistorySection[] {
  const sortedEntries = [...entries].sort(compareEntriesNewestFirst);
  const sections = new Map<string, HistorySection>();

  for (const entry of sortedEntries) {
    const occurredAt = new Date(entry.occurredAt);
    const key = `${occurredAt.getFullYear()}-${String(
      occurredAt.getMonth() + 1,
    ).padStart(2, '0')}`;
    const current = sections.get(key);

    if (current) {
      current.data.push(entry);
      continue;
    }

    sections.set(key, {
      key,
      title: new Intl.DateTimeFormat(locale, {
        month: 'long',
        year: 'numeric',
      }).format(occurredAt),
      data: [entry],
    });
  }

  return [...sections.values()];
}

export function formatHistoryEntryDate(
  occurredAt: string,
  locale: string,
): string {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
  }).format(new Date(occurredAt));
}

function compareEntriesNewestFirst(left: WorkEntry, right: WorkEntry): number {
  const occurredDifference =
    new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime();

  if (occurredDifference !== 0) {
    return occurredDifference;
  }

  return (
    new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
}
