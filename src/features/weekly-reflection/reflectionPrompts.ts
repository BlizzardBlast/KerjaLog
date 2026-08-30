import type { LogEventIntent } from '@/domain/entry/impact';

export const WEEKLY_REFLECTION_PROMPTS = [
  { id: 'moved_forward', intent: 'completed' },
  { id: 'helped', intent: 'helped' },
  { id: 'problem', intent: 'solved' },
  { id: 'learned', intent: 'learned' },
] as const satisfies readonly { id: string; intent: LogEventIntent }[];

export type WeeklyReflectionPrompt = (typeof WEEKLY_REFLECTION_PROMPTS)[number];
export type WeeklyReflectionPromptId = WeeklyReflectionPrompt['id'];

export const WEEKLY_REFLECTION_PROMPT_IDS: readonly WeeklyReflectionPromptId[] =
  WEEKLY_REFLECTION_PROMPTS.map(({ id }) => id);
