import { StyleSheet, View } from 'react-native';
import { Button } from '@/design-system/components/Button';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing } from '@/design-system/tokens/theme';
import { getWorkAreaNameValidationIssue } from '@/domain/work-area/validation';
import { WorkAreaNameField } from '@/features/work-area/components/WorkAreaNameField';
import { getWorkAreaNameErrorKey } from '@/features/work-area/components/workAreaNameError';
import { useWorkAreaNameForm } from '@/features/work-area/useWorkAreaNameForm';
import { useI18n } from '@/i18n/I18nProvider';

type WorkAreaEditorCardProps = {
  editing: boolean;
  initialName: string;
  busy: boolean;
  hasMutationError: boolean;
  onNameChange: () => void;
  onCancel: () => void;
  onSubmitName: (name: string) => Promise<void> | void;
};

export function WorkAreaEditorCard({
  editing,
  initialName,
  busy,
  hasMutationError,
  onNameChange,
  onCancel,
  onSubmitName,
}: Readonly<WorkAreaEditorCardProps>) {
  const { theme } = useTheme();
  const { t } = useI18n();
  const { form, name, canSubmit, isSubmitting, validationIssue } =
    useWorkAreaNameForm({ initialName, onSubmitName });
  const isBusy = busy || isSubmitting;

  return (
    <View
      style={[
        styles.editor,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Text variant="heading">
        {editing ? t('workArea.renameTitle') : t('workArea.createTitle')}
      </Text>
      <form.Field
        name="name"
        validators={{
          onChange: ({ value }) =>
            getWorkAreaNameValidationIssue(value) ?? undefined,
        }}
      >
        {(field) => {
          const errorKey = getWorkAreaNameErrorKey({
            hasMutationError,
            isTouched: field.state.meta.isTouched,
            validationIssue,
          });
          const errorMessage = errorKey ? t(errorKey) : null;

          return (
            <>
              <WorkAreaNameField
                editable={!isBusy}
                hasError={errorMessage !== null}
                onBlur={field.handleBlur}
                onChangeText={(value) => {
                  field.handleChange(value);
                  onNameChange();
                }}
                onSubmitEditing={() => {
                  void form.handleSubmit();
                }}
                value={name}
              />
              {errorMessage ? (
                <Text
                  accessibilityLiveRegion="polite"
                  role="alert"
                  color="danger"
                  variant="caption"
                >
                  {errorMessage}
                </Text>
              ) : null}
            </>
          );
        }}
      </form.Field>
      <View style={styles.actions}>
        {editing ? (
          <Button
            disabled={isBusy}
            onPress={onCancel}
            style={styles.flex}
            variant="secondary"
          >
            {t('workArea.cancel')}
          </Button>
        ) : null}
        <Button
          disabled={!canSubmit || isBusy}
          loading={isBusy}
          onPress={() => {
            void form.handleSubmit();
          }}
          style={styles.flex}
        >
          {editing ? t('workArea.renameAction') : t('workArea.createAction')}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  editor: {
    borderRadius: radii.lg,
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
