import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Button } from '@/design-system/components/Button';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing } from '@/design-system/tokens/theme';
import type { HistoryEntriesState } from '@/features/history/useHistoryEntries';
import { useI18n } from '@/i18n/I18nProvider';

type HistoryEmptyContentProps = {
  hasActiveQuery: boolean;
  isSearchPending: boolean;
  onRetry: () => void;
  status: 'loading' | 'loaded' | 'error';
};

export function HistoryEmptyContent({
  hasActiveQuery,
  isSearchPending,
  onRetry,
  status,
}: Readonly<HistoryEmptyContentProps>) {
  const { theme } = useTheme();
  const { t } = useI18n();

  if (status === 'loading' || isSearchPending) {
    return (
      <View
        accessible
        accessibilityLabel={t(
          isSearchPending ? 'history.updating' : 'history.loading',
        )}
        accessibilityRole="progressbar"
        accessibilityState={{ busy: true }}
        style={styles.stateContainer}
      >
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  if (status === 'error') {
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
        <Text variant="heading">{t('history.error.title')}</Text>
        <Text color="textMuted">{t('history.error.description')}</Text>
        <Button size="sm" onPress={onRetry} style={styles.retryButton}>
          {t('history.error.retry')}
        </Button>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.stateCard,
        {
          backgroundColor: theme.colors.surfaceSubtle,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Text variant="subheading">
        {t(hasActiveQuery ? 'history.noMatches.title' : 'history.empty.title')}
      </Text>
      <Text color="textMuted">
        {t(
          hasActiveQuery
            ? 'history.noMatches.description'
            : 'history.empty.description',
        )}
      </Text>
    </View>
  );
}

type HistoryListFooterProps = {
  isSearchPending: boolean;
  onRetry: () => void;
  state: HistoryEntriesState;
};

export function HistoryListFooter({
  isSearchPending,
  onRetry,
  state,
}: Readonly<HistoryListFooterProps>) {
  const { theme } = useTheme();
  const { t } = useI18n();

  if (
    state.entries.length > 0 &&
    (isSearchPending || state.status === 'loading')
  ) {
    return (
      <ActivityIndicator
        accessible
        accessibilityLabel={t('history.updating')}
        accessibilityRole="progressbar"
        accessibilityState={{ busy: true }}
        color={theme.colors.primary}
        style={styles.footerLoader}
      />
    );
  }

  if (state.status === 'loaded' && state.isLoadingMore) {
    return (
      <ActivityIndicator
        accessible
        accessibilityLabel={t('history.loadingMore')}
        accessibilityRole="progressbar"
        accessibilityState={{ busy: true }}
        color={theme.colors.primary}
        style={styles.footerLoader}
      />
    );
  }

  if (state.status === 'loaded' && state.loadMoreError) {
    return (
      <View accessibilityRole="alert" style={styles.loadMoreError}>
        <Text variant="caption" color="textMuted">
          {t('history.loadMoreError')}
        </Text>
        <Button
          size="sm"
          variant="secondary"
          onPress={onRetry}
          style={styles.loadMoreRetryButton}
        >
          {t('history.loadMoreRetry')}
        </Button>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  stateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
  },
  stateCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing[2],
    padding: spacing[5],
  },
  retryButton: {
    alignSelf: 'flex-start',
    marginTop: spacing[2],
  },
  footerLoader: {
    marginTop: spacing[4],
  },
  loadMoreError: {
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[4],
  },
  loadMoreRetryButton: {
    alignSelf: 'center',
  },
});
