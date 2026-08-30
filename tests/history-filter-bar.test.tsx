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
          workAreas={[]}
          onEntryTypeChange={jest.fn()}
          onWorkAreaChange={jest.fn()}
          onManageWorkAreas={jest.fn()}
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

  test('discloses work areas and management when the catalog is available', async () => {
    const onWorkAreaChange = jest.fn();
    const onManageWorkAreas = jest.fn();

    await render(
      <ThemeProvider>
        <HistoryFilterBar
          filters={EMPTY_WORK_ENTRY_HISTORY_FILTERS}
          workAreas={[
            {
              id: 'area-reporting',
              name: 'Monthly Reporting',
              archivedAt: null,
              createdAt: '2026-08-30T01:00:00.000Z',
              updatedAt: '2026-08-30T01:00:00.000Z',
            },
          ]}
          onEntryTypeChange={jest.fn()}
          onWorkAreaChange={onWorkAreaChange}
          onManageWorkAreas={onManageWorkAreas}
          onEvidenceToggle={jest.fn()}
          onReviewReadyToggle={jest.fn()}
          onClear={jest.fn()}
        />
      </ThemeProvider>,
    );

    await fireEvent.press(
      screen.getByRole('button', { name: 'history.filters.workArea' }),
    );
    await fireEvent.press(
      screen.getByRole('button', { name: 'Monthly Reporting' }),
    );

    expect(onWorkAreaChange).toHaveBeenCalledWith('area-reporting');
    expect(
      screen.getByRole('button', { name: 'workArea.manage' }),
    ).toBeTruthy();
  });
});
