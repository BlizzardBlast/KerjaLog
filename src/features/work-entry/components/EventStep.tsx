import { StyleSheet, TextInput, View } from 'react-native';
import { Button } from '@/design-system/components/Button';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing } from '@/design-system/tokens/theme';
import { InlineError } from '@/features/work-entry/components/InlineError';
import { LogHeader } from '@/features/work-entry/components/LogHeader';
import type {
  LogStepFrameProps,
  Translate,
} from '@/features/work-entry/components/LogStepFrame';
import { logStepStyles } from '@/features/work-entry/components/logStepStyles';
import { NoticeCard } from '@/features/work-entry/components/NoticeCard';

type EventStepProps = LogStepFrameProps & {
  rawNote: string;
  noteError: boolean;
  saving: boolean;
  saveError: boolean;
  onRawNoteChange: (value: string) => void;
  onSaveQuick: () => void;
  onContinue: () => void;
  t: Translate;
};

export function EventStep({
  rawNote,
  noteError,
  saving,
  saveError,
  onRawNoteChange,
  onSaveQuick,
  onContinue,
  t,
  ...frame
}: EventStepProps) {
  const { theme } = useTheme();

  return (
    <>
      <LogHeader
        {...frame}
        eyebrow={t('log.event.eyebrow')}
        title={t('log.event.title')}
      />
      <View style={logStepStyles.field}>
        <Text variant="label">{t('log.event.label')}</Text>
        <TextInput
          accessibilityLabel={t('log.event.label')}
          maxLength={2000}
          multiline
          onChangeText={onRawNoteChange}
          placeholder={t('log.event.placeholder')}
          placeholderTextColor={theme.colors.textMuted}
          style={[
            styles.textarea,
            theme.typography.body,
            {
              backgroundColor: theme.colors.surface,
              borderColor: noteError
                ? theme.colors.danger
                : theme.colors.border,
              color: theme.colors.text,
            },
          ]}
          textAlignVertical="top"
          value={rawNote}
        />
        <Text variant="caption" color="textMuted">
          {t('log.event.help')}
        </Text>
        {noteError ? (
          <InlineError>{t('log.event.required')}</InlineError>
        ) : null}
      </View>
      <NoticeCard
        backgroundColor={theme.colors.warningSoft}
        borderColor={theme.colors.warning}
        title={t('log.event.privacyTitle')}
        description={t('log.event.privacyDescription')}
      />
      <View style={logStepStyles.buttonRow}>
        <Button
          disabled={!rawNote.trim()}
          loading={saving}
          onPress={onSaveQuick}
          style={logStepStyles.flexButton}
          variant="secondary"
        >
          {t('log.event.saveQuick')}
        </Button>
        <Button
          disabled={!rawNote.trim() || saving}
          onPress={onContinue}
          style={logStepStyles.flexButton}
        >
          {t('log.event.continue')}
        </Button>
      </View>
      {saveError ? (
        <InlineError>{t('log.impact.saveError')}</InlineError>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  textarea: {
    borderRadius: radii.lg,
    borderWidth: 1,
    minHeight: 156,
    padding: spacing[4],
  },
});
