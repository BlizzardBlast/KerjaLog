import type { WorkEntry } from '@/domain/entry/model';

export type HistorySection = {
  key: string;
  title: string;
  data: WorkEntry[];
};

const monthFormatters = new Map<string, Intl.DateTimeFormat>();
const entryDateFormatters = new Map<string, Intl.DateTimeFormat>();

/**
 * Groups entries that are already ordered newest-first by the repository.
 * Keeping ordering in the data layer avoids duplicating pagination semantics in UI code.
 */
export function groupHistoryEntries(
  entries: readonly WorkEntry[],
  locale: string,
): HistorySection[] {
  const sections = new Map<string, HistorySection>();
  const monthFormatter = getMonthFormatter(locale);

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
      title: monthFormatter.format(occurredAt),
      data: [entry],
    });
  }

  return [...sections.values()];
}

export function formatHistoryEntryDate(
  occurredAt: string,
  locale: string,
): string {
  return getEntryDateFormatter(locale).format(new Date(occurredAt));
}

function getMonthFormatter(locale: string): Intl.DateTimeFormat {
  let formatter = monthFormatters.get(locale);

  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, {
      month: 'long',
      year: 'numeric',
    });
    monthFormatters.set(locale, formatter);
  }

  return formatter;
}

function getEntryDateFormatter(locale: string): Intl.DateTimeFormat {
  let formatter = entryDateFormatters.get(locale);

  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
    });
    entryDateFormatters.set(locale, formatter);
  }

  return formatter;
}
