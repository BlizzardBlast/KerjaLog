import { useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/design-system/components/Button';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { layout, radii, spacing } from '@/design-system/tokens/theme';
import type { EntryStatus } from '@/domain/entry/model';
import { skillDefinitionById } from '@/domain/skill/catalog';
import { EntrySection } from '@/features/work-entry/components/EntrySection';
import { StatusChip } from '@/features/work-entry/components/StatusChip';
import { ThreadNode } from '@/features/work-entry/components/ThreadNode';
import { getOutcomeLabel } from '@/features/work-entry/outcomeLabel';
import { useWorkEntry } from '@/features/work-entry/useWorkEntry';
import type { TranslationKey } from '@/i18n/catalog';
import { useI18n } from '@/i18n/I18nProvider';

type SavedEntryScreenProps = {
  id: string;
};

const SAFE_AREA_EDGES = ['top', 'bottom', 'left', 'right'] as const;

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
    const loadingLabel = t('log.saved.loading');

    return (
      <SafeAreaView
        accessible
        accessibilityLabel={loadingLabel}
        accessibilityRole="progressbar"
        accessibilityState={{ busy: true }}
        edges={SAFE_AREA_EDGES}
        style={[styles.centered, { backgroundColor: theme.colors.surface }]}
      >
        <ActivityIndicator color={theme.colors.primary} size="small" />
        <Text variant="body" color="textMuted">
          {loadingLabel}
        </Text>
      </SafeAreaView>
    );
  }

  if (state.status === 'not-found') {
    return (
      <SafeAreaView
        edges={SAFE_AREA_EDGES}
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
        edges={SAFE_AREA_EDGES}
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
  const skillsSummary =
    entry.skills.length > 0
      ? entry.skills
          .map((skill) => t(skillDefinitionById[skill.id].nameKey))
          .join(' · ')
      : t('entry.refine.skills.none');

  return (
    <SafeAreaView
      edges={SAFE_AREA_EDGES}
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

        <View
          style={[
            styles.threadCard,
            {
              backgroundColor: theme.colors.primarySoft,
              borderColor: theme.colors.primary,
            },
          ]}
        >
          <ThreadNode
            label={t('log.impact.whatHappened')}
            value={entry.rawNote}
          />
          <ThreadNode
            label={t('log.impact.whatChanged')}
            value={outcomeLabel}
          />
          <ThreadNode
            label={t('log.impact.whatSupports')}
            value={entry.evidence?.detail ?? t('log.impact.noEvidence')}
          />
          <ThreadNode
            label={t('entry.saved.whatDemonstrates')}
            value={skillsSummary}
          />
        </View>

        <EntrySection
          title={t('log.saved.originalNote')}
          value={entry.rawNote}
        />
        {entry.impactStatement ? (
          <EntrySection
            title={t('log.saved.impact')}
            value={entry.impactStatement}
            emphasized
          />
        ) : null}

        <View style={styles.actions}>
          <Button
            fullWidth
            onPress={() =>
              router.push({
                pathname: '/entry/[id]/edit',
                params: { id: entry.id },
              })
            }
            size="lg"
          >
            {t(
              entry.status === 'quick_note'
                ? 'entry.saved.develop'
                : 'entry.saved.edit',
            )}
          </Button>
          <Button
            fullWidth
            onPress={() => router.replace('/home')}
            size="lg"
            variant="secondary"
          >
            {t('log.saved.backHome')}
          </Button>
        </View>
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
    paddingHorizontal: layout.screenHorizontalPadding,
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
  threadCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    gap: spacing[3],
    padding: spacing[4],
  },
  actions: {
    gap: spacing[2],
  },
});
