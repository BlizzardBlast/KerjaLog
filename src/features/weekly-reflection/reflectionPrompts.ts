import type { LogEventIntent } from '@/domain/entry/impact';

export const WEEKLY_REFLECTION_PROMPT_IDS = [
  'moved_forward',
  'helped',
  'problem',
  'learned',
] as const;

export type WeeklyReflectionPromptId =
  (typeof WEEKLY_REFLECTION_PROMPT_IDS)[number];

export type WeeklyReflectionPrompt = {
  id: WeeklyReflectionPromptId;
  intent: LogEventIntent;
};

export const WEEKLY_REFLECTION_PROMPTS: readonly WeeklyReflectionPrompt[] = [
  { id: 'moved_forward', intent: 'completed' },
  { id: 'helped', intent: 'helped' },
  { id: 'problem', intent: 'solved' },
  { id: 'learned', intent: 'learned' },
];
