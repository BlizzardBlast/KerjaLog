import { Manrope_500Medium } from '@expo-google-fonts/manrope/500Medium';
import { Manrope_600SemiBold } from '@expo-google-fonts/manrope/600SemiBold';
import { Manrope_700Bold } from '@expo-google-fonts/manrope/700Bold';
import { Manrope_800ExtraBold } from '@expo-google-fonts/manrope/800ExtraBold';
import { useFonts } from '@expo-google-fonts/manrope/useFonts';
import * as SplashScreen from 'expo-splash-screen';
import { StrictMode } from 'react';
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { ThemeProvider } from '@/design-system/theme/ThemeProvider';
import { AppLockProvider } from '@/features/app-lock/AppLockProvider';
import { OnboardingProvider } from '@/features/onboarding/OnboardingProvider';
import { I18nProvider } from '@/i18n/I18nProvider';
import { RootNavigator } from '@/navigation/RootNavigator';
import { configureNotificationHandling } from '@/platform/notifications/weeklyReflection';
import { EMPTY_FUNCTION } from '@/shared/utils/function';

SplashScreen.preventAutoHideAsync().catch(EMPTY_FUNCTION);
configureNotificationHandling().catch(EMPTY_FUNCTION);

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <StrictMode>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <ThemeProvider>
          <I18nProvider>
            <OnboardingProvider>
              <AppLockProvider>
                <RootNavigator />
              </AppLockProvider>
            </OnboardingProvider>
          </I18nProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </StrictMode>
  );
}
