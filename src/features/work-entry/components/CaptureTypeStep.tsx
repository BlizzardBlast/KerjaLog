import { View } from 'react-native';
import { Button } from '@/design-system/components/Button';
import type { LogEventIntent } from '@/domain/entry/impact';
import { LogChoiceCard } from '@/features/work-entry/components/LogChoiceCard';
import { LogHeader } from '@/features/work-entry/components/LogHeader';
import type {
  LogStepFrameProps,
  Translate,
} from '@/features/work-entry/components/LogStepFrame';
import { logStepStyles } from '@/features/work-entry/components/logStepStyles';
import { logEventOptions } from '@/features/work-entry/model';

type CaptureTypeStepProps = LogStepFrameProps & {
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
      <View style={logStepStyles.choiceList}>
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
