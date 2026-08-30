import type { TextInputProps } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/design-system/components/Text';
import { TextField } from '@/design-system/components/TextField';
import { radii, spacing } from '@/design-system/tokens/theme';
import { WORK_AREA_NAME_MAX_LENGTH } from '@/domain/work-area/validation';
import { useI18n } from '@/i18n/I18nProvider';

const WORK_AREA_NAME_LABEL_ID = 'work-area-name-label';

type WorkAreaNameFieldProps = Pick<
  TextInputProps,
  'editable' | 'onSubmitEditing'
> & {
  value: string;
  hasError?: boolean;
  onChangeText: (value: string) => void;
};

export function WorkAreaNameField({
  value,
  hasError = false,
  editable = true,
  onChangeText,
  onSubmitEditing,
}: Readonly<WorkAreaNameFieldProps>) {
  const { t } = useI18n();

  return (
    <View style={styles.field}>
      <Text nativeID={WORK_AREA_NAME_LABEL_ID} variant="label">
        {t('workArea.nameLabel')}
      </Text>
      <TextField
        accessibilityLabel={t('workArea.nameLabel')}
        accessibilityLabelledBy={WORK_AREA_NAME_LABEL_ID}
        autoCapitalize="words"
        editable={editable}
        hasError={hasError}
        maxLength={WORK_AREA_NAME_MAX_LENGTH}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmitEditing}
        placeholder={t('workArea.namePlaceholder')}
        returnKeyType="done"
        style={styles.input}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing[2],
  },
  input: {
    borderRadius: radii.md,
    borderWidth: 1,
    minHeight: 52,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
});
