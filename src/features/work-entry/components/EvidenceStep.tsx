import { StyleSheet, View } from 'react-native';
import { Button } from '@/design-system/components/Button';
import { Text } from '@/design-system/components/Text';
import { TextField } from '@/design-system/components/TextField';
import { radii, spacing } from '@/design-system/tokens/theme';
import type { EvidenceType } from '@/domain/entry/model';
import { InlineError } from '@/features/work-entry/components/InlineError';
import { LogChoiceCard } from '@/features/work-entry/components/LogChoiceCard';
import { LogHeader } from '@/features/work-entry/components/LogHeader';
import type {
  LogStepFrameProps,
  Translate,
} from '@/features/work-entry/components/logStepTypes';
import { logStepStyles } from '@/features/work-entry/components/logStepStyles';
import { evidenceOptions } from '@/features/work-entry/options';

type EvidenceStepProps = LogStepFrameProps & {
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
  return (
    <>
      <LogHeader
        {...frame}
        eyebrow={t('log.evidence.eyebrow')}
        title={t('log.evidence.title')}
        description={t('log.evidence.description')}
      />
      <View style={logStepStyles.choiceList}>
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
      <View style={logStepStyles.field}>
        <Text variant="label">{t('log.evidence.detailLabel')}</Text>
        <TextField
          accessibilityLabel={t('log.evidence.detailLabel')}
          hasError={evidenceError}
          maxLength={1000}
          multiline
          onChangeText={onDetailChange}
          placeholder={t('log.evidence.detailPlaceholder')}
          style={styles.evidenceInput}
          textAlignVertical="top"
          value={evidenceDetail}
        />
        {evidenceError ? (
          <InlineError>{t('log.evidence.detailHelp')}</InlineError>
        ) : null}
      </View>
      <View style={logStepStyles.buttonRow}>
        <Button
          onPress={onSkip}
          style={logStepStyles.flexButton}
          variant="secondary"
        >
          {t('log.evidence.skip')}
        </Button>
        <Button onPress={onContinue} style={logStepStyles.flexButton}>
          {t('log.evidence.continue')}
        </Button>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  evidenceInput: {
    borderRadius: radii.lg,
    borderWidth: 1,
    minHeight: 112,
    padding: spacing[4],
  },
});
