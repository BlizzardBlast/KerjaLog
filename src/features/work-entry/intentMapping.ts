import type { LogEventIntent } from '@/domain/entry/impact';
import type { EntryType } from '@/domain/entry/model';

export const entryTypeByIntent: Record<LogEventIntent, EntryType> = {
  completed: 'contribution',
  solved: 'problem_solved',
  helped: 'contribution',
  feedback: 'feedback',
  learned: 'learning',
  ownership: 'ownership',
  challenge: 'challenge',
};
