import * as Sentry from '@sentry/react-native';
import { useRouter } from 'expo-router';
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
import { WorkAreaEditorCard } from '@/features/work-area/components/WorkAreaEditorCard';
import { WorkAreaSection } from '@/features/work-area/components/WorkAreaSection';
import { useWorkAreaManagement } from '@/features/work-area/useWorkAreaManagement';
import { useI18n } from '@/i18n/I18nProvider';

function ProfiledWorkAreaManagementScreen() {
  const router = Sentry.wrapExpoRouter(useRouter());
  const { theme } = useTheme();
  const { t } = useI18n();
  const controller = useWorkAreaManagement();

  const confirmArchive = (workAreaId: string) => {
    Alert.alert(
      t('workArea.archive.title'),
      t('workArea.archive.description'),
      [
        { text: t('workArea.cancel'), style: 'cancel' },
        {
          text: t('workArea.archive.action'),
          style: 'destructive',
          onPress: () => {
            void controller.archive(workAreaId);
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

        {controller.isInitialLoading ? (
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

        {controller.hasBlockingLoadError ? (
          <View style={styles.state}>
            <Text role="alert" color="textMuted">
              {t('workArea.loadError')}
            </Text>
            <Button onPress={controller.reload} variant="secondary">
              {t('workArea.retry')}
            </Button>
          </View>
        ) : null}

        {!controller.isInitialLoading && !controller.hasBlockingLoadError ? (
          <>
            <WorkAreaEditorCard
              busy={controller.isMutating}
              editing={controller.editor.mode === 'rename'}
              hasMutationError={controller.error === 'editor'}
              initialName={controller.editor.initialName}
              key={controller.editor.revision}
              onCancel={controller.resetEditor}
              onNameChange={controller.clearEditorError}
              onSubmitName={controller.submit}
            />

            {controller.state.status === 'error' ? (
              <View style={styles.inlineError}>
                <Text role="alert" color="textMuted" variant="caption">
                  {t('workArea.loadError')}
                </Text>
                <Button
                  onPress={controller.reload}
                  size="sm"
                  variant="secondary"
                >
                  {t('workArea.retry')}
                </Button>
              </View>
            ) : null}

            {controller.error === 'archive' ? (
              <Text role="alert" color="danger" variant="caption">
                {t('workArea.mutationError')}
              </Text>
            ) : null}

            <WorkAreaSection
              emptyText={t('workArea.activeEmpty')}
              renderActions={(workArea) => (
                <>
                  <Button
                    disabled={controller.isMutating}
                    onPress={() => controller.startRename(workArea)}
                    size="sm"
                    variant="secondary"
                  >
                    {t('workArea.renameAction')}
                  </Button>
                  <Button
                    disabled={controller.isMutating}
                    onPress={() => confirmArchive(workArea.id)}
                    size="sm"
                    variant="destructive"
                  >
                    {t('workArea.archive.action')}
                  </Button>
                </>
              )}
              title={t('workArea.activeTitle')}
              workAreas={controller.activeWorkAreas}
            />

            {controller.archivedWorkAreas.length > 0 ? (
              <WorkAreaSection
                emptyText=""
                renderActions={() => null}
                title={t('workArea.archivedTitle')}
                workAreas={controller.archivedWorkAreas}
              />
            ) : null}
          </>
        ) : null}

        <Button
          disabled={controller.isMutating}
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
