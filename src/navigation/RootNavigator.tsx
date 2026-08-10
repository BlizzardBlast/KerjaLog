import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { AppLockScreen } from '@/features/app-lock/AppLockScreen';
import { useAppLock } from '@/features/app-lock/AppLockProvider';
import { useOnboarding } from '@/features/onboarding/useOnboarding';
import { useI18n } from '@/i18n/I18nProvider';

export function RootNavigator() {
  const { theme, resolvedTheme, isHydrated: isThemeHydrated } = useTheme();
  const { isHydrated: isLanguageHydrated } = useI18n();
  const { state: onboardingState, isHydrated: isOnboardingHydrated } =
    useOnboarding();
  const {
    enabled: appLockEnabled,
    locked: appLocked,
    isHydrated: isAppLockHydrated,
  } = useAppLock();
  const isReady =
    isThemeHydrated &&
    isLanguageHydrated &&
    isOnboardingHydrated &&
    isAppLockHydrated;

  useEffect(() => {
    if (isReady) {
      SplashScreen.hide();
    }
  }, [isReady]);

  if (!isReady) {
    return null;
  }

  const statusBarStyle = resolvedTheme === 'dark' ? 'light' : 'dark';

  if (onboardingState.completed && appLockEnabled && appLocked) {
    return (
      <>
        <StatusBar style={statusBarStyle} />
        <AppLockScreen />
      </>
    );
  }

  return (
    <>
      <StatusBar style={statusBarStyle} />
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
