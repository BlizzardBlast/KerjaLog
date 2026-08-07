import { StyleSheet, View } from 'react-native';
import { DecorativeView } from '@/design-system/components/DecorativeView';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing } from '@/design-system/tokens/theme';
import { InfoCard } from '@/features/onboarding/components/InfoCard';
import { LanguageSelector } from '@/features/onboarding/components/LanguageSelector';
import { PrivacyPoint } from '@/features/onboarding/components/PrivacyPoint';
import { StepHeading } from '@/features/onboarding/components/StepHeading';
import { useI18n } from '@/i18n/I18nProvider';

export function WelcomeStep() {
  const { theme } = useTheme();
  const { t } = useI18n();

  return (
    <View style={styles.content}>
      <DecorativeView
        style={[styles.brandMark, { backgroundColor: theme.colors.primary }]}
      >
        <Text variant="display" color="onPrimary" style={styles.brandLetter}>
          K
        </Text>
      </DecorativeView>

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

const styles = StyleSheet.create({
  content: {
    gap: spacing[6],
  },
  brandMark: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: spacing[6],
    height: 78,
    justifyContent: 'center',
    width: 78,
  },
  brandLetter: {
    letterSpacing: -2,
  },
  privacyCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: 14,
    padding: 18,
  },
});
