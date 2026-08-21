import * as Sentry from '@sentry/react-native';
import { useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Button } from '@/design-system/components/Button';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { layout, radii, spacing } from '@/design-system/tokens/theme';
import type { SkillEvidenceSummary } from '@/domain/growth/model';
import { skillDefinitionById } from '@/domain/skill/catalog';
import { GrowthSkillRow } from '@/features/growth/components/GrowthSkillRow';
import {
  getGrowthSkillDescriptionKey,
  getGrowthSkillSymbol,
} from '@/features/growth/growthPresentation';
import {
  type GrowthEvidenceMapState,
  useGrowthEvidenceMap,
} from '@/features/growth/useGrowthEvidenceMap';
import { useI18n } from '@/i18n/I18nProvider';

function ProfiledGrowthScreen() {
  const router = Sentry.wrapExpoRouter(useRouter());
  const { theme } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const controller = useGrowthEvidenceMap();

  const openSkill = (skillId: SkillEvidenceSummary['skillId']) => {
    router.push({ pathname: '/growth/[skillId]', params: { skillId } });
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.screen, { backgroundColor: theme.colors.surface }]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingLeft: Math.max(insets.left, layout.screenHorizontalPadding),
            paddingRight: Math.max(
              insets.right,
              layout.screenHorizontalPadding,
            ),
          },
        ]}
      >
        <View style={styles.heading}>
          <Text variant="overline" color="primary">
            {t('growth.eyebrow')}
          </Text>
          <Text accessibilityRole="header" variant="title">
            {t('growth.title')}
          </Text>
          <Text color="textMuted">{t('growth.description')}</Text>
        </View>

        <GrowthBody
          state={controller.state}
          onRetry={controller.retry}
          onOpenSkill={openSkill}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const GrowthScreen = Sentry.withProfiler(ProfiledGrowthScreen);

export { GrowthScreen };

type GrowthBodyProps = {
  state: GrowthEvidenceMapState;
  onRetry: () => void;
  onOpenSkill: (skillId: SkillEvidenceSummary['skillId']) => void;
};

function GrowthBody({ state, onRetry, onOpenSkill }: GrowthBodyProps) {
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
            {t('growth.summary.entries', {
              count: state.evidenceMap.totalEntries,
            })}
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
          {t('growth.summary.skillAreas', { count: skillAreaCount })}
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
                symbol={getGrowthSkillSymbol(summary.skillId)}
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
  screen: {
    flex: 1,
  },
  content: {
    gap: spacing[5],
    paddingBottom: spacing[8],
    paddingTop: spacing[5],
  },
  heading: {
    gap: spacing[2],
  },
  loadedContent: {
    gap: spacing[4],
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 240,
  },
  stateCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing[3],
    padding: spacing[4],
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
