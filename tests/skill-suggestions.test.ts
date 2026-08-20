import { suggestSkillIds } from '@/domain/skill/suggestions';

describe('skill suggestions', () => {
  test('suggests broad evidence from confirmed entry facts', () => {
    expect(
      suggestSkillIds({
        entryType: 'problem_solved',
        outcomeType: 'error_fixed_or_prevented',
      }),
    ).toEqual(['problem_solving', 'attention_to_detail']);
  });

  test('deduplicates overlapping rules without ranking the user', () => {
    expect(
      suggestSkillIds({
        entryType: 'ownership',
        outcomeType: 'deadline_met',
      }),
    ).toEqual(['ownership', 'execution']);
  });

  test('does not infer an outcome-specific skill when the outcome is unknown', () => {
    expect(
      suggestSkillIds({
        entryType: 'challenge',
        outcomeType: 'unsure',
      }),
    ).toEqual(['adaptability']);
  });
});
