import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing } from '@/design-system/tokens/theme';
import type { SkillEvidenceEntry } from '@/domain/growth/model';
import { SkillEvidenceThreadItem } from '@/features/growth/components/SkillEvidenceThreadItem';
import { formatEvidenceDate } from '@/features/growth/growthPresentation';
import type { SkillEvidenceState } from '@/features/growth/useSkillEvidence';
import { useI18n } from '@/i18n/I18nProvider';

type LoadedSkillEvidenceState = Extract<
  SkillEvidenceState,
  { status: 'loaded' }
>;

type SkillEvidenceListProps = {
  locale: string;
  state: LoadedSkillEvidenceState;
  onOpenEntry: (id: string) => void;
};

export function SkillEvidenceList({
  locale,
  state,
  onOpenEntry,
}: SkillEvidenceListProps) {
  const { theme } = useTheme();
  const { t } = useI18n();
  const countLabel = t(
    state.entries.length === 1
      ? 'growth.detail.supportingOne'
      : 'growth.detail.supportingMany',
    { count: state.entries.length },
  );

  const renderEntry = ({
    item,
    index,
  }: {
    item: SkillEvidenceEntry;
    index: number;
  }) => (
    <SkillEvidenceThreadItem
      entry={item}
      dateLabel={formatEvidenceDate(item.occurredAt, locale)}
      openHint={t('growth.detail.openEntry')}
      isLast={index === state.entries.length - 1}
      onPress={() => onOpenEntry(item.id)}
    />
  );

  return (
    <FlatList
      data={state.entries}
      keyExtractor={(entry) => entry.id}
      renderItem={renderEntry}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
      ListHeaderComponent={
        <View style={styles.headerContent}>
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
              <Text variant="heading">{countLabel}</Text>
              {state.isRefreshing ? (
                <ActivityIndicator
                  accessible
                  accessibilityLabel={t('growth.detail.loading')}
                  accessibilityRole="progressbar"
                  accessibilityState={{ busy: true }}
                  color={theme.colors.primary}
                  size="small"
                />
              ) : null}
            </View>
            <Text color="textMuted">{t('growth.detail.description')}</Text>
          </View>
        </View>
      }
      ListEmptyComponent={
        <View
          style={[
            styles.emptyCard,
            {
              backgroundColor: theme.colors.surfaceSubtle,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text variant="subheading">{t('growth.detail.empty.title')}</Text>
          <Text color="textMuted">{t('growth.detail.empty.description')}</Text>
        </View>
      }
      ListFooterComponent={
        <View
          style={[
            styles.coverageCard,
            { backgroundColor: theme.colors.surfaceSubtle },
          ]}
        >
          <Text variant="bodyStrong">{t('growth.detail.coverageTitle')}</Text>
          <Text color="textMuted">
            {t('growth.detail.coverageDescription')}
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingBottom: spacing[8],
  },
  headerContent: {
    gap: spacing[4],
    marginBottom: spacing[4],
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
  emptyCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing[3],
    marginBottom: spacing[4],
    padding: spacing[4],
  },
  coverageCard: {
    borderRadius: radii.lg,
    gap: spacing[1],
    marginTop: spacing[1],
    padding: spacing[4],
  },
});
