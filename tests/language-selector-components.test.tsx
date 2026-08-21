import { fireEvent, render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@/design-system/theme/ThemeProvider';
import { LanguageSelectorMenu } from '@/i18n/components/LanguageSelectorMenu';
import { LanguageSelectorTrigger } from '@/i18n/components/LanguageSelectorTrigger';

const mockAppIcon = jest.fn((_props: unknown) => null);

jest.mock('@/design-system/icons/AppIcon', () => ({
  AppIcon: (props: unknown) => mockAppIcon(props),
}));

jest.mock('@/i18n/I18nProvider', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

describe('language selector components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('trigger exposes expanded state and remains actionable', async () => {
    const onPress = jest.fn();

    await render(
      <ThemeProvider>
        <LanguageSelectorTrigger
          option={{
            value: 'id',
            flag: '🇮🇩',
            shortLabel: 'ID',
            labelKey: 'common.language.indonesian',
          }}
          accessibilityLabel="common.language.change"
          expanded
          onPress={onPress}
        />
      </ThemeProvider>,
    );

    const trigger = screen.getByRole('button', {
      name: 'common.language.change',
    });
    expect(trigger.props.accessibilityState).toEqual({ expanded: true });

    await fireEvent.press(trigger);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('menu exposes radio selection and delegates language changes', async () => {
    const onSelect = jest.fn();

    await render(
      <ThemeProvider>
        <LanguageSelectorMenu
          layout={{ left: 142, top: 128, width: 220 }}
          selectedLanguage="id"
          onDismiss={jest.fn()}
          onSelect={onSelect}
        />
      </ThemeProvider>,
    );

    const english = screen.getByRole('radio', {
      name: 'common.language.english',
    });
    const indonesian = screen.getByRole('radio', {
      name: 'common.language.indonesian',
    });

    expect(english.props.accessibilityState).toEqual({ checked: false });
    expect(indonesian.props.accessibilityState).toEqual({ checked: true });

    await fireEvent.press(english);
    expect(onSelect).toHaveBeenCalledWith('en');
  });
});
