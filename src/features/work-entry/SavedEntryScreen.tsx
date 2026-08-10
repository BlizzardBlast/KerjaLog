import { useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/design-system/components/Button';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing, type ThemeColors } from '@/design-system/tokens/theme';
import type { EntryStatus, OutcomeType } from '@/domain/entry/model';
import { outcomeOptions } from '@/features/work-entry/model';
import { useWorkEntry } from '@/features/work-entry/useWorkEntry';
import type { TranslationKey } from '@/i18n/catalog';
import { useI18n } from '@/i18n/I18nProvider';

type SavedEntryScreenProps = {
  id: string;
};

type Translate = (
  key: TranslationKey,
  params?: Record<string, string | number>,
) => string;

const statusLabelKeyByStatus: Record<EntryStatus, TranslationKey> = {
  quick_note: 'log.saved.quickNote',
  developed: 'log.saved.developed',
  review_ready: 'log.saved.reviewReady',
};

export function SavedEntryScreen({ id }: SavedEntryScreenProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useI18n();
  const state = useWorkEntry(id);

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

  if (state.status === 'not-found' || state.status === 'error') {
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

function EntrySection({
  title,
  value,
  emphasized = false,
}: {
  title: string;
  value: string;
  emphasized?: boolean;
}) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: emphasized
            ? theme.colors.primarySoft
            : theme.colors.surface,
          borderColor: emphasized ? theme.colors.primary : theme.colors.border,
        },
      ]}
    >
      <Text variant="overline" color={emphasized ? 'primary' : 'textMuted'}>
        {title}
      </Text>
      <Text variant={emphasized ? 'bodyStrong' : 'body'}>{value}</Text>
    </View>
  );
}

function StatusChip({
  label,
  tone,
}: {
  label: string;
  tone: 'success' | 'warning' | 'neutral';
}) {
  const { theme } = useTheme();
  let backgroundColor = theme.colors.surfaceSubtle;
  let textColor: keyof ThemeColors = 'textMuted';

  if (tone === 'success') {
    backgroundColor = theme.colors.successSoft;
    textColor = 'success';
  } else if (tone === 'warning') {
    backgroundColor = theme.colors.warningSoft;
    textColor = 'warning';
  }

  return (
    <View style={[styles.chip, { backgroundColor }]}>
      <Text variant="caption" color={textColor}>
        {label}
      </Text>
    </View>
  );
}

function getOutcomeLabel(outcomeType: OutcomeType, t: Translate): string {
  if (outcomeType === 'unsure') {
    return t('log.impact.notKnown');
  }

  const option = outcomeOptions.find(
    (candidate) => candidate.value === outcomeType,
  );
  return option ? t(option.titleKey) : t('log.impact.notKnown');
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
  chip: {
    borderRadius: radii.full,
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
  },
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing[2],
    padding: spacing[4],
  },
});
