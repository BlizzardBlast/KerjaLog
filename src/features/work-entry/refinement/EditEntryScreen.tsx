import * as Sentry from '@sentry/react-native';
import { useRouter } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/design-system/components/Button';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { spacing } from '@/design-system/tokens/theme';
import { EntryRefinementEditor } from '@/features/work-entry/refinement/EntryRefinementEditor';
import { useWorkEntry } from '@/features/work-entry/useWorkEntry';
import { useI18n } from '@/i18n/I18nProvider';

const SAFE_AREA_EDGES = ['top', 'bottom', 'left', 'right'] as const;

type EditEntryScreenProps = {
  id: string;
};

function ProfiledEditEntryScreen({ id }: EditEntryScreenProps) {
  const router = Sentry.wrapExpoRouter(useRouter());
  const { theme } = useTheme();
  const { t } = useI18n();
  const { state, retry } = useWorkEntry(id);

  if (state.status === 'loading') {
    const loadingLabel = t('entry.refine.loading');

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
        <Text
          accessibilityRole="header"
          variant="title"
          style={styles.centeredText}
        >
          {t('entry.refine.notFoundTitle')}
        </Text>
        <Text variant="body" color="textMuted" style={styles.centeredText}>
          {t('entry.refine.notFoundDescription')}
        </Text>
        <Button onPress={() => router.replace('/history')}>
          {t('entry.refine.back')}
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
        <Text
          accessibilityRole="header"
          variant="title"
          style={styles.centeredText}
        >
          {t('entry.refine.errorTitle')}
        </Text>
        <Text
          accessibilityLiveRegion="polite"
          color="textMuted"
          role="alert"
          style={styles.centeredText}
          variant="body"
        >
          {t('entry.refine.errorDescription')}
        </Text>
        <View style={styles.errorActions}>
          <Button fullWidth onPress={retry}>
            {t('entry.refine.retry')}
          </Button>
          <Button
            fullWidth
            onPress={() => router.replace('/history')}
            variant="secondary"
          >
            {t('entry.refine.back')}
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <EntryRefinementEditor
      key={`${state.entry.id}:${state.entry.updatedAt}`}
      entry={state.entry}
    />
  );
}

const EditEntryScreen = Sentry.withProfiler(ProfiledEditEntryScreen);

export { EditEntryScreen };

const styles = StyleSheet.create({
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
});
