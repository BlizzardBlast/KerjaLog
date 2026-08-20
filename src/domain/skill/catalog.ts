import type { SkillId } from '@/domain/skill/model';

export type SkillCategory = 'core' | 'role_specific';

export type SkillDefinition = {
  id: SkillId;
  nameKey:
    | 'skill.communication'
    | 'skill.collaboration'
    | 'skill.problemSolving'
    | 'skill.execution'
    | 'skill.attentionToDetail'
    | 'skill.customerOrientation'
    | 'skill.ownership'
    | 'skill.adaptability'
    | 'skill.leadership'
    | 'skill.roleExpertise';
  category: SkillCategory;
};

export const SKILL_CATALOG: readonly SkillDefinition[] = [
  { id: 'communication', nameKey: 'skill.communication', category: 'core' },
  { id: 'collaboration', nameKey: 'skill.collaboration', category: 'core' },
  {
    id: 'problem_solving',
    nameKey: 'skill.problemSolving',
    category: 'core',
  },
  { id: 'execution', nameKey: 'skill.execution', category: 'core' },
  {
    id: 'attention_to_detail',
    nameKey: 'skill.attentionToDetail',
    category: 'core',
  },
  {
    id: 'customer_orientation',
    nameKey: 'skill.customerOrientation',
    category: 'core',
  },
  { id: 'ownership', nameKey: 'skill.ownership', category: 'core' },
  { id: 'adaptability', nameKey: 'skill.adaptability', category: 'core' },
  { id: 'leadership', nameKey: 'skill.leadership', category: 'core' },
  {
    id: 'role_expertise',
    nameKey: 'skill.roleExpertise',
    category: 'role_specific',
  },
] as const;

export const skillDefinitionById = Object.fromEntries(
  SKILL_CATALOG.map((skill) => [skill.id, skill]),
) as Record<SkillId, SkillDefinition>;
