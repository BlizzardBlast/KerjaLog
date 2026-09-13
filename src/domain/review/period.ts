import type { ReviewPeriod, ReviewPeriodPreset } from '@/domain/review/model';

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;

export function getReviewPeriod(
  preset: Exclude<ReviewPeriodPreset, 'custom'>,
  now: Date,
): ReviewPeriod {
  switch (preset) {
    case 'this_month':
      return toMonthPeriod(now.getFullYear(), now.getMonth());
    case 'last_quarter': {
      const currentQuarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
      return toMonthPeriod(now.getFullYear(), currentQuarterStartMonth - 3, 3);
    }
    case 'this_year':
      return {
        startDate: formatLocalDate(new Date(now.getFullYear(), 0, 1)),
        endDate: formatLocalDate(new Date(now.getFullYear(), 11, 31)),
      };
  }
}

export function assertReviewPeriod(period: ReviewPeriod): void {
  if (
    !isLocalCalendarDate(period.startDate) ||
    !isLocalCalendarDate(period.endDate)
  ) {
    throw new Error('Review period dates must be valid local-calendar dates.');
  }

  if (period.startDate > period.endDate) {
    throw new Error('Review period start date must not be after its end date.');
  }
}

export function isLocalCalendarDate(value: unknown): value is string {
  if (typeof value !== 'string' || !DATE_ONLY_PATTERN.test(value)) {
    return false;
  }

  const [yearText, monthText, dayText] = value.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function formatLocalDate(value: Date): string {
  const year = value.getFullYear().toString().padStart(4, '0');
  const month = (value.getMonth() + 1).toString().padStart(2, '0');
  const day = value.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toMonthPeriod(
  year: number,
  month: number,
  lengthInMonths = 1,
): ReviewPeriod {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + lengthInMonths, 0);
  return {
    startDate: formatLocalDate(start),
    endDate: formatLocalDate(end),
  };
}
