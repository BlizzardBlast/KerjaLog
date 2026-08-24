import type { WeeklyReflectionPromptId } from '@/features/weekly-reflection/reflectionPrompts';
import type { TranslationKey } from '@/i18n/catalog';

export const promptTranslationKeyById: Record<
  WeeklyReflectionPromptId,
  TranslationKey
> = {
  moved_forward: 'reflection.prompt.moved_forward',
  helped: 'reflection.prompt.helped',
  problem: 'reflection.prompt.problem',
  learned: 'reflection.prompt.learned',
};
