import { StyleSheet, View } from 'react-native';
import { Button } from '@/design-system/components/Button';
import { Text } from '@/design-system/components/Text';
import { getWorkAreaNameValidationIssue } from '@/domain/work-area/validation';
import { getWorkAreaNameErrorKey } from '@/features/work-area/components/workAreaNameError';
import { WorkAreaNameField } from '@/features/work-area/components/WorkAreaNameField';
import { useWorkAreaNameForm } from '@/features/work-area/useWorkAreaNameForm';
import { spacing } from '@/design-system/tokens/theme';
import { useI18n } from '@/i18n/I18nProvider';

type WorkAreaInlineCreateFormProps = {
  busy: boolean;
  disabled: boolean;
  hasMutationError: boolean;
  onNameChange: () => void;
  onCancel: () => void;
  onSubmitName: (name: string) => Promise<void> | void;
};

export function WorkAreaInlineCreateForm({
  busy,
  disabled,
  hasMutationError,
  onNameChange,
  onCancel,
  onSubmitName,
}: Readonly<WorkAreaInlineCreateFormProps>) {
  const { t } = useI18n();
  const { form, name, canSubmit, isSubmitting, validationIssue } =
    useWorkAreaNameForm({ initialName: '', onSubmitName });
  const isBusy = busy || isSubmitting;

  return (
    <View style={styles.form}>
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
                editable={!disabled && !isBusy}
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
        <Button
          disabled={disabled || isBusy}
          onPress={onCancel}
          size="sm"
          style={styles.flex}
          variant="secondary"
        >
          {t('workArea.cancel')}
        </Button>
        <Button
          disabled={!canSubmit || disabled || isBusy}
          loading={isBusy}
          onPress={() => {
            void form.handleSubmit();
          }}
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
