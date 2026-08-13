import { fireEvent, render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@/design-system/theme/ThemeProvider';
import { HistorySearchField } from '@/features/history/components/HistorySearchField';

const mockSymbolView = jest.fn((_props: unknown) => null);

jest.mock('expo-symbols', () => ({
  SymbolView: (props: unknown) => mockSymbolView(props),
}));

jest.mock('@/i18n/I18nProvider', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

describe('HistorySearchField', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('uses search semantics and cross-platform symbol names', async () => {
    const onChangeText = jest.fn();

    await render(
      <ThemeProvider>
        <HistorySearchField value="finance" onChangeText={onChangeText} />
      </ThemeProvider>,
    );

    expect(
      screen.getByRole('search', { name: 'history.search.label' }),
    ).toBeTruthy();

    const symbolNames = mockSymbolView.mock.calls.map(([props]) => {
      const { name } = props as { name?: unknown };
      return name;
    });

    expect(symbolNames).toContainEqual({
      ios: 'magnifyingglass',
      android: 'search',
      web: 'search',
    });
    expect(symbolNames).toContainEqual({
      ios: 'xmark.circle.fill',
      android: 'cancel',
      web: 'cancel',
    });

    await fireEvent.press(
      screen.getByRole('button', { name: 'history.search.clear' }),
    );
    expect(onChangeText).toHaveBeenCalledWith('');
  });
});
