import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { useOnboarding } from '@/features/onboarding/useOnboarding';
import { useI18n } from '@/i18n/I18nProvider';
import { EMPTY_FUNCTION } from '@/shared/utils/function';

export function RootNavigator() {
  const { theme, resolvedTheme, isHydrated: isThemeHydrated } = useTheme();
  const { isHydrated: isLanguageHydrated } = useI18n();
  const { isHydrated: isOnboardingHydrated } = useOnboarding();
  const isReady =
    isThemeHydrated && isLanguageHydrated && isOnboardingHydrated;

  useEffect(() => {
    if (!isReady) {
      return;
    }

    SplashScreen.hideAsync().catch(EMPTY_FUNCTION);
  }, [isReady]);

  if (!isReady) {
    return null;
  }

  return (
    <>
      <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: theme.colors.canvas },
          headerShown: false,
        }}
      />
    </>
  );
}
