import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { loadOnboardingState } from '@/features/onboarding/storage';

export default function AppEntryRoute() {
  const { theme } = useTheme();
  const [isReady, setIsReady] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    let isActive = true;

    loadOnboardingState().then((state) => {
      if (!isActive) {
        return;
      }

      setHasCompletedOnboarding(state.completed);
      setIsReady(true);
    });

    return () => {
      isActive = false;
    };
  }, []);

  if (!isReady) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.colors.canvas }]}>
        <ActivityIndicator color={theme.colors.primary} size="small" />
        <Text variant="caption" color="textMuted">
          Opening KerjaLog…
        </Text>
      </View>
    );
  }

  return <Redirect href={hasCompletedOnboarding ? '/home' : '/onboarding'} />;
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
  },
});
