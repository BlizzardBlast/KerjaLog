import { fireEvent, render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@/design-system/theme/ThemeProvider';
import { EMPTY_WORK_ENTRY_HISTORY_FILTERS } from '@/domain/entry/history';
import { HistoryFilterBar } from '@/features/history/components/HistoryFilterBar';

jest.mock('@/i18n/I18nProvider', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

describe('HistoryFilterBar', () => {
  test('exposes expanded state for the entry-type disclosure', async () => {
    await render(
      <ThemeProvider>
        <HistoryFilterBar
          filters={EMPTY_WORK_ENTRY_HISTORY_FILTERS}
          onEntryTypeChange={jest.fn()}
          onEvidenceToggle={jest.fn()}
          onReviewReadyToggle={jest.fn()}
          onClear={jest.fn()}
        />
      </ThemeProvider>,
    );

    const entryTypeButton = screen.getByRole('button', {
      name: 'history.filters.entryType',
    });

    expect(entryTypeButton.props.accessibilityState).toEqual({
      expanded: false,
      selected: false,
    });

    await fireEvent.press(entryTypeButton);

    expect(
      screen.getByRole('button', { name: 'history.filters.entryType' }).props
        .accessibilityState,
    ).toEqual({ expanded: true, selected: false });
    expect(screen.getByText('history.type.contribution')).toBeTruthy();
  });
});
