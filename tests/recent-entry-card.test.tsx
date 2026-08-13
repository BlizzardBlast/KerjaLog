import { fireEvent, render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@/design-system/theme/ThemeProvider';
import type { WorkEntry } from '@/domain/entry/model';
import { RecentEntryCard } from '@/features/home/components/RecentEntryCard';

const entry: WorkEntry = {
  id: 'entry-1',
  type: 'problem_solved',
  title: 'Resolved reconciliation discrepancies',
  rawNote: 'Found duplicate reconciliation records.',
  impactStatement: 'Removed duplicate records before submission.',
  occurredAt: '2026-08-06T08:00:00.000Z',
  outcomeType: 'error_fixed_or_prevented',
  status: 'review_ready',
  evidence: null,
  excludedFromExports: false,
  createdAt: '2026-08-06T08:01:00.000Z',
  updatedAt: '2026-08-06T08:01:00.000Z',
};

describe('RecentEntryCard', () => {
  test('keeps title and note available to assistive technology', async () => {
    const onPress = jest.fn();

    await render(
      <ThemeProvider>
        <RecentEntryCard entry={entry} onPress={onPress} />
      </ThemeProvider>,
    );

    const button = screen.getByRole('button');
    expect(button.props.accessibilityLabel).toBeUndefined();
    expect(screen.getByText(entry.title)).toBeTruthy();
    expect(screen.getByText(entry.rawNote)).toBeTruthy();

    await fireEvent.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
