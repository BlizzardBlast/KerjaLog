import { StyleSheet, View } from 'react-native';
import { Button } from '@/design-system/components/Button';
import { Text } from '@/design-system/components/Text';
import { TextField } from '@/design-system/components/TextField';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing } from '@/design-system/tokens/theme';
import { WORK_ENTRY_TEXT_LIMITS } from '@/domain/entry/limits';
import type { OutcomeType } from '@/domain/entry/model';
import { InlineError } from '@/features/work-entry/components/InlineError';
import { LogHeader } from '@/features/work-entry/components/LogHeader';
import type {
  LogStepFrameProps,
  Translate,
} from '@/features/work-entry/components/logStepTypes';
import { logStepStyles } from '@/features/work-entry/components/logStepStyles';
import { NoticeCard } from '@/features/work-entry/components/NoticeCard';
import { ThreadNode } from '@/features/work-entry/components/ThreadNode';
import { getOutcomeLabel } from '@/features/work-entry/outcomeLabel';

const IMPACT_STATEMENT_LABEL_ID = 'work-entry-impact-statement-label';

type ImpactStepProps = LogStepFrameProps & {
  rawNote: string;
  outcomeType: OutcomeType;
  evidenceDetail: string;
  skillsSummary?: string;
  impactStatement: string;
  saving: boolean;
  saveError: boolean;
  saveErrorMessage?: string;
  onImpactStatementChange: (value: string) => void;
  onSave: () => void;
  t: Translate;
};

export function ImpactStep({
  rawNote,
  outcomeType,
  evidenceDetail,
  skillsSummary,
  impactStatement,
  saving,
  saveError,
  saveErrorMessage,
  onImpactStatementChange,
  onSave,
  t,
  ...frame
}: Readonly<ImpactStepProps>) {
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
        {skillsSummary ? (
          <ThreadNode
            label={t('entry.saved.whatDemonstrates')}
            value={skillsSummary}
          />
        ) : null}
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
      <View style={logStepStyles.field}>
        <Text nativeID={IMPACT_STATEMENT_LABEL_ID} variant="label">
          {t('log.impact.editLabel')}
        </Text>
        <TextField
          accessibilityLabel={t('log.impact.editLabel')}
          accessibilityLabelledBy={IMPACT_STATEMENT_LABEL_ID}
          maxLength={WORK_ENTRY_TEXT_LIMITS.impactStatement}
          multiline
          onChangeText={onImpactStatementChange}
          style={styles.impactInput}
          textAlignVertical="top"
          textVariant="bodyStrong"
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
        <InlineError>
          {saveErrorMessage ?? t('log.impact.saveError')}
        </InlineError>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  impactInput: {
    borderRadius: radii.lg,
    borderWidth: 1,
    minHeight: 164,
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
});
