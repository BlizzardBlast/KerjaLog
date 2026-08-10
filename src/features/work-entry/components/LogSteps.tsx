import {
  type StyleProp,
  StyleSheet,
  TextInput,
  View,
  type ViewStyle,
} from 'react-native';
import { Button } from '@/design-system/components/Button';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing } from '@/design-system/tokens/theme';
import type { LogEventIntent } from '@/domain/entry/impact';
import type { EvidenceType, OutcomeType } from '@/domain/entry/model';
import { LogChoiceCard } from '@/features/work-entry/components/LogChoiceCard';
import { LogHeader } from '@/features/work-entry/components/LogHeader';
import {
  evidenceOptions,
  logEventOptions,
  outcomeOptions,
} from '@/features/work-entry/model';
import type { useI18n } from '@/i18n/I18nProvider';

type Translate = ReturnType<typeof useI18n>['t'];

type StepFrameProps = {
  backLabel: string;
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
};

type CaptureTypeStepProps = StepFrameProps & {
  intent: LogEventIntent | null;
  onSelect: (intent: LogEventIntent) => void;
  onContinue: () => void;
  t: Translate;
};

export function CaptureTypeStep({
  intent,
  onSelect,
  onContinue,
  t,
  ...frame
}: CaptureTypeStepProps) {
  return (
    <>
      <LogHeader
        {...frame}
        eyebrow={t('log.capture.eyebrow')}
        title={t('log.capture.title')}
        description={t('log.capture.description')}
      />
      <View style={styles.choiceList}>
        {logEventOptions.map((option) => (
          <LogChoiceCard
            key={option.value}
            title={t(option.titleKey)}
            description={
              option.descriptionKey ? t(option.descriptionKey) : undefined
            }
            icon={option.icon}
            selected={intent === option.value}
            onPress={() => onSelect(option.value)}
          />
        ))}
      </View>
      <Button fullWidth disabled={!intent} onPress={onContinue} size="lg">
        {t('log.capture.continue')}
      </Button>
    </>
  );
}

type EventStepProps = StepFrameProps & {
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
      <View style={styles.field}>
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
      <View style={styles.buttonRow}>
        <Button
          disabled={!rawNote.trim()}
          loading={saving}
          onPress={onSaveQuick}
          style={styles.flexButton}
          variant="secondary"
        >
          {t('log.event.saveQuick')}
        </Button>
        <Button
          disabled={!rawNote.trim() || saving}
          onPress={onContinue}
          style={styles.flexButton}
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

type OutcomeStepProps = StepFrameProps & {
  outcomeType: OutcomeType | null;
  onSelect: (outcomeType: OutcomeType) => void;
  onContinue: () => void;
  t: Translate;
};

export function OutcomeStep({
  outcomeType,
  onSelect,
  onContinue,
  t,
  ...frame
}: OutcomeStepProps) {
  return (
    <>
      <LogHeader
        {...frame}
        eyebrow={t('log.outcome.eyebrow')}
        title={t('log.outcome.title')}
        description={t('log.outcome.description')}
      />
      <View style={styles.choiceList}>
        {outcomeOptions.map((option) => (
          <LogChoiceCard
            key={option.value}
            title={t(option.titleKey)}
            description={
              option.descriptionKey ? t(option.descriptionKey) : undefined
            }
            selected={outcomeType === option.value}
            onPress={() => onSelect(option.value)}
          />
        ))}
      </View>
      <Button
        fullWidth
        disabled={!outcomeType}
        onPress={onContinue}
        size="lg"
      >
        {t('log.outcome.continue')}
      </Button>
    </>
  );
}

type EvidenceStepProps = StepFrameProps & {
  evidenceTypes: EvidenceType[];
  evidenceDetail: string;
  evidenceError: boolean;
  onToggleType: (type: EvidenceType) => void;
  onDetailChange: (value: string) => void;
  onSkip: () => void;
  onContinue: () => void;
  t: Translate;
};

export function EvidenceStep({
  evidenceTypes,
  evidenceDetail,
  evidenceError,
  onToggleType,
  onDetailChange,
  onSkip,
  onContinue,
  t,
  ...frame
}: EvidenceStepProps) {
  const { theme } = useTheme();

  return (
    <>
      <LogHeader
        {...frame}
        eyebrow={t('log.evidence.eyebrow')}
        title={t('log.evidence.title')}
        description={t('log.evidence.description')}
      />
      <View style={styles.choiceList}>
        {evidenceOptions.map((option) => (
          <LogChoiceCard
            key={option.value}
            title={t(option.titleKey)}
            selected={evidenceTypes.includes(option.value)}
            onPress={() => onToggleType(option.value)}
            mode="multiple"
          />
        ))}
      </View>
      <View style={styles.field}>
        <Text variant="label">{t('log.evidence.detailLabel')}</Text>
        <TextInput
          accessibilityLabel={t('log.evidence.detailLabel')}
          maxLength={1000}
          multiline
          onChangeText={onDetailChange}
          placeholder={t('log.evidence.detailPlaceholder')}
          placeholderTextColor={theme.colors.textMuted}
          style={[
            styles.evidenceInput,
            theme.typography.body,
            {
              backgroundColor: theme.colors.surface,
              borderColor: evidenceError
                ? theme.colors.danger
                : theme.colors.border,
              color: theme.colors.text,
            },
          ]}
          textAlignVertical="top"
          value={evidenceDetail}
        />
        {evidenceError ? (
          <InlineError>{t('log.evidence.detailHelp')}</InlineError>
        ) : null}
      </View>
      <View style={styles.buttonRow}>
        <Button onPress={onSkip} style={styles.flexButton} variant="secondary">
          {t('log.evidence.skip')}
        </Button>
        <Button onPress={onContinue} style={styles.flexButton}>
          {t('log.evidence.continue')}
        </Button>
      </View>
    </>
  );
}

type ImpactStepProps = StepFrameProps & {
  rawNote: string;
  outcomeType: OutcomeType;
  evidenceDetail: string;
  impactStatement: string;
  saving: boolean;
  saveError: boolean;
  onImpactStatementChange: (value: string) => void;
  onSave: () => void;
  t: Translate;
};

export function ImpactStep({
  rawNote,
  outcomeType,
  evidenceDetail,
  impactStatement,
  saving,
  saveError,
  onImpactStatementChange,
  onSave,
  t,
  ...frame
}: ImpactStepProps) {
  const { theme } = useTheme();

  return (
    <>
      <LogHeader
        {...frame}
        eyebrow={t('log.impact.eyebrow')}
        title={t('log.impact.title')}
        description={t('log.impact.description')}
      />
      <View
        style={[
          styles.threadCard,
          {
            backgroundColor: theme.colors.primarySoft,
            borderColor: theme.colors.primary,
          },
        ]}
      >
        <ThreadNode label={t('log.impact.whatHappened')} value={rawNote} />
        <ThreadNode
          label={t('log.impact.whatChanged')}
          value={getOutcomeLabel(outcomeType, t)}
        />
        <ThreadNode
          label={t('log.impact.whatSupports')}
          value={evidenceDetail.trim() || t('log.impact.noEvidence')}
        />
      </View>
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surfaceSubtle,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Text variant="overline" color="primary">
          {t('log.impact.originalNote')}
        </Text>
        <Text variant="body">{rawNote.trim()}</Text>
      </View>
      <View style={styles.field}>
        <Text variant="label">{t('log.impact.editLabel')}</Text>
        <TextInput
          accessibilityLabel={t('log.impact.editLabel')}
          maxLength={2500}
          multiline
          onChangeText={onImpactStatementChange}
          style={[
            styles.impactInput,
            theme.typography.bodyStrong,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              color: theme.colors.text,
            },
          ]}
          textAlignVertical="top"
          value={impactStatement}
        />
      </View>
      <NoticeCard
        backgroundColor={theme.colors.warningSoft}
        borderColor={theme.colors.warning}
        title={t('log.impact.groundedTitle')}
        description={t('log.impact.groundedDescription')}
      />
      <Button
        fullWidth
        disabled={!impactStatement.trim()}
        loading={saving}
        onPress={onSave}
        size="lg"
      >
        {t('log.impact.confirm')}
      </Button>
      {saveError ? (
        <InlineError>{t('log.impact.saveError')}</InlineError>
      ) : null}
    </>
  );
}

function ThreadNode({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.threadNode}>
      <Text variant="overline" color="primary">
        {label}
      </Text>
      <Text variant="bodyStrong">{value}</Text>
    </View>
  );
}

function NoticeCard({
  backgroundColor,
  borderColor,
  title,
  description,
  style,
}: {
  backgroundColor: string;
  borderColor: string;
  title: string;
  description: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.notice, { backgroundColor, borderColor }, style]}>
      <Text variant="bodyStrong">{title}</Text>
      <Text variant="caption" color="textMuted">
        {description}
      </Text>
    </View>
  );
}

function InlineError({ children }: { children: string }) {
  return (
    <Text accessibilityLiveRegion="polite" variant="caption" color="danger">
      {children}
    </Text>
  );
}

function getOutcomeLabel(outcomeType: OutcomeType, t: Translate): string {
  if (outcomeType === 'unsure') {
    return t('log.impact.notKnown');
  }

  const option = outcomeOptions.find(
    (candidate) => candidate.value === outcomeType,
  );
  return option ? t(option.titleKey) : t('log.impact.notKnown');
}

const styles = StyleSheet.create({
  choiceList: {
    gap: spacing[2],
  },
  field: {
    gap: spacing[2],
  },
  textarea: {
    borderRadius: radii.lg,
    borderWidth: 1,
    minHeight: 156,
    padding: spacing[4],
  },
  evidenceInput: {
    borderRadius: radii.lg,
    borderWidth: 1,
    minHeight: 112,
    padding: spacing[4],
  },
  impactInput: {
    borderRadius: radii.lg,
    borderWidth: 1,
    minHeight: 164,
    padding: spacing[4],
  },
  notice: {
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing[1],
    padding: spacing[4],
  },
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing[2],
    padding: spacing[4],
  },
  threadCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    gap: spacing[3],
    padding: spacing[4],
  },
  threadNode: {
    gap: spacing[1],
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  flexButton: {
    flex: 1,
  },
});
