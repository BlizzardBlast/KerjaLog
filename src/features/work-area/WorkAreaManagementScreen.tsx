import * as Sentry from '@sentry/react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/design-system/components/Button';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { layout, spacing } from '@/design-system/tokens/theme';
import type { WorkArea } from '@/domain/work-area/model';
import { WorkAreaEditorCard } from '@/features/work-area/components/WorkAreaEditorCard';
import { WorkAreaSection } from '@/features/work-area/components/WorkAreaSection';
import { useWorkAreaMutations } from '@/features/work-area/useWorkAreaMutations';
import { useWorkAreas } from '@/features/work-area/useWorkAreas';
import { useI18n } from '@/i18n/I18nProvider';

function ProfiledWorkAreaManagementScreen() {
  const router = Sentry.wrapExpoRouter(useRouter());
  const { theme } = useTheme();
  const { t } = useI18n();
  const { state, reload } = useWorkAreas({ includeArchived: true });
  const { create, rename, archive } = useWorkAreaMutations({
    onMutated: reload,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [editorError, setEditorError] = useState(false);
  const [archiveError, setArchiveError] = useState(false);
  const active = state.workAreas.filter(
    (workArea) => workArea.archivedAt === null,
  );
  const archived = state.workAreas.filter(
    (workArea) => workArea.archivedAt !== null,
  );
  const editing = active.find((workArea) => workArea.id === editingId) ?? null;
  const hasCatalogData = state.workAreas.length > 0;
  const isInitialLoading = state.status === 'loading' && !hasCatalogData;
  const hasBlockingLoadError = state.status === 'error' && !hasCatalogData;

  const resetEditor = () => {
    setEditingId(null);
    setName('');
    setEditorError(false);
  };

  const startRename = (workArea: WorkArea) => {
    setEditingId(workArea.id);
    setName(workArea.name);
    setEditorError(false);
  };

  const submit = async () => {
    if (!name.trim() || busy || isInitialLoading || hasBlockingLoadError) {
      return;
    }

    setBusy(true);
    setEditorError(false);
    try {
      if (editingId) {
        await rename(editingId, name);
      } else {
        await create(name);
      }
      resetEditor();
    } catch {
      setEditorError(true);
    } finally {
      setBusy(false);
    }
  };

  const confirmArchive = (workArea: WorkArea) => {
    Alert.alert(
      t('workArea.archive.title'),
      t('workArea.archive.description'),
      [
        { text: t('workArea.cancel'), style: 'cancel' },
        {
          text: t('workArea.archive.action'),
          style: 'destructive',
          onPress: () => {
            setBusy(true);
            setArchiveError(false);
            void archive(workArea.id)
              .then(() => {
                if (editingId === workArea.id) resetEditor();
              })
              .catch(() => setArchiveError(true))
              .finally(() => setBusy(false));
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView
      edges={['top', 'bottom', 'left', 'right']}
      style={[styles.screen, { backgroundColor: theme.colors.surface }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heading}>
          <Text variant="overline" color="primary">
            {t('workArea.eyebrow')}
          </Text>
          <Text accessibilityRole="header" variant="title">
            {t('workArea.title')}
          </Text>
          <Text color="textMuted">{t('workArea.description')}</Text>
        </View>

        {isInitialLoading ? (
          <View
            accessibilityLabel={t('workArea.loading')}
            accessibilityRole="progressbar"
            accessibilityState={{ busy: true }}
            style={styles.state}
          >
            <ActivityIndicator color={theme.colors.primary} size="small" />
            <Text color="textMuted">{t('workArea.loading')}</Text>
          </View>
        ) : null}

        {hasBlockingLoadError ? (
          <View style={styles.state}>
            <Text role="alert" color="textMuted">
              {t('workArea.loadError')}
            </Text>
            <Button onPress={reload} variant="secondary">
              {t('workArea.retry')}
            </Button>
          </View>
        ) : null}

        {!isInitialLoading && !hasBlockingLoadError ? (
          <>
            <WorkAreaEditorCard
              busy={busy}
              editing={editing !== null}
              hasError={editorError}
              name={name}
              onCancel={resetEditor}
              onNameChange={(value) => {
                setName(value);
                setEditorError(false);
              }}
              onSubmit={() => {
                void submit();
              }}
            />

            {state.status === 'error' ? (
              <View style={styles.inlineError}>
                <Text role="alert" color="textMuted" variant="caption">
                  {t('workArea.loadError')}
                </Text>
                <Button onPress={reload} size="sm" variant="secondary">
                  {t('workArea.retry')}
                </Button>
              </View>
            ) : null}

            {archiveError ? (
              <Text role="alert" color="danger" variant="caption">
                {t('workArea.mutationError')}
              </Text>
            ) : null}

            <WorkAreaSection
              emptyText={t('workArea.activeEmpty')}
              renderActions={(workArea) => (
                <>
                  <Button
                    disabled={busy}
                    onPress={() => startRename(workArea)}
                    size="sm"
                    variant="secondary"
                  >
                    {t('workArea.renameAction')}
                  </Button>
                  <Button
                    disabled={busy}
                    onPress={() => confirmArchive(workArea)}
                    size="sm"
                    variant="secondary"
                  >
                    {t('workArea.archive.action')}
                  </Button>
                </>
              )}
              title={t('workArea.activeTitle')}
              workAreas={active}
            />

            {archived.length > 0 ? (
              <WorkAreaSection
                emptyText=""
                renderActions={() => null}
                title={t('workArea.archivedTitle')}
                workAreas={archived}
              />
            ) : null}
          </>
        ) : null}

        <Button
          disabled={busy}
          fullWidth
          onPress={() => router.back()}
          variant="secondary"
        >
          {t('workArea.done')}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const WorkAreaManagementScreen = Sentry.withProfiler(
  ProfiledWorkAreaManagementScreen,
);

export { WorkAreaManagementScreen };

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    gap: spacing[6],
    paddingBottom: spacing[8],
    paddingHorizontal: layout.screenHorizontalPadding,
    paddingTop: spacing[5],
  },
  heading: { gap: spacing[2] },
  state: {
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  inlineError: {
    alignItems: 'flex-start',
    gap: spacing[2],
  },
});
