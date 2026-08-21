import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Button } from '@/design-system/components/Button';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing } from '@/design-system/tokens/theme';
import { SkillEvidenceThreadItem } from '@/features/growth/components/SkillEvidenceThreadItem';
import { formatEvidenceDate } from '@/features/growth/growthPresentation';
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
}: SkillEvidenceContentProps) {
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

  const countLabel = t(
    state.entries.length === 1
      ? 'growth.detail.supportingOne'
      : 'growth.detail.supportingMany',
    { count: state.entries.length },
  );

  return (
    <View style={styles.body}>
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

      {state.entries.length === 0 ? (
        <View
          style={[
            styles.stateCard,
            {
              backgroundColor: theme.colors.surfaceSubtle,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text variant="subheading">{t('growth.detail.empty.title')}</Text>
          <Text color="textMuted">{t('growth.detail.empty.description')}</Text>
        </View>
      ) : (
        <View style={styles.thread}>
          {state.entries.map((entry, index) => (
            <SkillEvidenceThreadItem
              key={entry.id}
              entry={entry}
              dateLabel={formatEvidenceDate(entry.occurredAt, locale)}
              openHint={t('growth.detail.openEntry')}
              isLast={index === state.entries.length - 1}
              onPress={() => onOpenEntry(entry.id)}
            />
          ))}
        </View>
      )}

      <View
        style={[
          styles.coverageCard,
          { backgroundColor: theme.colors.surfaceSubtle },
        ]}
      >
        <Text variant="bodyStrong">{t('growth.detail.coverageTitle')}</Text>
        <Text color="textMuted">{t('growth.detail.coverageDescription')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
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
  thread: {
    paddingTop: spacing[1],
  },
  coverageCard: {
    borderRadius: radii.lg,
    gap: spacing[1],
    padding: spacing[4],
  },
});
