import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button } from '@/design-system/components/Button';
import { Text } from '@/design-system/components/Text';
import { spacing } from '@/design-system/tokens/theme';
import { WorkAreaChip } from '@/features/work-area/components/WorkAreaChip';
import { WorkAreaInlineCreateForm } from '@/features/work-area/components/WorkAreaInlineCreateForm';
import { useWorkAreaMutations } from '@/features/work-area/useWorkAreaMutations';
import { useWorkAreas } from '@/features/work-area/useWorkAreas';
import { useI18n } from '@/i18n/I18nProvider';

type WorkAreaSelectorProps = {
  selectedId: string | null;
  onChange: (workAreaId: string | null) => void;
  disabled?: boolean;
};

export function WorkAreaSelector({
  selectedId,
  onChange,
  disabled = false,
}: Readonly<WorkAreaSelectorProps>) {
  const { t } = useI18n();
  const { state, reload } = useWorkAreas({ includeArchived: true });
  const { create } = useWorkAreaMutations({ onMutated: reload });
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [creatingBusy, setCreatingBusy] = useState(false);
  const [createError, setCreateError] = useState(false);
  const visibleWorkAreas = state.workAreas.filter(
    (workArea) => workArea.archivedAt === null || workArea.id === selectedId,
  );
  const hasCatalogData = state.workAreas.length > 0;
  const catalogReady = state.status === 'loaded' || hasCatalogData;

  const cancelCreate = () => {
    setCreating(false);
    setNewName('');
    setCreateError(false);
  };

  const createWorkArea = async () => {
    if (!newName.trim() || creatingBusy || disabled || !catalogReady) return;

    setCreatingBusy(true);
    setCreateError(false);
    try {
      const workArea = await create(newName);
      onChange(workArea.id);
      cancelCreate();
    } catch {
      setCreateError(true);
    } finally {
      setCreatingBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.copy}>
        <Text variant="label">{t('workArea.selector.label')}</Text>
        <Text variant="caption" color="textMuted">
          {t('workArea.selector.description')}
        </Text>
      </View>

      {state.status === 'loading' && !hasCatalogData ? (
        <Text variant="caption" color="textMuted">
          {t('workArea.loading')}
        </Text>
      ) : null}

      {state.status === 'error' ? (
        <View style={styles.error}>
          <Text role="alert" variant="caption" color="textMuted">
            {t('workArea.loadError')}
          </Text>
          <Button onPress={reload} size="sm" variant="secondary">
            {t('workArea.retry')}
          </Button>
        </View>
      ) : null}

      {catalogReady ? (
        <>
          <ScrollView
            accessibilityLabel={t('workArea.selector.accessibilityLabel')}
            contentContainerStyle={styles.chips}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            <WorkAreaChip
              disabled={disabled}
              label={t('workArea.none')}
              onPress={() => onChange(null)}
              selected={selectedId === null}
            />
            {visibleWorkAreas.map((workArea) => (
              <WorkAreaChip
                disabled={disabled || workArea.archivedAt !== null}
                key={workArea.id}
                label={
                  workArea.archivedAt
                    ? t('workArea.archivedName', { name: workArea.name })
                    : workArea.name
                }
                onPress={() => onChange(workArea.id)}
                selected={selectedId === workArea.id}
              />
            ))}
          </ScrollView>

          {creating ? (
            <WorkAreaInlineCreateForm
              busy={creatingBusy}
              disabled={disabled}
              hasError={createError}
              name={newName}
              onCancel={cancelCreate}
              onNameChange={(value) => {
                setNewName(value);
                setCreateError(false);
              }}
              onSubmit={() => {
                void createWorkArea();
              }}
            />
          ) : (
            <Button
              disabled={disabled}
              onPress={() => setCreating(true)}
              size="sm"
              variant="secondary"
            >
              {t(
                state.workAreas.some((workArea) => workArea.archivedAt === null)
                  ? 'workArea.addAnother'
                  : 'workArea.createFirst',
              )}
            </Button>
          )}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[3],
  },
  copy: {
    gap: spacing[1],
  },
  chips: {
    gap: spacing[2],
    paddingRight: spacing[4],
  },
  error: {
    alignItems: 'flex-start',
    gap: spacing[2],
  },
});
