import { StyleSheet, TextInput, View } from 'react-native';
import { Button } from '@/design-system/components/Button';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing } from '@/design-system/tokens/theme';
import type { OutcomeType } from '@/domain/entry/model';
import { InlineError } from '@/features/work-entry/components/InlineError';
import { LogHeader } from '@/features/work-entry/components/LogHeader';
import type {
  LogStepFrameProps,
  Translate,
} from '@/features/work-entry/components/LogStepFrame';
import { logStepStyles } from '@/features/work-entry/components/logStepStyles';
import { NoticeCard } from '@/features/work-entry/components/NoticeCard';
import { ThreadNode } from '@/features/work-entry/components/ThreadNode';
import { getOutcomeLabel } from '@/features/work-entry/outcomeLabel';

type ImpactStepProps = LogStepFrameProps & {
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
      <View style={logStepStyles.field}>
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
