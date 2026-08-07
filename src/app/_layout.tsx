import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '@/design-system/theme/ThemeProvider';
import { I18nProvider, useI18n } from '@/i18n/I18nProvider';

void SplashScreen.preventAutoHideAsync().catch(() => {
  // Hot reload or platform lifecycle can make this a no-op.
});

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <I18nProvider>
          <RootNavigator />
        </I18nProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const { theme, resolvedTheme, isHydrated: isThemeHydrated } = useTheme();
  const { isHydrated: isLanguageHydrated } = useI18n();
  const isReady = isThemeHydrated && isLanguageHydrated;

  useEffect(() => {
    if (!isReady) {
      return;
    }

    void SplashScreen.hideAsync().catch(() => {
      // The app is already ready to render even if splash dismissal is stale.
    });
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
