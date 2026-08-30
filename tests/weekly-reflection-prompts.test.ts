import { LOG_EVENT_INTENTS } from '@/domain/entry/impact';
import {
  WEEKLY_REFLECTION_PROMPT_IDS,
  WEEKLY_REFLECTION_PROMPTS,
} from '@/features/weekly-reflection/reflectionPrompts';

describe('weekly reflection prompts', () => {
  it('keeps the four product-defined recovery prompts in order', () => {
    expect(WEEKLY_REFLECTION_PROMPT_IDS).toEqual([
      'moved_forward',
      'helped',
      'problem',
      'learned',
    ]);
    expect(WEEKLY_REFLECTION_PROMPTS.map((prompt) => prompt.id)).toEqual(
      WEEKLY_REFLECTION_PROMPT_IDS,
    );
  });

  it('maps every prompt to an existing work-entry intent', () => {
    for (const prompt of WEEKLY_REFLECTION_PROMPTS) {
      expect(LOG_EVENT_INTENTS).toContain(prompt.intent);
    }

    expect(WEEKLY_REFLECTION_PROMPTS).toEqual([
      { id: 'moved_forward', intent: 'completed' },
      { id: 'helped', intent: 'helped' },
      { id: 'problem', intent: 'solved' },
      { id: 'learned', intent: 'learned' },
    ]);
  });
});
