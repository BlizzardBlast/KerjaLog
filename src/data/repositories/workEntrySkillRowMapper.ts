import {
  ENTRY_SKILL_SOURCES,
  SKILL_IDS,
  type EntrySkillSource,
  type SkillId,
  type WorkEntrySkill,
} from '@/domain/skill/model';

export type WorkEntrySkillRow = {
  skill_id: string;
  source: string;
};

export function mapWorkEntrySkillRows(rows: WorkEntrySkillRow[]): WorkEntrySkill[] {
  const skills = new Map<SkillId, WorkEntrySkill>();

  for (const row of rows) {
    const id = expectOneOf(row.skill_id, SKILL_IDS, 'work entry skill id');
    const source = expectOneOf(
      row.source,
      ENTRY_SKILL_SOURCES,
      'work entry skill source',
    );

    skills.set(id, { id, source });
  }

  return [...skills.values()].sort(compareSkills);
}

function compareSkills(left: WorkEntrySkill, right: WorkEntrySkill): number {
  return SKILL_IDS.indexOf(left.id) - SKILL_IDS.indexOf(right.id);
}

function expectOneOf<const Values extends readonly string[]>(
  value: unknown,
  values: Values,
  field: string,
): Values[number] {
  if (typeof value !== 'string' || !values.includes(value as Values[number])) {
    throw new Error(`Stored ${field} is invalid.`);
  }

  return value as Values[number];
}

export type { EntrySkillSource };
