import { StyleSheet, View } from 'react-native';
import { Button } from '@/design-system/components/Button';
import { Text } from '@/design-system/components/Text';
import { TextField } from '@/design-system/components/TextField';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing } from '@/design-system/tokens/theme';
import { WORK_ENTRY_TEXT_LIMITS } from '@/domain/entry/limits';
import { promptCopyKeysById } from '@/features/weekly-reflection/reflectionCopy';
import type { WeeklyReflectionPrompt } from '@/features/weekly-reflection/reflectionPrompts';
import { useI18n } from '@/i18n/I18nProvider';

const PROMPT_LABEL_ID = 'weekly-reflection-prompt-label';

type WeeklyReflectionPromptViewProps = {
  prompt: WeeklyReflectionPrompt;
  promptIndex: number;
  totalPrompts: number;
  currentAnswer: string;
  onAnswerChange: (value: string) => void;
  onSkip: () => void;
  onContinue: () => void;
  onClose: () => void;
};

export function WeeklyReflectionPromptView({
  prompt,
  promptIndex,
  totalPrompts,
  currentAnswer,
  onAnswerChange,
  onSkip,
  onContinue,
  onClose,
}: Readonly<WeeklyReflectionPromptViewProps>) {
  const { t } = useI18n();
  const { theme } = useTheme();
  const isLastPrompt = promptIndex === totalPrompts - 1;
  const promptCopy = promptCopyKeysById[prompt.id];
  const promptLabel = t(promptCopy.label);

  return (
    <>
      <Text variant="overline" color="primary">
        {t('reflection.eyebrow')}
      </Text>
      <Text accessibilityRole="header" variant="title">
        {t('reflection.title')}
      </Text>
      <Text color="textMuted">{t('reflection.description')}</Text>
      <Text variant="caption" color="textMuted">
        {t('reflection.progress', {
          current: promptIndex + 1,
          total: totalPrompts,
        })}
      </Text>
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Text
          accessibilityRole="header"
          nativeID={PROMPT_LABEL_ID}
          variant="heading"
        >
          {promptLabel}
        </Text>
        <TextField
          accessibilityLabel={promptLabel}
          accessibilityLabelledBy={PROMPT_LABEL_ID}
          maxLength={WORK_ENTRY_TEXT_LIMITS.rawNote}
          multiline
          onChangeText={onAnswerChange}
          placeholder={t(promptCopy.placeholder)}
          style={styles.textarea}
          textAlignVertical="top"
          value={currentAnswer}
        />
        <Text variant="caption" color="textMuted">
          {t('reflection.privacy')}
        </Text>
      </View>
      <View style={styles.actions}>
        <Button onPress={onSkip} style={styles.action} variant="secondary">
          {t('reflection.skip')}
        </Button>
        <Button
          disabled={!currentAnswer.trim()}
          onPress={onContinue}
          style={styles.action}
        >
          {t(isLastPrompt ? 'reflection.finish' : 'reflection.continue')}
        </Button>
      </View>
      <Button fullWidth onPress={onClose} variant="ghost">
        {t('reflection.close')}
      </Button>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing[3],
    padding: spacing[4],
  },
  textarea: {
    borderRadius: radii.lg,
    borderWidth: 1,
    minHeight: 156,
    padding: spacing[4],
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  action: {
    flex: 1,
    minWidth: 140,
  },
});
