import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing } from '@/design-system/tokens/theme';
import type { SkillEvidenceSummary } from '@/domain/growth/model';
import { skillDefinitionById } from '@/domain/skill/catalog';
import { GrowthSkillRow } from '@/features/growth/components/GrowthSkillRow';
import {
  getGrowthSkillDescriptionKey,
  getGrowthSkillIcon,
} from '@/features/growth/growthPresentation';
import type { GrowthEvidenceMapState } from '@/features/growth/useGrowthEvidenceMap';
import { useI18n } from '@/i18n/I18nProvider';

type LoadedGrowthEvidenceMapState = Extract<
  GrowthEvidenceMapState,
  { status: 'loaded' }
>;

type GrowthEvidenceMapLoadedContentProps = {
  state: LoadedGrowthEvidenceMapState;
  onOpenSkill: (skillId: SkillEvidenceSummary['skillId']) => void;
};

export function GrowthEvidenceMapLoadedContent({
  state,
  onOpenSkill,
}: Readonly<GrowthEvidenceMapLoadedContentProps>) {
  const { theme } = useTheme();
  const { t } = useI18n();
  const skillAreaCount = state.evidenceMap.skills.filter(
    (skill) => skill.entryCount > 0,
  ).length;

  return (
    <View style={styles.loadedContent}>
      {state.refreshError ? (
        <View
          accessibilityRole="alert"
          style={[
            styles.refreshNotice,
            {
              backgroundColor: theme.colors.warningSoft,
              borderColor: theme.colors.warning,
            },
          ]}
        >
          <Text variant="caption" color="textMuted">
            {t('growth.refreshError')}
          </Text>
        </View>
      ) : null}

      <View
        style={[
          styles.summaryCard,
          {
            backgroundColor: theme.colors.primarySoft,
            borderColor: theme.colors.primary,
          },
        ]}
      >
        <View style={styles.summaryTopRow}>
          <Text variant="overline" color="primary">
            {t(
              state.evidenceMap.totalEntries === 1
                ? 'growth.summary.entryOne'
                : 'growth.summary.entryMany',
              { count: state.evidenceMap.totalEntries },
            )}
          </Text>
          {state.isRefreshing ? (
            <ActivityIndicator
              accessible
              accessibilityLabel={t('growth.loading')}
              accessibilityRole="progressbar"
              accessibilityState={{ busy: true }}
              color={theme.colors.primary}
              size="small"
            />
          ) : null}
        </View>
        <Text variant="heading">
          {t(
            skillAreaCount === 1
              ? 'growth.summary.skillAreaOne'
              : 'growth.summary.skillAreaMany',
            { count: skillAreaCount },
          )}
        </Text>
        <Text color="textMuted">{t('growth.summary.hint')}</Text>
      </View>

      <View
        style={[
          styles.skillCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        {state.evidenceMap.skills.map((summary, index) => {
          const hasEvidence = summary.entryCount > 0;
          const definition = skillDefinitionById[summary.skillId];
          const description = hasEvidence
            ? t(getGrowthSkillDescriptionKey(summary.skillId))
            : t('growth.skill.none');
          const countLabel = hasEvidence
            ? t(
                summary.entryCount === 1
                  ? 'growth.skill.entryOne'
                  : 'growth.skill.entryMany',
                { count: summary.entryCount },
              )
            : '—';

          return (
            <View key={summary.skillId}>
              <GrowthSkillRow
                name={t(definition.nameKey)}
                description={description}
                icon={getGrowthSkillIcon(summary.skillId)}
                countLabel={countLabel}
                disabled={!hasEvidence}
                onPress={() => onOpenSkill(summary.skillId)}
              />
              {index < state.evidenceMap.skills.length - 1 ? (
                <View
                  accessible={false}
                  style={[
                    styles.separator,
                    { backgroundColor: theme.colors.border },
                  ]}
                />
              ) : null}
            </View>
          );
        })}
      </View>

      <View
        style={[
          styles.guidanceCard,
          { backgroundColor: theme.colors.surfaceSubtle },
        ]}
      >
        <Text variant="bodyStrong">{t('growth.guidance.title')}</Text>
        <Text color="textMuted">{t('growth.guidance.description')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadedContent: {
    gap: spacing[4],
  },
  refreshNotice: {
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing[3],
  },
  summaryCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing[2],
    padding: spacing[4],
  },
  summaryTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[3],
    justifyContent: 'space-between',
  },
  skillCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    overflow: 'hidden',
    paddingHorizontal: spacing[1],
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: spacing[3],
  },
  guidanceCard: {
    borderRadius: radii.lg,
    gap: spacing[1],
    padding: spacing[4],
  },
});
