import type { WeeklyReflectionPromptId } from '@/features/weekly-reflection/reflectionPrompts';
import type { TranslationKey } from '@/i18n/catalog';

type WeeklyReflectionPromptCopyKeys = {
  label: TranslationKey;
  placeholder: TranslationKey;
};

export const promptCopyKeysById: Record<
  WeeklyReflectionPromptId,
  WeeklyReflectionPromptCopyKeys
> = {
  moved_forward: {
    label: 'reflection.prompt.moved_forward',
    placeholder: 'reflection.placeholder.moved_forward',
  },
  helped: {
    label: 'reflection.prompt.helped',
    placeholder: 'reflection.placeholder.helped',
  },
  problem: {
    label: 'reflection.prompt.problem',
    placeholder: 'reflection.placeholder.problem',
  },
  learned: {
    label: 'reflection.prompt.learned',
    placeholder: 'reflection.placeholder.learned',
  },
};
