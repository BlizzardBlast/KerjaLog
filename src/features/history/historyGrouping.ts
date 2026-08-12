import type { WorkEntry } from '@/domain/entry/model';

export type HistorySection = {
  key: string;
  title: string;
  data: WorkEntry[];
};

/**
 * Groups entries that are already ordered newest-first by the repository.
 * Keeping ordering in the data layer avoids duplicating pagination semantics in UI code.
 */
export function groupHistoryEntries(
  entries: readonly WorkEntry[],
  locale: string,
): HistorySection[] {
  const sections = new Map<string, HistorySection>();

  for (const entry of entries) {
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
