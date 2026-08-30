import { StyleSheet, View } from 'react-native';
import { OptionCard } from '@/design-system/components/OptionCard';
import { spacing } from '@/design-system/tokens/theme';
import { InfoCard } from '@/features/onboarding/components/InfoCard';
import { OptionSection } from '@/features/onboarding/components/OptionSection';
import { StepHeading } from '@/features/onboarding/components/StepHeading';
import type { OnboardingStepProps } from '@/features/onboarding/components/types';
import {
  careerLevelOptions,
  workAreaOptions,
} from '@/features/onboarding/options';
import { useI18n } from '@/i18n/I18nProvider';

export function WorkContextStep({
  state,
  update,
}: Readonly<OnboardingStepProps>) {
  const { t } = useI18n();

  return (
    <View style={styles.content}>
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
            icon={option.icon}
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
            icon={option.icon}
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
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing[6],
  },
});
