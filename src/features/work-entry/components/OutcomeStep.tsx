import { View } from 'react-native';
import { Button } from '@/design-system/components/Button';
import type { OutcomeType } from '@/domain/entry/model';
import { LogChoiceCard } from '@/features/work-entry/components/LogChoiceCard';
import { LogHeader } from '@/features/work-entry/components/LogHeader';
import type {
  LogStepFrameProps,
  Translate,
} from '@/features/work-entry/components/logStepTypes';
import { logStepStyles } from '@/features/work-entry/components/logStepStyles';
import { outcomeOptions } from '@/features/work-entry/options';

type OutcomeStepProps = LogStepFrameProps & {
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
      <View style={logStepStyles.choiceList}>
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
      <Button fullWidth disabled={!outcomeType} onPress={onContinue} size="lg">
        {t('log.outcome.continue')}
      </Button>
    </>
  );
}
