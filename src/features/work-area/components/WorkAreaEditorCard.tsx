import { StyleSheet, View } from 'react-native';
import { Button } from '@/design-system/components/Button';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing } from '@/design-system/tokens/theme';
import { WorkAreaNameField } from '@/features/work-area/components/WorkAreaNameField';
import { useI18n } from '@/i18n/I18nProvider';

type WorkAreaEditorCardProps = {
  editing: boolean;
  name: string;
  busy: boolean;
  hasError: boolean;
  onNameChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
};

export function WorkAreaEditorCard({
  editing,
  name,
  busy,
  hasError,
  onNameChange,
  onCancel,
  onSubmit,
}: Readonly<WorkAreaEditorCardProps>) {
  const { theme } = useTheme();
  const { t } = useI18n();

  return (
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
      <WorkAreaNameField
        editable={!busy}
        hasError={hasError}
        onChangeText={onNameChange}
        onSubmitEditing={onSubmit}
        value={name}
      />
      {hasError ? (
        <Text role="alert" color="danger" variant="caption">
          {t('workArea.mutationError')}
        </Text>
      ) : null}
      <View style={styles.actions}>
        {editing ? (
          <Button
            disabled={busy}
            onPress={onCancel}
            style={styles.flex}
            variant="secondary"
          >
            {t('workArea.cancel')}
          </Button>
        ) : null}
        <Button
          disabled={!name.trim() || busy}
          loading={busy}
          onPress={onSubmit}
          style={styles.flex}
        >
          {editing
            ? t('workArea.renameAction')
            : t('workArea.createAction')}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  editor: {
    borderRadius: radii.xl,
    borderWidth: 1,
    gap: spacing[3],
    padding: spacing[4],
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  flex: { flex: 1 },
});
