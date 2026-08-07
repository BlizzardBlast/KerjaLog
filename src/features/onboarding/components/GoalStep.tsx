import { StyleSheet, View } from 'react-native';
import { OptionCard } from '@/design-system/components/OptionCard';
import { OptionSection } from '@/features/onboarding/components/OptionSection';
import { StepHeading } from '@/features/onboarding/components/StepHeading';
import type { OnboardingStepProps } from '@/features/onboarding/components/types';
import { goalOptions } from '@/features/onboarding/options';
import { useI18n } from '@/i18n/I18nProvider';

export function GoalStep({ state, update }: OnboardingStepProps) {
  const { t } = useI18n();

  return (
    <View style={styles.content}>
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
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 24,
  },
});
