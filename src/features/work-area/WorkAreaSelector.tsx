import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { workAreaRepository } from '@/data/repositories/workAreaRepository';
import { Button } from '@/design-system/components/Button';
import { Text } from '@/design-system/components/Text';
import { TextField } from '@/design-system/components/TextField';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing } from '@/design-system/tokens/theme';
import { WORK_AREA_NAME_MAX_LENGTH } from '@/domain/work-area/validation';
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
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [creatingBusy, setCreatingBusy] = useState(false);
  const [createError, setCreateError] = useState(false);
  const visibleWorkAreas = state.workAreas.filter(
    (workArea) => workArea.archivedAt === null || workArea.id === selectedId,
  );

  const cancelCreate = () => {
    setCreating(false);
    setNewName('');
    setCreateError(false);
  };

  const createWorkArea = async () => {
    if (!newName.trim() || creatingBusy || disabled) return;

    setCreatingBusy(true);
    setCreateError(false);
    try {
      const workArea = await workAreaRepository.create(newName);
      onChange(workArea.id);
      cancelCreate();
      reload();
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

      {state.status === 'loading' && state.workAreas.length === 0 ? (
        <Text variant="caption" color="textMuted">
          {t('workArea.loading')}
        </Text>
      ) : null}

      {state.status === 'error' && state.workAreas.length === 0 ? (
        <View style={styles.error}>
          <Text role="alert" variant="caption" color="textMuted">
            {t('workArea.loadError')}
          </Text>
          <Button onPress={reload} size="sm" variant="secondary">
            {t('workArea.retry')}
          </Button>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          accessibilityLabel={t('workArea.selector.accessibilityLabel')}
        >
          <WorkAreaChip
            label={t('workArea.none')}
            selected={selectedId === null}
            disabled={disabled}
            onPress={() => onChange(null)}
          />
          {visibleWorkAreas.map((workArea) => (
            <WorkAreaChip
              key={workArea.id}
              label={
                workArea.archivedAt
                  ? t('workArea.archivedName', { name: workArea.name })
                  : workArea.name
              }
              selected={selectedId === workArea.id}
              disabled={disabled || workArea.archivedAt !== null}
              onPress={() => onChange(workArea.id)}
            />
          ))}
        </ScrollView>
      )}

      {creating ? (
        <View style={styles.createForm}>
          <TextField
            accessibilityLabel={t('workArea.nameLabel')}
            editable={!disabled && !creatingBusy}
            maxLength={WORK_AREA_NAME_MAX_LENGTH}
            onChangeText={(value) => {
              setNewName(value);
              setCreateError(false);
            }}
            placeholder={t('workArea.namePlaceholder')}
            value={newName}
          />
          {createError ? (
            <Text role="alert" color="danger" variant="caption">
              {t('workArea.mutationError')}
            </Text>
          ) : null}
          <View style={styles.createActions}>
            <Button
              disabled={disabled || creatingBusy}
              onPress={cancelCreate}
              size="sm"
              style={styles.flex}
              variant="secondary"
            >
              {t('workArea.cancel')}
            </Button>
            <Button
              disabled={!newName.trim() || disabled || creatingBusy}
              loading={creatingBusy}
              onPress={() => {
                void createWorkArea();
              }}
              size="sm"
              style={styles.flex}
            >
              {t('workArea.createAction')}
            </Button>
          </View>
        </View>
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
    </View>
  );
}

type WorkAreaChipProps = {
  label: string;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
};

function WorkAreaChip({
  label,
  selected,
  disabled,
  onPress,
}: Readonly<WorkAreaChipProps>) {
  const { theme } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected
            ? theme.colors.primarySoft
            : theme.colors.surface,
          borderColor: selected ? theme.colors.primary : theme.colors.border,
        },
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text
        color={selected ? 'primary' : 'textMuted'}
        numberOfLines={1}
        variant="label"
      >
        {label}
      </Text>
    </Pressable>
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
  chip: {
    alignItems: 'center',
    borderRadius: radii.full,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    maxWidth: 220,
    paddingHorizontal: spacing[4],
  },
  createForm: {
    gap: spacing[2],
  },
  createActions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  flex: {
    flex: 1,
  },
  error: {
    alignItems: 'flex-start',
    gap: spacing[2],
  },
  pressed: {
    opacity: 0.76,
  },
  disabled: {
    opacity: 0.55,
  },
});
