import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '@/design-system/theme/ThemeProvider';
import { I18nProvider, useI18n } from '@/i18n/I18nProvider';
import { EMPTY_FUNCTION } from '@/shared/utils/function';

void SplashScreen.preventAutoHideAsync().catch(EMPTY_FUNCTION);

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
