import { fireEvent, render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@/design-system/theme/ThemeProvider';
import type { WorkEntry } from '@/domain/entry/model';
import { HistoryEntryCard } from '@/features/history/components/HistoryEntryCard';

jest.mock('expo-symbols', () => ({
  SymbolView: () => null,
}));

jest.mock('@/i18n/I18nProvider', () => ({
  useI18n: () => ({
    language: 'en',
    t: (key: string) => key,
  }),
}));

function createEntry(overrides: Partial<WorkEntry> = {}): WorkEntry {
  return {
    id: 'entry-1',
    type: 'problem_solved',
    title: 'Resolved reconciliation discrepancies',
    rawNote: 'Found duplicate reconciliation records.',
    impactStatement: 'Removed duplicate records before submission.',
    occurredAt: '2026-08-06T08:00:00.000Z',
    outcomeType: 'error_fixed_or_prevented',
    status: 'review_ready',
    evidence: {
      types: ['number'],
      detail: '7 duplicate entries removed.',
    },
    excludedFromExports: false,
    createdAt: '2026-08-06T08:01:00.000Z',
    updatedAt: '2026-08-06T08:01:00.000Z',
    ...overrides,
  };
}

describe('HistoryEntryCard', () => {
  test('renders persisted evidence and review readiness', async () => {
    await render(
      <ThemeProvider>
        <HistoryEntryCard entry={createEntry()} onPress={jest.fn()} />
      </ThemeProvider>,
    );

    expect(
      screen.getByText('Resolved reconciliation discrepancies'),
    ).toBeTruthy();
    expect(screen.getByText('7 duplicate entries removed.')).toBeTruthy();
    expect(screen.getByText('history.status.reviewReady')).toBeTruthy();
    expect(screen.getByText(/history.type.problemSolved/u)).toBeTruthy();
  });

  test('marks challenge entries as private and remains actionable', async () => {
    const onPress = jest.fn();

    await render(
      <ThemeProvider>
        <HistoryEntryCard
          entry={createEntry({
            type: 'challenge',
            status: 'quick_note',
            excludedFromExports: true,
          })}
          onPress={onPress}
        />
      </ThemeProvider>,
    );

    expect(screen.getByText('history.status.private')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
