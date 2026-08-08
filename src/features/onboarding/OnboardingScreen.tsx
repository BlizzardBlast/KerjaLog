import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Button } from '@/design-system/components/Button';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { spacing } from '@/design-system/tokens/theme';
import { OnboardingHeader } from '@/features/onboarding/components/OnboardingHeader';
import {
  OnboardingStepTransition,
  type OnboardingTransitionDirection,
} from '@/features/onboarding/components/OnboardingStepTransition';
import { ONBOARDING_STEP_CONFIG } from '@/features/onboarding/stepConfig';
import { useOnboarding } from '@/features/onboarding/useOnboarding';
import { useI18n } from '@/i18n/I18nProvider';
import { screenScrollBoundaryStyle } from '@/shared/styles/scroll';

const SCREEN_HORIZONTAL_PADDING = 22;

export function OnboardingScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const {
    state,
    isHydrated,
    currentStepIndex,
    update,
    goNext,
    goBack,
    complete,
  } = useOnboarding();
  const scrollRef = useRef<ScrollView>(null);
  const [hasFinishError, setHasFinishError] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [transitionDirection, setTransitionDirection] =
    useState<OnboardingTransitionDirection>('forward');

  if (!isHydrated) {
    return (
      <SafeAreaView
        edges={['top', 'bottom']}
        style={[
          styles.loadingScreen,
          { backgroundColor: theme.colors.surface },
        ]}
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
  const horizontalPadding = {
    paddingLeft: Math.max(insets.left, SCREEN_HORIZONTAL_PADDING),
    paddingRight: Math.max(insets.right, SCREEN_HORIZONTAL_PADDING),
  };

  const resetScroll = () => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const handleBack = () => {
    setTransitionDirection('backward');
    resetScroll();
    goBack();
  };

  const handlePrimaryAction = async () => {
    if (!stepConfig.isFinal) {
      setTransitionDirection('forward');
      resetScroll();
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
      edges={['top']}
      style={[styles.screen, { backgroundColor: theme.colors.surface }]}
    >
      <OnboardingHeader
        currentStepIndex={currentStepIndex}
        onBack={handleBack}
      />

      <ScrollView
        ref={scrollRef}
        style={[styles.scrollView, screenScrollBoundaryStyle]}
        contentContainerStyle={[styles.scrollContent, horizontalPadding]}
        contentInsetAdjustmentBehavior="never"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <OnboardingStepTransition
          step={state.currentStep}
          direction={transitionDirection}
        >
          <CurrentStep
            state={state}
            update={update}
            hasFinishError={hasFinishError}
          />
        </OnboardingStepTransition>
      </ScrollView>

      <View
        style={[
          styles.footer,
          horizontalPadding,
          {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
            paddingBottom: Math.max(insets.bottom, spacing[4]),
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
  scrollView: {
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {
    paddingBottom: spacing[8],
    paddingTop: 14,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 14,
  },
  footerNote: {
    marginTop: spacing[2],
    textAlign: 'center',
  },
});
