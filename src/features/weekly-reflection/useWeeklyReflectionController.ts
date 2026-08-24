import * as Sentry from '@sentry/react-native';
import { useState } from 'react';
import { workEntryDraftRepository } from '@/data/repositories/workEntryDraftRepository';
import {
  EMPTY_WORK_ENTRY_DRAFT,
  hasWorkEntryDraftContent,
} from '@/domain/entry/draft';
import {
  WEEKLY_REFLECTION_PROMPTS,
  type WeeklyReflectionPromptId,
} from '@/features/weekly-reflection/reflectionPrompts';

type ReflectionAnswers = Partial<Record<WeeklyReflectionPromptId, string>>;
export type ReflectionHandoffState =
  | 'idle'
  | 'saving'
  | 'active-draft'
  | 'error';

type UseWeeklyReflectionControllerInput = {
  onOpenLog: () => void;
};

export function useWeeklyReflectionController({
  onOpenLog,
}: UseWeeklyReflectionControllerInput) {
  const [promptIndex, setPromptIndex] = useState(0);
  const [answers, setAnswers] = useState<ReflectionAnswers>({});
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [handoffState, setHandoffState] =
    useState<ReflectionHandoffState>('idle');

  const prompt = WEEKLY_REFLECTION_PROMPTS[promptIndex] ?? null;
  const answeredPrompts = WEEKLY_REFLECTION_PROMPTS.flatMap((item) => {
    const answer = answers[item.id]?.trim();
    return answer ? [{ prompt: item, answer }] : [];
  });

  const advance = (saveAnswer: boolean) => {
    if (!prompt) {
      return;
    }

    const nextAnswers = { ...answers };
    if (saveAnswer && currentAnswer.trim()) {
      nextAnswers[prompt.id] = currentAnswer.trim();
    } else {
      delete nextAnswers[prompt.id];
    }

    setAnswers(nextAnswers);
    setCurrentAnswer('');
    setHandoffState('idle');

    if (promptIndex === WEEKLY_REFLECTION_PROMPTS.length - 1) {
      setReviewing(true);
      return;
    }

    setPromptIndex((current) => current + 1);
  };

  const handoffToLog = async (
    promptId: WeeklyReflectionPromptId,
    answer: string,
  ) => {
    const promptToLog = WEEKLY_REFLECTION_PROMPTS.find(
      (item) => item.id === promptId,
    );
    if (!promptToLog || handoffState === 'saving') {
      return;
    }

    setHandoffState('saving');
    try {
      const activeDraft = await workEntryDraftRepository.loadActive();
      if (activeDraft && hasWorkEntryDraftContent(activeDraft)) {
        setHandoffState('active-draft');
        return;
      }

      await workEntryDraftRepository.saveActive({
        ...EMPTY_WORK_ENTRY_DRAFT,
        step: 'event',
        intent: promptToLog.intent,
        rawNote: answer.trim(),
      });
      setHandoffState('idle');
      onOpenLog();
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          feature: 'weekly-reflection',
          operation: 'handoff-to-log',
        },
      });
      setHandoffState('error');
    }
  };

  return {
    prompt,
    promptIndex,
    totalPrompts: WEEKLY_REFLECTION_PROMPTS.length,
    currentAnswer,
    setCurrentAnswer,
    reviewing,
    answeredPrompts,
    handoffState,
    advance,
    handoffToLog,
  };
}
