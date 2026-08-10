import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { useOnboarding } from '@/features/onboarding/useOnboarding';
import { useI18n } from '@/i18n/I18nProvider';

export function RootNavigator() {
  const { theme, resolvedTheme, isHydrated: isThemeHydrated } = useTheme();
  const { isHydrated: isLanguageHydrated } = useI18n();
  const { isHydrated: isOnboardingHydrated } = useOnboarding();
  const isReady = isThemeHydrated && isLanguageHydrated && isOnboardingHydrated;

  useEffect(() => {
    if (isReady) {
      SplashScreen.hide();
    }
  }, [isReady]);

  if (!isReady) {
    return null;
  }

  return (
    <>
      <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: theme.colors.surface },
          headerShown: false,
        }}
      />
    </>
  );
}
