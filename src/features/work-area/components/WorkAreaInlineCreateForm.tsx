import { StyleSheet, View } from 'react-native';
import { Button } from '@/design-system/components/Button';
import { Text } from '@/design-system/components/Text';
import { spacing } from '@/design-system/tokens/theme';
import { WorkAreaNameField } from '@/features/work-area/components/WorkAreaNameField';
import { useI18n } from '@/i18n/I18nProvider';

type WorkAreaInlineCreateFormProps = {
  name: string;
  busy: boolean;
  disabled: boolean;
  hasError: boolean;
  onNameChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
};

export function WorkAreaInlineCreateForm({
  name,
  busy,
  disabled,
  hasError,
  onNameChange,
  onCancel,
  onSubmit,
}: Readonly<WorkAreaInlineCreateFormProps>) {
  const { t } = useI18n();

  return (
    <View style={styles.form}>
      <WorkAreaNameField
        editable={!disabled && !busy}
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
        <Button
          disabled={disabled || busy}
          onPress={onCancel}
          size="sm"
          style={styles.flex}
          variant="secondary"
        >
          {t('workArea.cancel')}
        </Button>
        <Button
          disabled={!name.trim() || disabled || busy}
          loading={busy}
          onPress={onSubmit}
          size="sm"
          style={styles.flex}
        >
          {t('workArea.createAction')}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing[2],
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  flex: {
    flex: 1,
  },
});
