import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Button } from '@/design-system/components/Button';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing } from '@/design-system/tokens/theme';
import { SkillEvidenceList } from '@/features/growth/components/SkillEvidenceList';
import type { SkillEvidenceState } from '@/features/growth/useSkillEvidence';
import { useI18n } from '@/i18n/I18nProvider';

type SkillEvidenceContentProps = {
  locale: string;
  state: SkillEvidenceState;
  onRetry: () => void;
  onOpenEntry: (id: string) => void;
};

export function SkillEvidenceContent({
  locale,
  state,
  onRetry,
  onOpenEntry,
}: Readonly<SkillEvidenceContentProps>) {
  const { theme } = useTheme();
  const { t } = useI18n();

  if (state.status === 'loading') {
    return (
      <View
        accessible
        accessibilityLabel={t('growth.detail.loading')}
        accessibilityRole="progressbar"
        accessibilityState={{ busy: true }}
        style={styles.loadingState}
      >
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  if (state.status === 'error') {
    return (
      <View
        accessibilityRole="alert"
        style={[
          styles.stateCard,
          {
            backgroundColor: theme.colors.surfaceSubtle,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Text variant="subheading">{t('growth.detail.error.title')}</Text>
        <Text color="textMuted">{t('growth.detail.error.description')}</Text>
        <Button size="sm" onPress={onRetry}>
          {t('growth.error.retry')}
        </Button>
      </View>
    );
  }

  return (
    <SkillEvidenceList
      locale={locale}
      state={state}
      onOpenEntry={onOpenEntry}
    />
  );
}

const styles = StyleSheet.create({
  loadingState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  stateCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing[3],
    padding: spacing[4],
  },
});
