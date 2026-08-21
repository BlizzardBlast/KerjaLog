export const SKILL_IDS = [
  'communication',
  'collaboration',
  'problem_solving',
  'execution',
  'attention_to_detail',
  'customer_orientation',
  'ownership',
  'adaptability',
  'leadership',
  'role_expertise',
] as const;

export type SkillId = (typeof SKILL_IDS)[number];

export function isSkillId(value: unknown): value is SkillId {
  return typeof value === 'string' && SKILL_IDS.some((id) => id === value);
}

export const ENTRY_SKILL_SOURCES = ['rules', 'user'] as const;

export type EntrySkillSource = (typeof ENTRY_SKILL_SOURCES)[number];

export type WorkEntrySkill = {
  id: SkillId;
  source: EntrySkillSource;
};
