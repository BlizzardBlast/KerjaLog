import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Button } from '@/design-system/components/Button';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii } from '@/design-system/tokens/theme';
import type { SkillEvidenceSummary } from '@/domain/growth/model';
import { GrowthEvidenceMapLoadedContent } from '@/features/growth/components/GrowthEvidenceMapLoadedContent';
import type { GrowthEvidenceMapState } from '@/features/growth/useGrowthEvidenceMap';
import { useI18n } from '@/i18n/I18nProvider';

type GrowthEvidenceMapContentProps = {
  state: GrowthEvidenceMapState;
  onRetry: () => void;
  onOpenSkill: (skillId: SkillEvidenceSummary['skillId']) => void;
};

export function GrowthEvidenceMapContent({
  state,
  onRetry,
  onOpenSkill,
}: GrowthEvidenceMapContentProps) {
  const { theme } = useTheme();
  const { t } = useI18n();

  if (state.status === 'loading') {
    return (
      <View
        accessible
        accessibilityLabel={t('growth.loading')}
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
        <Text variant="subheading">{t('growth.error.title')}</Text>
        <Text color="textMuted">{t('growth.error.description')}</Text>
        <Button size="sm" onPress={onRetry}>
          {t('growth.error.retry')}
        </Button>
      </View>
    );
  }

  return (
    <GrowthEvidenceMapLoadedContent
      state={state}
      onOpenSkill={onOpenSkill}
    />
  );
}

const styles = StyleSheet.create({
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 240,
  },
  stateCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
});
