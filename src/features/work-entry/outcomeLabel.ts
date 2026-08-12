import type { OutcomeType } from '@/domain/entry/model';
import type { Translate } from '@/features/work-entry/components/logStepTypes';
import { outcomeOptions } from '@/features/work-entry/options';

export function getOutcomeLabel(
  outcomeType: OutcomeType,
  t: Translate,
): string {
  if (outcomeType === 'unsure') {
    return t('log.impact.notKnown');
  }

  const option = outcomeOptions.find(
    (candidate) => candidate.value === outcomeType,
  );

  return option ? t(option.titleKey) : t('log.impact.notKnown');
}
