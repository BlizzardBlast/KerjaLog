import { type ReactNode, useState } from 'react';
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
import { ONBOARDING_STEP_ORDER } from '@/features/onboarding/model';
import {
  careerLevelOptions,
  goalOptions,
  reviewScheduleOptions,
  workAreaOptions,
} from '@/features/onboarding/options';
import { useOnboarding } from '@/features/onboarding/useOnboarding';
import { useI18n, type Language } from '@/i18n/I18nProvider';
import type { TranslationKey } from '@/i18n/translations';

const languageOptions: ReadonlyArray<{
  value: Language;
  labelKey: TranslationKey;
}> = [
  { value: 'en', labelKey: 'onboarding.language.english' },
  { value: 'id', labelKey: 'onboarding.language.indonesian' },
];

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

    setHasFinishError(false);
    setIsFinishing(true);

    try {
      await complete();
      router.replace('/home');
    } catch {
      setHasFinishError(true);
    } finally {
      setIsFinishing(false);
    }
  };

  const progressText = t('onboarding.progress', {
    current: currentStepIndex + 1,
    total: ONBOARDING_STEP_ORDER.length,
  });

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.screen, { backgroundColor: theme.colors.canvas }]}
    >
      <View style={styles.topBar}>
        {currentStepIndex > 0 ? (
          <Pressable
            accessibilityLabel={t('onboarding.back')}
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
          accessibilityLabel={progressText}
          accessibilityRole="progressbar"
          accessibilityValue={{
            min: 1,
            max: ONBOARDING_STEP_ORDER.length,
            now: currentStepIndex + 1,
            text: progressText,
          }}
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
          {currentStepIndex + 1}/{ONBOARDING_STEP_ORDER.length}
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
              eyebrow={t('onboarding.workContext.eyebrow')}
              title={t('onboarding.workContext.title')}
              description={t('onboarding.workContext.description')}
            />

            <OptionSection title={t('onboarding.workContext.workArea')}>
              {workAreaOptions.map((option) => (
                <OptionCard
                  key={option.value}
                  title={t(option.titleKey)}
                  description={t(option.descriptionKey)}
                  selected={state.workArea === option.value}
                  onPress={() => update({ workArea: option.value })}
                />
              ))}
            </OptionSection>

            <OptionSection title={t('onboarding.workContext.currentLevel')}>
              {careerLevelOptions.map((option) => (
                <OptionCard
                  key={option.value}
                  title={t(option.titleKey)}
                  description={t(option.descriptionKey)}
                  selected={state.careerLevel === option.value}
                  onPress={() => update({ careerLevel: option.value })}
                />
              ))}
            </OptionSection>

            <InfoCard
              title={t('onboarding.workContext.promptsTitle')}
              body={t('onboarding.workContext.promptsDescription')}
            />
          </View>
        ) : null}

        {state.currentStep === 'goal' ? (
          <View style={styles.stepContent}>
            <StepHeading
              eyebrow={t('onboarding.goal.eyebrow')}
              title={t('onboarding.goal.title')}
              description={t('onboarding.goal.description')}
            />

            <OptionSection title={t('onboarding.goal.section')}>
              {goalOptions.map((option) => (
                <OptionCard
                  key={option.value}
                  title={t(option.titleKey)}
                  description={t(option.descriptionKey)}
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
              eyebrow={t('onboarding.review.eyebrow')}
              title={t('onboarding.review.title')}
              description={t('onboarding.review.description')}
            />

            <OptionSection title={t('onboarding.review.scheduleSection')}>
              {reviewScheduleOptions.map((option) => (
                <OptionCard
                  key={option.value}
                  title={t(option.titleKey)}
                  description={t(option.descriptionKey)}
                  selected={state.reviewSchedule === option.value}
                  onPress={() => update({ reviewSchedule: option.value })}
                />
              ))}
            </OptionSection>

            <SettingToggle
              title={t('onboarding.review.weeklyReminderTitle')}
              description={t('onboarding.review.weeklyReminderDescription')}
              value={state.weeklyReminderEnabled}
              onValueChange={(weeklyReminderEnabled) =>
                update({ weeklyReminderEnabled })
              }
            />

            <SettingToggle
              title={t('onboarding.review.appLockTitle')}
              description={t('onboarding.review.appLockDescription')}
              value={state.appLockPreferred}
              onValueChange={(appLockPreferred) => update({ appLockPreferred })}
            />

            <InfoCard
              title={t('onboarding.review.privacyTitle')}
              body={t('onboarding.review.privacyDescription')}
            />

            {hasFinishError ? (
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
                  {t('onboarding.review.saveError')}
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
            ? t('common.action.startSetup')
            : state.currentStep === 'review-rhythm'
              ? t('common.action.finishSetup')
              : t('common.action.continue')}
        </Button>

        {state.currentStep === 'review-rhythm' ? (
          <Text variant="caption" color="textMuted" style={styles.footerNote}>
            {t('onboarding.review.footerNote')}
          </Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function WelcomeStep() {
  const { theme } = useTheme();
  const { t } = useI18n();

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

      <LanguageSelector />

      <StepHeading
        eyebrow={t('onboarding.welcome.eyebrow')}
        title={t('onboarding.welcome.title')}
        description={t('onboarding.welcome.description')}
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
        <Text variant="heading">{t('onboarding.welcome.privacyTitle')}</Text>
        <PrivacyPoint text={t('onboarding.welcome.privacyLocal')} />
        <PrivacyPoint text={t('onboarding.welcome.privacyEmployer')} />
        <PrivacyPoint text={t('onboarding.welcome.privacyLock')} />
      </View>

      <InfoCard
        title={t('onboarding.welcome.smallWorkTitle')}
        body={t('onboarding.welcome.smallWorkDescription')}
      />
    </View>
  );
}

function LanguageSelector() {
  const { theme } = useTheme();
  const { language, setLanguage, t } = useI18n();

  return (
    <View style={styles.languageSection} accessibilityRole="radiogroup">
      <Text variant="label" color="textMuted">
        {t('onboarding.language.title')}
      </Text>
      <View style={styles.languageOptions}>
        {languageOptions.map((option) => {
          const selected = language === option.value;

          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              onPress={() => setLanguage(option.value)}
              style={({ pressed }) => [
                styles.languageOption,
                {
                  backgroundColor: selected
                    ? theme.colors.primary
                    : theme.colors.surface,
                  borderColor: selected
                    ? theme.colors.primary
                    : theme.colors.border,
                },
                pressed && styles.pressed,
              ]}
            >
              <Text
                variant="label"
                color={selected ? 'onPrimary' : 'text'}
                style={styles.languageLabel}
              >
                {t(option.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>
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
  children: ReactNode;
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
        accessibilityHint={description}
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
  languageSection: {
    gap: 10,
  },
  languageOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  languageOption: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  languageLabel: {
    textAlign: 'center',
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
