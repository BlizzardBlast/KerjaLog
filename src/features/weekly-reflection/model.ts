import type { WeeklyReflectionPromptId } from '@/features/weekly-reflection/reflectionPrompts';

export type ReflectionHandoffState =
  | { status: 'idle' }
  | { status: 'saving'; promptId: WeeklyReflectionPromptId }
  | { status: 'active-draft'; promptId: WeeklyReflectionPromptId }
  | { status: 'error'; promptId: WeeklyReflectionPromptId };
