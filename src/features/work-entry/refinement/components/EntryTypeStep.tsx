import { View } from 'react-native';
import { Button } from '@/design-system/components/Button';
import { ENTRY_TYPES, type EntryType } from '@/domain/entry/model';
import { LogChoiceCard } from '@/features/work-entry/components/LogChoiceCard';
import { LogHeader } from '@/features/work-entry/components/LogHeader';
import type {
  LogStepFrameProps,
  Translate,
} from '@/features/work-entry/components/logStepTypes';
import { logStepStyles } from '@/features/work-entry/components/logStepStyles';
import type { TranslationKey } from '@/i18n/catalog';

const labelKeyByType: Record<EntryType, TranslationKey> = {
  contribution: 'entry.refine.type.contribution',
  problem_solved: 'entry.refine.type.problemSolved',
  feedback: 'entry.refine.type.feedback',
  learning: 'entry.refine.type.learning',
  ownership: 'entry.refine.type.ownership',
  challenge: 'entry.refine.type.challenge',
};

type EntryTypeStepProps = LogStepFrameProps & {
  entryType: EntryType;
  onSelect: (entryType: EntryType) => void;
  onContinue: () => void;
  t: Translate;
};

export function EntryTypeStep({
  entryType,
  onSelect,
  onContinue,
  t,
  ...frame
}: EntryTypeStepProps) {
  return (
    <>
      <LogHeader
        {...frame}
        eyebrow={t('entry.refine.type.eyebrow')}
        title={t('entry.refine.type.title')}
        description={t('entry.refine.type.description')}
      />
      <View style={logStepStyles.choiceList}>
        {ENTRY_TYPES.map((type) => (
          <LogChoiceCard
            key={type}
            title={t(labelKeyByType[type])}
            selected={entryType === type}
            onPress={() => onSelect(type)}
          />
        ))}
      </View>
      <Button fullWidth onPress={onContinue} size="lg">
        {t('entry.refine.type.continue')}
      </Button>
    </>
  );
}
