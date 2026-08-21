import { render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@/design-system/theme/ThemeProvider';
import { HomeHeader } from '@/features/home/components/HomeHeader';

jest.mock('@/i18n/I18nProvider', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('@/i18n/components/LanguageSelector', () => {
  const { Text } = require('react-native');

  return {
    LanguageSelector: () => <Text>language-selector</Text>,
  };
});

jest.mock('@/design-system/components/ThemeToggleButton', () => {
  const { Text } = require('react-native');

  return {
    ThemeToggleButton: () => <Text>theme-toggle</Text>,
  };
});

describe('HomeHeader', () => {
  test('keeps language and theme preferences available after onboarding', async () => {
    await render(
      <ThemeProvider>
        <HomeHeader />
      </ThemeProvider>,
    );

    expect(screen.getByText('home.eyebrow')).toBeTruthy();
    expect(screen.getByRole('header', { name: 'home.title' })).toBeTruthy();
    expect(screen.getByText('language-selector')).toBeTruthy();
    expect(screen.getByText('theme-toggle')).toBeTruthy();
  });
});
