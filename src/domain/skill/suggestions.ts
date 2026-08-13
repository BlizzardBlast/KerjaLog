import type { EntryType, OutcomeType } from '@/domain/entry/model';
import type { SkillId } from '@/domain/skill/model';

type SuggestSkillIdsInput = {
  entryType: EntryType;
  outcomeType: OutcomeType | null;
};

const skillsByEntryType: Partial<Record<EntryType, readonly SkillId[]>> = {
  problem_solved: ['problem_solving'],
  feedback: ['communication'],
  learning: ['adaptability', 'role_expertise'],
  ownership: ['ownership', 'execution'],
  challenge: ['adaptability'],
};

const skillsByOutcome: Partial<Record<OutcomeType, readonly SkillId[]>> = {
  deadline_met: ['execution', 'ownership'],
  error_fixed_or_prevented: ['problem_solving', 'attention_to_detail'],
  work_faster: ['execution', 'problem_solving'],
  work_clearer: ['communication', 'execution'],
  person_helped: ['collaboration', 'customer_orientation'],
  risk_reduced: ['attention_to_detail', 'ownership'],
  decision_enabled: ['problem_solving', 'communication'],
  skill_gained: ['adaptability', 'role_expertise'],
};

export function suggestSkillIds({
  entryType,
  outcomeType,
}: SuggestSkillIdsInput): SkillId[] {
  const suggestions = new Set<SkillId>(skillsByEntryType[entryType] ?? []);

  if (outcomeType && outcomeType !== 'unsure') {
    for (const skillId of skillsByOutcome[outcomeType] ?? []) {
      suggestions.add(skillId);
    }
  }

  return [...suggestions];
}
