import { useState } from 'react';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/design-system/components/Button';
import { OptionCard } from '@/design-system/components/OptionCard';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import {
  careerLevelOptions,
  goalOptions,
  ONBOARDING_STEP_ORDER,
  reviewScheduleOptions,
  workAreaOptions,
} from '@/features/onboarding/model';
import { useOnboarding } from '@/features/onboarding/useOnboarding';

export function OnboardingScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const {
    state,
    isHydrated,
    currentStepIndex,
    update,
    goNext,
    goBack,
    complete,
  } = useOnboarding();
  const [finishError, setFinishError] = useState<string | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);

  if (!isHydrated) {
    return (
      <SafeAreaView
        edges={['top', 'bottom']}
        style={[styles.loadingScreen, { backgroundColor: theme.colors.canvas }]}
      >
        <ActivityIndicator color={theme.colors.primary} size="small" />
        <Text variant="caption" color="textMuted">
          Loading your setup…
        </Text>
      </SafeAreaView>
    );
  }

  const canContinue = (() => {
    switch (state.currentStep) {
      case 'work-context':
        return Boolean(state.workArea && state.careerLevel);
      case 'goal':
        return Boolean(state.mainGoal);
      case 'review-rhythm':
        return Boolean(state.reviewSchedule);
      default:
        return true;
    }
  })();

  const handlePrimaryAction = async () => {
    if (state.currentStep !== 'review-rhythm') {
      goNext();
      return;
    }

    setFinishError(null);
    setIsFinishing(true);

    try {
      await complete();
      router.replace('/home');
    } catch {
      setFinishError(
        'KerjaLog could not save your setup. Please try again before continuing.',
      );
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.screen, { backgroundColor: theme.colors.canvas }]}
    >
      <View style={styles.topBar}>
        {currentStepIndex > 0 ? (
          <Pressable
            accessibilityLabel="Go to previous setup step"
            accessibilityRole="button"
            hitSlop={4}
            onPress={goBack}
            style={({ pressed }) => [
              styles.backButton,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
              pressed && styles.pressed,
            ]}
          >
            <SymbolView
              name={{
                ios: 'chevron.left',
                android: 'arrow_back',
                web: 'arrow_back',
              }}
              size={20}
              tintColor={theme.colors.text}
            />
          </Pressable>
        ) : (
          <View style={styles.backButtonPlaceholder} />
        )}

        <View
          accessibilityLabel={`Step ${currentStepIndex + 1} of ${ONBOARDING_STEP_ORDER.length}`}
          accessibilityRole="progressbar"
          style={styles.progress}
        >
          {ONBOARDING_STEP_ORDER.map((step, index) => (
            <View
              key={step}
              style={[
                styles.progressSegment,
                {
                  backgroundColor:
                    index <= currentStepIndex
                      ? theme.colors.primary
                      : theme.colors.border,
                },
                index === currentStepIndex && styles.progressSegmentActive,
              ]}
            />
          ))}
        </View>

        <Text variant="caption" color="textMuted" style={styles.stepCount}>
          {currentStepIndex + 1}/4
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="never"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {state.currentStep === 'welcome' ? <WelcomeStep /> : null}

        {state.currentStep === 'work-context' ? (
          <View style={styles.stepContent}>
            <StepHeading
              eyebrow="Personalize KerjaLog"
              title="Tell us about your work"
              description="A little context lets KerjaLog show examples that fit your role. No company or manager details needed."
            />

            <OptionSection title="Work area">
              {workAreaOptions.map((option) => (
                <OptionCard
                  key={option.value}
                  title={option.title}
                  description={option.description}
                  selected={state.workArea === option.value}
                  onPress={() => update({ workArea: option.value })}
                />
              ))}
            </OptionSection>

            <OptionSection title="Current level">
              {careerLevelOptions.map((option) => (
                <OptionCard
                  key={option.value}
                  title={option.title}
                  description={option.description}
                  selected={state.careerLevel === option.value}
                  onPress={() => update({ careerLevel: option.value })}
                />
              ))}
            </OptionSection>

            <InfoCard
              title="Prompts will match your work"
              body="Examples can include fixing an error, improving a process, supporting a teammate, finishing a report, or learning a tool."
            />
          </View>
        ) : null}

        {state.currentStep === 'goal' ? (
          <View style={styles.stepContent}>
            <StepHeading
              eyebrow="Your main goal"
              title="What should KerjaLog help with first?"
              description="Choose one for now. The same work entries can support every goal later."
            />

            <OptionSection title="Choose a starting point">
              {goalOptions.map((option) => (
                <OptionCard
                  key={option.value}
                  title={option.title}
                  description={option.description}
                  selected={state.mainGoal === option.value}
                  onPress={() => update({ mainGoal: option.value })}
                />
              ))}
            </OptionSection>
          </View>
        ) : null}

        {state.currentStep === 'review-rhythm' ? (
          <View style={styles.stepContent}>
            <StepHeading
              eyebrow="Review & reminders"
              title="Set a gentle check-in"
              description="KerjaLog can help you remember to reflect without streaks, points, or guilt."
            />

            <OptionSection title="When is your next review likely to be?">
              {reviewScheduleOptions.map((option) => (
                <OptionCard
                  key={option.value}
                  title={option.title}
                  description={option.description}
                  selected={state.reviewSchedule === option.value}
                  onPress={() => update({ reviewSchedule: option.value })}
                />
              ))}
            </OptionSection>

            <SettingToggle
              title="Weekly reflection reminder"
              description="A short reminder to capture what moved forward that week."
              value={state.weeklyReminderEnabled}
              onValueChange={(weeklyReminderEnabled) =>
                update({ weeklyReminderEnabled })
              }
            />

            <SettingToggle
              title="Prefer biometric or PIN app lock"
              description="We will ask before enabling device protection when that feature is configured."
              value={state.appLockPreferred}
              onValueChange={(appLockPreferred) => update({ appLockPreferred })}
            />

            <InfoCard
              title="Private from the start"
              body="Your setup stays on this device. KerjaLog does not need your employer, manager, salary, or workplace documents."
            />

            {finishError ? (
              <View
                accessibilityLiveRegion="polite"
                style={[
                  styles.errorCard,
                  {
                    backgroundColor: theme.colors.dangerSoft,
                    borderColor: theme.colors.danger,
                  },
                ]}
              >
                <Text variant="caption" color="danger">
                  {finishError}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
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
          onPress={() => void handlePrimaryAction()}
          size="lg"
        >
          {state.currentStep === 'welcome'
            ? 'Set up KerjaLog'
            : state.currentStep === 'review-rhythm'
              ? 'Finish setup'
              : 'Continue'}
        </Button>

        {state.currentStep === 'review-rhythm' ? (
          <Text variant="caption" color="textMuted" style={styles.footerNote}>
            You can change review timing, reminders, and app protection later.
          </Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function WelcomeStep() {
  const { theme } = useTheme();

  return (
    <View style={styles.stepContent}>
      <View
        accessibilityElementsHidden
        style={[styles.brandMark, { backgroundColor: theme.colors.primary }]}
      >
        <Text variant="display" color="onPrimary" style={styles.brandLetter}>
          K
        </Text>
      </View>

      <StepHeading
        eyebrow="Private work-growth companion"
        title="Turn everyday work into evidence of progress"
        description="You do not need to know how to describe your value. KerjaLog helps you discover it from the work you already do."
      />

      <View
        style={[
          styles.privacyCard,
          {
            backgroundColor: theme.colors.primarySoft,
            borderColor: theme.colors.primary,
          },
        ]}
      >
        <Text variant="heading">Private from day one</Text>
        <PrivacyPoint text="Your setup and work log stay local by default" />
        <PrivacyPoint text="No employer or manager access" />
        <PrivacyPoint text="App-lock preference is part of setup" />
      </View>

      <InfoCard
        title="Small work counts too"
        body="Helping a teammate, fixing an error, learning a process, handling a difficult moment, or making routine work clearer can all become useful evidence."
      />
    </View>
  );
}

function StepHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.headingBlock}>
      <Text variant="overline" color="primary">
        {eyebrow}
      </Text>
      <Text variant="title">{title}</Text>
      <Text variant="body" color="textMuted">
        {description}
      </Text>
    </View>
  );
}

function OptionSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.optionSection} accessibilityRole="radiogroup">
      <Text variant="label" color="textMuted">
        {title}
      </Text>
      <View style={styles.optionList}>{children}</View>
    </View>
  );
}

function InfoCard({ title, body }: { title: string; body: string }) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.infoCard,
        {
          backgroundColor: theme.colors.surfaceSubtle,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Text variant="bodyStrong">{title}</Text>
      <Text variant="caption" color="textMuted" style={styles.cardBody}>
        {body}
      </Text>
    </View>
  );
}

function PrivacyPoint({ text }: { text: string }) {
  const { theme } = useTheme();

  return (
    <View style={styles.privacyPoint}>
      <View style={[styles.privacyDot, { backgroundColor: theme.colors.primary }]} />
      <Text variant="body" style={styles.privacyText}>
        {text}
      </Text>
    </View>
  );
}

function SettingToggle({
  title,
  description,
  value,
  onValueChange,
}: {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.settingRow,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View style={styles.settingCopy}>
        <Text variant="bodyStrong">{title}</Text>
        <Text variant="caption" color="textMuted" style={styles.description}>
          {description}
        </Text>
      </View>
      <Switch
        accessibilityLabel={title}
        ios_backgroundColor={theme.colors.surfaceMuted}
        onValueChange={onValueChange}
        thumbColor={theme.colors.surface}
        trackColor={{
          false: theme.colors.surfaceMuted,
          true: theme.colors.primary,
        }}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  loadingScreen: {
    alignItems: 'center',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    minHeight: 60,
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  backButton: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  backButtonPlaceholder: {
    height: 48,
    width: 48,
  },
  pressed: {
    opacity: 0.72,
  },
  progress: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  progressSegment: {
    borderRadius: 999,
    flex: 1,
    height: 4,
  },
  progressSegmentActive: {
    flexGrow: 1.6,
  },
  stepCount: {
    minWidth: 30,
    textAlign: 'right',
  },
  scrollContent: {
    paddingBottom: 28,
    paddingHorizontal: 22,
    paddingTop: 14,
  },
  stepContent: {
    gap: 24,
  },
  brandMark: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 24,
    height: 78,
    justifyContent: 'center',
    width: 78,
  },
  brandLetter: {
    letterSpacing: -2,
  },
  headingBlock: {
    gap: 10,
  },
  privacyCard: {
    borderRadius: 20,
    borderWidth: 1,
    gap: 14,
    padding: 18,
  },
  privacyPoint: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  privacyDot: {
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  privacyText: {
    flex: 1,
  },
  infoCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  cardBody: {
    marginTop: 5,
  },
  optionSection: {
    gap: 10,
  },
  optionList: {
    gap: 10,
  },
  settingRow: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 16,
    minHeight: 82,
    padding: 16,
  },
  settingCopy: {
    flex: 1,
    minWidth: 0,
  },
  description: {
    marginTop: 3,
  },
  errorCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 22,
    paddingTop: 14,
  },
  footerNote: {
    marginTop: 8,
    textAlign: 'center',
  },
});
