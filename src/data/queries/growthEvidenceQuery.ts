import type { SkillId } from '@/domain/skill/model';

export const GROWTH_EVIDENCE_MAP_SQL = `
  SELECT
    skills.id AS skill_id,
    COUNT(entry_skills.entry_id) AS entry_count,
    MAX(work_entries.occurred_at) AS latest_occurred_at,
    (SELECT COUNT(*) FROM work_entries) AS total_entry_count
  FROM skills
  LEFT JOIN entry_skills
    ON entry_skills.skill_id = skills.id
  LEFT JOIN work_entries
    ON work_entries.id = entry_skills.entry_id
  GROUP BY skills.id
`;

export function buildSkillEvidenceSqlQuery(skillId: SkillId) {
  return {
    sql: `
      SELECT
        work_entries.id,
        work_entries.title,
        work_entries.occurred_at,
        COALESCE(
          (
            SELECT evidence.text_value
            FROM evidence
            WHERE evidence.entry_id = work_entries.id
            ORDER BY evidence.created_at ASC, evidence.id ASC
            LIMIT 1
          ),
          work_entries.impact_statement,
          work_entries.raw_note
        ) AS supporting_text
      FROM entry_skills
      INNER JOIN work_entries
        ON work_entries.id = entry_skills.entry_id
      WHERE entry_skills.skill_id = $skillId
      ORDER BY
        work_entries.occurred_at DESC,
        work_entries.created_at DESC,
        work_entries.id DESC
    `,
    parameters: { $skillId: skillId },
  } as const;
}
