import * as Sentry from '@sentry/react-native';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { SectionList, StyleSheet, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { layout, spacing } from '@/design-system/tokens/theme';
import { hasWorkEntryHistoryFilters } from '@/domain/entry/history';
import type { WorkEntry } from '@/domain/entry/model';
import { HistoryEntryCard } from '@/features/history/components/HistoryEntryCard';
import { HistoryFilterBar } from '@/features/history/components/HistoryFilterBar';
import {
  HistoryEmptyContent,
  HistoryListFooter,
} from '@/features/history/components/HistoryListStateContent';
import { HistorySearchField } from '@/features/history/components/HistorySearchField';
import {
  groupHistoryEntries,
  type HistorySection,
} from '@/features/history/historyGrouping';
import { useHistoryEntries } from '@/features/history/useHistoryEntries';
import { useI18n } from '@/i18n/I18nProvider';

function ProfiledHistoryScreen() {
  const router = Sentry.wrapExpoRouter(useRouter());
  const { theme } = useTheme();
  const { language, t } = useI18n();
  const insets = useSafeAreaInsets();
  const controller = useHistoryEntries();
  const locale = language === 'id' ? 'id-ID' : 'en-US';
  const sections = useMemo(
    () => groupHistoryEntries(controller.state.entries, locale),
    [controller.state.entries, locale],
  );
  const hasActiveQuery =
    controller.searchText.trim().length > 0 ||
    hasWorkEntryHistoryFilters(controller.filters);
  const openEntry = (id: string) =>
    router.push({ pathname: '/entry/[id]', params: { id } });

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.screen, { backgroundColor: theme.colors.surface }]}
    >
      <SectionList<WorkEntry, HistorySection>
        sections={sections}
        keyExtractor={(entry) => entry.id}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        onEndReached={controller.loadMore}
        onEndReachedThreshold={0.5}
        stickySectionHeadersEnabled={false}
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
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <View style={styles.heading}>
              <Text variant="overline" color="primary">
                {t('history.eyebrow')}
              </Text>
              <Text accessibilityRole="header" variant="title">
                {t('history.title')}
              </Text>
              <Text color="textMuted">{t('history.description')}</Text>
            </View>
            <HistorySearchField
              value={controller.searchText}
              onChangeText={controller.setSearchText}
            />
            <HistoryFilterBar
              filters={controller.filters}
              onEntryTypeChange={controller.setEntryType}
              onEvidenceToggle={controller.toggleEvidence}
              onReviewReadyToggle={controller.toggleReviewReady}
              onClear={controller.clearFilters}
            />
          </View>
        }
        renderSectionHeader={({ section }) => (
          <HistoryMonthHeader section={section} />
        )}
        renderItem={({ item }) => (
          <HistoryEntryCard entry={item} onPress={() => openEntry(item.id)} />
        )}
        ItemSeparatorComponent={EntrySeparator}
        ListEmptyComponent={
          <HistoryEmptyContent
            hasActiveQuery={hasActiveQuery}
            isSearchPending={controller.isSearchPending}
            onRetry={controller.retry}
            status={controller.state.status}
          />
        }
        ListFooterComponent={
          <HistoryListFooter
            isSearchPending={controller.isSearchPending}
            onRetry={controller.retryLoadMore}
            state={controller.state}
          />
        }
      />
    </SafeAreaView>
  );
}

const HistoryScreen = Sentry.withProfiler(ProfiledHistoryScreen);

export { HistoryScreen };

function HistoryMonthHeader({
  section,
}: Readonly<{ section: HistorySection }>) {
  return (
    <View style={styles.monthHeader}>
      <Text accessibilityRole="header" variant="heading">
        {section.title}
      </Text>
    </View>
  );
}

function EntrySeparator() {
  return <View style={styles.entrySeparator} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing[8],
    paddingTop: spacing[5],
  },
  headerContent: {
    gap: spacing[5],
    marginBottom: spacing[5],
  },
  heading: {
    gap: spacing[2],
  },
  monthHeader: {
    paddingBottom: spacing[3],
    paddingTop: spacing[5],
  },
  entrySeparator: {
    height: spacing[3],
  },
});
