import { StyleSheet, View } from 'react-native';
import { Button } from '@/design-system/components/Button';
import { Text } from '@/design-system/components/Text';
import { TextField } from '@/design-system/components/TextField';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing } from '@/design-system/tokens/theme';
import { WORK_ENTRY_TEXT_LIMITS } from '@/domain/entry/limits';
import { InlineError } from '@/features/work-entry/components/InlineError';
import { LogHeader } from '@/features/work-entry/components/LogHeader';
import type {
  LogStepFrameProps,
  Translate,
} from '@/features/work-entry/components/logStepTypes';
import { logStepStyles } from '@/features/work-entry/components/logStepStyles';
import { NoticeCard } from '@/features/work-entry/components/NoticeCard';

const EVENT_NOTE_LABEL_ID = 'work-entry-event-note-label';

type QuickSaveAction = {
  onPress: () => void;
  hasError: boolean;
};

type EventStepProps = LogStepFrameProps & {
  rawNote: string;
  noteError: boolean;
  busy: boolean;
  quickSave?: QuickSaveAction;
  onRawNoteChange: (value: string) => void;
  onContinue: () => void;
  t: Translate;
};

export function EventStep({
  rawNote,
  noteError,
  busy,
  quickSave,
  onRawNoteChange,
  onContinue,
  t,
  ...frame
}: Readonly<EventStepProps>) {
  const { theme } = useTheme();

  return (
    <>
      <LogHeader
        {...frame}
        eyebrow={t('log.event.eyebrow')}
        title={t('log.event.title')}
      />
      <View style={logStepStyles.field}>
        <Text nativeID={EVENT_NOTE_LABEL_ID} variant="label">
          {t('log.event.label')}
        </Text>
        <TextField
          accessibilityLabel={t('log.event.label')}
          accessibilityLabelledBy={EVENT_NOTE_LABEL_ID}
          hasError={noteError}
          maxLength={WORK_ENTRY_TEXT_LIMITS.rawNote}
          multiline
          onChangeText={onRawNoteChange}
          placeholder={t('log.event.placeholder')}
          style={styles.textarea}
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
      {quickSave ? (
        <View style={logStepStyles.buttonRow}>
          <Button
            disabled={!rawNote.trim()}
            loading={busy}
            onPress={quickSave.onPress}
            style={logStepStyles.flexButton}
            variant="secondary"
          >
            {t('log.event.saveQuick')}
          </Button>
          <Button
            disabled={!rawNote.trim() || busy}
            onPress={onContinue}
            style={logStepStyles.flexButton}
          >
            {t('log.event.continue')}
          </Button>
        </View>
      ) : (
        <Button
          disabled={!rawNote.trim() || busy}
          fullWidth
          onPress={onContinue}
          size="lg"
        >
          {t('log.event.continue')}
        </Button>
      )}
      {quickSave?.hasError ? (
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
