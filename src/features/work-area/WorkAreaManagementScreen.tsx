import * as Sentry from '@sentry/react-native';
import { useRouter } from 'expo-router';
import { type ReactNode, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { workAreaRepository } from '@/data/repositories/workAreaRepository';
import { Button } from '@/design-system/components/Button';
import { Text } from '@/design-system/components/Text';
import { TextField } from '@/design-system/components/TextField';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { layout, radii, spacing } from '@/design-system/tokens/theme';
import type { WorkArea } from '@/domain/work-area/model';
import { WORK_AREA_NAME_MAX_LENGTH } from '@/domain/work-area/validation';
import { useWorkAreas } from '@/features/work-area/useWorkAreas';
import { useI18n } from '@/i18n/I18nProvider';

function ProfiledWorkAreaManagementScreen() {
  const router = Sentry.wrapExpoRouter(useRouter());
  const { theme } = useTheme();
  const { t } = useI18n();
  const { state, reload } = useWorkAreas({ includeArchived: true });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [mutationError, setMutationError] = useState(false);
  const active = state.workAreas.filter((workArea) => workArea.archivedAt === null);
  const archived = state.workAreas.filter(
    (workArea) => workArea.archivedAt !== null,
  );
  const editing = active.find((workArea) => workArea.id === editingId) ?? null;

  const resetEditor = () => {
    setEditingId(null);
    setName('');
    setMutationError(false);
  };

  const startRename = (workArea: WorkArea) => {
    setEditingId(workArea.id);
    setName(workArea.name);
    setMutationError(false);
  };

  const submit = async () => {
    if (!name.trim() || busy) return;

    setBusy(true);
    setMutationError(false);
    try {
      if (editingId) {
        await workAreaRepository.rename(editingId, name);
      } else {
        await workAreaRepository.create(name);
      }
      resetEditor();
      reload();
    } catch {
      setMutationError(true);
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
            setMutationError(false);
            void workAreaRepository
              .archive(workArea.id)
              .then(() => {
                if (editingId === workArea.id) resetEditor();
                reload();
              })
              .catch(() => setMutationError(true))
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

        <View
          style={[
            styles.editor,
            {
              backgroundColor: theme.colors.surfaceSubtle,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text variant="heading">
            {editing ? t('workArea.renameTitle') : t('workArea.createTitle')}
          </Text>
          <TextField
            accessibilityLabel={t('workArea.nameLabel')}
            maxLength={WORK_AREA_NAME_MAX_LENGTH}
            onChangeText={(value) => {
              setName(value);
              setMutationError(false);
            }}
            placeholder={t('workArea.namePlaceholder')}
            value={name}
          />
          {mutationError ? (
            <Text role="alert" color="danger" variant="caption">
              {t('workArea.mutationError')}
            </Text>
          ) : null}
          <View style={styles.editorActions}>
            {editing ? (
              <Button
                disabled={busy}
                onPress={resetEditor}
                variant="secondary"
                style={styles.flex}
              >
                {t('workArea.cancel')}
              </Button>
            ) : null}
            <Button
              disabled={!name.trim() || busy}
              loading={busy}
              onPress={() => {
                void submit();
              }}
              style={styles.flex}
            >
              {editing ? t('workArea.renameAction') : t('workArea.createAction')}
            </Button>
          </View>
        </View>

        {state.status === 'error' && state.workAreas.length === 0 ? (
          <View style={styles.empty}>
            <Text role="alert" color="textMuted">
              {t('workArea.loadError')}
            </Text>
            <Button onPress={reload} variant="secondary">
              {t('workArea.retry')}
            </Button>
          </View>
        ) : (
          <>
            <WorkAreaSection
              title={t('workArea.activeTitle')}
              emptyText={t('workArea.activeEmpty')}
              workAreas={active}
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
            />
            {archived.length > 0 ? (
              <WorkAreaSection
                title={t('workArea.archivedTitle')}
                emptyText=""
                workAreas={archived}
                renderActions={() => null}
              />
            ) : null}
          </>
        )}

        <Button fullWidth onPress={() => router.back()} variant="secondary">
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

type WorkAreaSectionProps = {
  title: string;
  emptyText: string;
  workAreas: WorkArea[];
  renderActions: (workArea: WorkArea) => ReactNode;
};

function WorkAreaSection({
  title,
  emptyText,
  workAreas,
  renderActions,
}: Readonly<WorkAreaSectionProps>) {
  const { theme } = useTheme();

  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" variant="heading">
        {title}
      </Text>
      {workAreas.length === 0 ? (
        <Text color="textMuted">{emptyText}</Text>
      ) : (
        workAreas.map((workArea) => (
          <View
            key={workArea.id}
            style={[styles.row, { borderColor: theme.colors.border }]}
          >
            <Text style={styles.name} variant="bodyStrong">
              {workArea.name}
            </Text>
            <View style={styles.rowActions}>{renderActions(workArea)}</View>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    gap: spacing[6],
    paddingBottom: spacing[8],
    paddingHorizontal: layout.screenHorizontalPadding,
    paddingTop: spacing[5],
  },
  heading: { gap: spacing[2] },
  editor: {
    borderRadius: radii.xl,
    borderWidth: 1,
    gap: spacing[3],
    padding: spacing[4],
  },
  editorActions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  flex: { flex: 1 },
  section: { gap: spacing[3] },
  row: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing[3],
    paddingBottom: spacing[3],
  },
  name: { flex: 1 },
  rowActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    justifyContent: 'flex-end',
  },
  empty: {
    alignItems: 'flex-start',
    gap: spacing[3],
  },
});
