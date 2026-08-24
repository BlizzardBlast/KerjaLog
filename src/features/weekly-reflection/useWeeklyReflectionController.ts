import * as Sentry from '@sentry/react-native';
import { useEffect, useRef, useState } from 'react';
import { workEntryDraftRepository } from '@/data/repositories/workEntryDraftRepository';
import {
  EMPTY_WORK_ENTRY_DRAFT,
  hasWorkEntryDraftContent,
} from '@/domain/entry/draft';
import type {
  WorkEntryDraftReader,
  WorkEntryDraftWriter,
} from '@/domain/entry/repository';
import {
  WEEKLY_REFLECTION_PROMPTS,
  type WeeklyReflectionPromptId,
} from '@/features/weekly-reflection/reflectionPrompts';

type ReflectionAnswers = Partial<Record<WeeklyReflectionPromptId, string>>;
type WeeklyReflectionDraftRepository = WorkEntryDraftReader &
  Pick<WorkEntryDraftWriter, 'saveActive'>;

export type ReflectionHandoffState =
  | { status: 'idle' }
  | { status: 'saving'; promptId: WeeklyReflectionPromptId }
  | { status: 'active-draft'; promptId: WeeklyReflectionPromptId }
  | { status: 'error'; promptId: WeeklyReflectionPromptId };

type UseWeeklyReflectionControllerInput = {
  onOpenLog: () => void;
  repository?: WeeklyReflectionDraftRepository;
};

export function useWeeklyReflectionController({
  onOpenLog,
  repository = workEntryDraftRepository,
}: UseWeeklyReflectionControllerInput) {
  const [promptIndex, setPromptIndex] = useState(0);
  const [answers, setAnswers] = useState<ReflectionAnswers>({});
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [handoffState, setHandoffState] = useState<ReflectionHandoffState>({
    status: 'idle',
  });
  const handoffInProgressRef = useRef(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

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
    const normalizedAnswer = currentAnswer.trim();
    if (saveAnswer && normalizedAnswer) {
      nextAnswers[prompt.id] = normalizedAnswer;
    } else {
      delete nextAnswers[prompt.id];
    }

    setAnswers(nextAnswers);
    setCurrentAnswer('');
    setHandoffState({ status: 'idle' });

    if (promptIndex === WEEKLY_REFLECTION_PROMPTS.length - 1) {
      setReviewing(true);
      return;
    }

    setPromptIndex(promptIndex + 1);
  };

  const handoffToLog = async (
    promptId: WeeklyReflectionPromptId,
    answer: string,
  ) => {
    const promptToLog = WEEKLY_REFLECTION_PROMPTS.find(
      (item) => item.id === promptId,
    );
    const normalizedAnswer = answer.trim();
    if (!promptToLog || !normalizedAnswer || handoffInProgressRef.current) {
      return;
    }

    handoffInProgressRef.current = true;
    setHandoffState({ status: 'saving', promptId });

    try {
      const activeDraft = await repository.loadActive();
      if (activeDraft && hasWorkEntryDraftContent(activeDraft)) {
        if (mountedRef.current) {
          setHandoffState({ status: 'active-draft', promptId });
        }
        return;
      }

      await repository.saveActive({
        ...EMPTY_WORK_ENTRY_DRAFT,
        step: 'event',
        intent: promptToLog.intent,
        rawNote: normalizedAnswer,
      });

      if (!mountedRef.current) {
        return;
      }

      setHandoffState({ status: 'idle' });
      onOpenLog();
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          feature: 'weekly-reflection',
          operation: 'handoff-to-log',
        },
      });

      if (mountedRef.current) {
        setHandoffState({ status: 'error', promptId });
      }
    } finally {
      handoffInProgressRef.current = false;
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
