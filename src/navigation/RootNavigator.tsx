import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Modal } from 'react-native';
import { useAppIconFontReady } from '@/design-system/icons/useAppIconFontReady';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { useAppLock } from '@/features/app-lock/AppLockProvider';
import { AppLockScreen } from '@/features/app-lock/AppLockScreen';
import { useOnboarding } from '@/features/onboarding/useOnboarding';
import { useI18n } from '@/i18n/I18nProvider';
import { useWeeklyReflectionNotificationNavigation } from '@/navigation/useWeeklyReflectionNotificationNavigation';

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
  const areAppIconsReady = useAppIconFontReady();
  const isReady =
    areAppIconsReady &&
    isThemeHydrated &&
    isLanguageHydrated &&
    isOnboardingHydrated &&
    isAppLockHydrated;

  useWeeklyReflectionNotificationNavigation(isReady);

  useEffect(() => {
    if (isReady) {
      SplashScreen.hide();
    }
  }, [isReady]);

  if (!isReady) {
    return null;
  }

  const statusBarStyle = resolvedTheme === 'dark' ? 'light' : 'dark';
  const shouldShowAppLock =
    onboardingState.completed && appLockEnabled && appLocked;

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
      <Modal
        animationType="none"
        onRequestClose={() => undefined}
        presentationStyle="fullScreen"
        visible={shouldShowAppLock}
      >
        <AppLockScreen />
      </Modal>
    </>
  );
}
