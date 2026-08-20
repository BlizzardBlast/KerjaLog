import { fireEvent, render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@/design-system/theme/ThemeProvider';
import type { WorkEntry } from '@/domain/entry/model';
import { HistoryEntryCard } from '@/features/history/components/HistoryEntryCard';

const mockSymbolView = jest.fn((_props: unknown) => null);

jest.mock('expo-symbols', () => ({
  SymbolView: (props: unknown) => mockSymbolView(props),
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
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders persisted evidence and exposes the detail-navigation hint', async () => {
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
    expect(screen.getByRole('button').props.accessibilityLabel).toBeUndefined();
    expect(screen.getByRole('button').props.accessibilityHint).toBe(
      'history.entry.openHint',
    );
  });

  test('marks excluded entries as private even when their current type is not challenge', async () => {
    const onPress = jest.fn();

    await render(
      <ThemeProvider>
        <HistoryEntryCard
          entry={createEntry({
            type: 'contribution',
            status: 'developed',
            excludedFromExports: true,
          })}
          onPress={onPress}
        />
      </ThemeProvider>,
    );

    const privateLabel = screen.getByText('history.status.private');
    expect(privateLabel).toBeTruthy();
    expect(privateLabel.props.numberOfLines).toBeUndefined();
    expect(
      mockSymbolView.mock.calls.some(([props]) => {
        const { name } = props as { name?: unknown };

        return (
          JSON.stringify(name) ===
          JSON.stringify({ ios: 'lock.fill', android: 'lock', web: 'lock' })
        );
      }),
    ).toBe(true);

    await fireEvent.press(screen.getByRole('button'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
