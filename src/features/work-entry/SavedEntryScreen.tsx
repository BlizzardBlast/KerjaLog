import { useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/design-system/components/Button';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { spacing } from '@/design-system/tokens/theme';
import type { EntryStatus } from '@/domain/entry/model';
import { EntrySection } from '@/features/work-entry/components/EntrySection';
import { StatusChip } from '@/features/work-entry/components/StatusChip';
import { getOutcomeLabel } from '@/features/work-entry/outcomeLabel';
import { useWorkEntry } from '@/features/work-entry/useWorkEntry';
import type { TranslationKey } from '@/i18n/catalog';
import { useI18n } from '@/i18n/I18nProvider';

type SavedEntryScreenProps = {
  id: string;
};

const statusLabelKeyByStatus: Record<EntryStatus, TranslationKey> = {
  quick_note: 'log.saved.quickNote',
  developed: 'log.saved.developed',
  review_ready: 'log.saved.reviewReady',
};

export function SavedEntryScreen({ id }: SavedEntryScreenProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useI18n();
  const { state, retry } = useWorkEntry(id);

  if (state.status === 'loading') {
    return (
      <SafeAreaView
        edges={['top', 'bottom']}
        style={[styles.centered, { backgroundColor: theme.colors.surface }]}
      >
        <ActivityIndicator color={theme.colors.primary} size="small" />
        <Text variant="body" color="textMuted">
          {t('log.saved.loading')}
        </Text>
      </SafeAreaView>
    );
  }

  if (state.status === 'not-found') {
    return (
      <SafeAreaView
        edges={['top', 'bottom']}
        style={[styles.centered, { backgroundColor: theme.colors.surface }]}
      >
        <Text variant="title" style={styles.centeredText}>
          {t('log.saved.notFoundTitle')}
        </Text>
        <Text variant="body" color="textMuted" style={styles.centeredText}>
          {t('log.saved.notFoundDescription')}
        </Text>
        <Button onPress={() => router.replace('/home')}>
          {t('log.saved.backHome')}
        </Button>
      </SafeAreaView>
    );
  }

  if (state.status === 'error') {
    return (
      <SafeAreaView
        edges={['top', 'bottom']}
        style={[styles.centered, { backgroundColor: theme.colors.surface }]}
      >
        <Text variant="title" style={styles.centeredText}>
          {t('log.saved.errorTitle')}
        </Text>
        <Text
          role="alert"
          accessibilityLiveRegion="polite"
          variant="body"
          color="textMuted"
          style={styles.centeredText}
        >
          {t('log.saved.errorDescription')}
        </Text>
        <View style={styles.errorActions}>
          <Button fullWidth onPress={retry}>
            {t('log.saved.retry')}
          </Button>
          <Button
            fullWidth
            onPress={() => router.replace('/home')}
            variant="secondary"
          >
            {t('log.saved.backHome')}
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const { entry } = state;
  const outcomeLabel = entry.outcomeType
    ? getOutcomeLabel(entry.outcomeType, t)
    : t('log.impact.notKnown');

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.screen, { backgroundColor: theme.colors.surface }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heading}>
          <Text variant="overline" color="primary">
            {t('log.saved.eyebrow')}
          </Text>
          <Text variant="title">{entry.title}</Text>
          <View style={styles.chips}>
            <StatusChip
              label={t(statusLabelKeyByStatus[entry.status])}
              tone={entry.status === 'review_ready' ? 'success' : 'neutral'}
            />
            {entry.excludedFromExports ? (
              <StatusChip label={t('log.saved.private')} tone="warning" />
            ) : null}
          </View>
        </View>

        <EntrySection
          title={t('log.saved.originalNote')}
          value={entry.rawNote}
        />
        <EntrySection title={t('log.saved.outcome')} value={outcomeLabel} />
        {entry.evidence ? (
          <EntrySection
            title={t('log.saved.evidence')}
            value={entry.evidence.detail}
          />
        ) : null}
        {entry.impactStatement ? (
          <EntrySection
            title={t('log.saved.impact')}
            value={entry.impactStatement}
            emphasized
          />
        ) : null}

        <Button fullWidth onPress={() => router.replace('/home')} size="lg">
          {t('log.saved.backHome')}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    gap: spacing[4],
    justifyContent: 'center',
    padding: spacing[6],
  },
  centeredText: {
    textAlign: 'center',
  },
  errorActions: {
    alignSelf: 'stretch',
    gap: spacing[2],
    maxWidth: 360,
    width: '100%',
  },
  content: {
    gap: spacing[4],
    paddingBottom: spacing[8],
    paddingHorizontal: 22,
    paddingTop: spacing[5],
  },
  heading: {
    gap: spacing[2],
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
});
