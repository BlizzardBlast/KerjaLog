import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/design-system/components/Button';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { spacing } from '@/design-system/tokens/theme';
import { OnboardingHeader } from '@/features/onboarding/components/OnboardingHeader';
import { ONBOARDING_STEP_CONFIG } from '@/features/onboarding/stepConfig';
import { useOnboarding } from '@/features/onboarding/useOnboarding';
import { useI18n } from '@/i18n/I18nProvider';

export function OnboardingScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useI18n();
  const {
    state,
    isHydrated,
    currentStepIndex,
    update,
    goNext,
    goBack,
    complete,
  } = useOnboarding();
  const [hasFinishError, setHasFinishError] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  if (!isHydrated) {
    return (
      <SafeAreaView
        edges={['top', 'bottom']}
        style={[styles.loadingScreen, { backgroundColor: theme.colors.canvas }]}
      >
        <ActivityIndicator color={theme.colors.primary} size="small" />
        <Text variant="caption" color="textMuted">
          {t('common.loading.setup')}
        </Text>
      </SafeAreaView>
    );
  }

  const stepConfig = ONBOARDING_STEP_CONFIG[state.currentStep];
  const CurrentStep = stepConfig.Component;
  const canContinue = stepConfig.canContinue(state);

  const handlePrimaryAction = async () => {
    if (!stepConfig.isFinal) {
      goNext();
      return;
    }

    setHasFinishError(false);
    setIsFinishing(true);

    try {
      await complete();
      router.replace('/home');
    } catch {
      const message = t('onboarding.review.saveError');
      setHasFinishError(true);
      AccessibilityInfo.announceForAccessibility(message);
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.screen, { backgroundColor: theme.colors.canvas }]}
    >
      <OnboardingHeader currentStepIndex={currentStepIndex} onBack={goBack} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="never"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <CurrentStep
          state={state}
          update={update}
          hasFinishError={hasFinishError}
        />
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: theme.colors.canvas,
            borderTopColor: theme.colors.border,
          },
        ]}
      >
        <Button
          fullWidth
          loading={isFinishing}
          disabled={!canContinue}
          onPress={handlePrimaryAction}
          size="lg"
        >
          {t(stepConfig.primaryActionKey)}
        </Button>

        {stepConfig.isFinal ? (
          <Text variant="caption" color="textMuted" style={styles.footerNote}>
            {t('onboarding.review.footerNote')}
          </Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  loadingScreen: {
    alignItems: 'center',
    flex: 1,
    gap: spacing[3],
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 28,
    paddingHorizontal: 22,
    paddingTop: 14,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 22,
    paddingTop: 14,
  },
  footerNote: {
    marginTop: spacing[2],
    textAlign: 'center',
  },
});
