import { fireEvent, render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@/design-system/theme/ThemeProvider';
import { themes } from '@/design-system/tokens/theme';
import { HistorySearchField } from '@/features/history/components/HistorySearchField';

const mockAppIcon = jest.fn((_props: unknown) => null);

jest.mock('@/design-system/icons/AppIcon', () => ({
  AppIcon: (props: unknown) => mockAppIcon(props),
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

  test('uses search semantics, accessible control borders, and app icons', async () => {
    const onChangeText = jest.fn();

    await render(
      <ThemeProvider>
        <HistorySearchField value="finance" onChangeText={onChangeText} />
      </ThemeProvider>,
    );

    const input = screen.getByRole('search', { name: 'history.search.label' });
    expect(input).toHaveStyle({
      borderColor: themes.light.colors.controlBorder,
    });

    await fireEvent(input, 'focus');
    expect(input).toHaveStyle({
      borderColor: themes.light.colors.controlBorderFocused,
    });

    await fireEvent(input, 'blur');
    expect(input).toHaveStyle({
      borderColor: themes.light.colors.controlBorder,
    });

    const iconNames = mockAppIcon.mock.calls.map(([props]) => {
      const { name } = props as { name?: unknown };
      return name;
    });

    expect(iconNames).toContainEqual({
      ios: 'magnifyingglass',
      android: 'search',
    });
    expect(iconNames).toContainEqual({
      ios: 'xmark.circle.fill',
      android: 'cancel',
    });

    await fireEvent.press(
      screen.getByRole('button', { name: 'history.search.clear' }),
    );
    expect(onChangeText).toHaveBeenCalledWith('');
  });
});
