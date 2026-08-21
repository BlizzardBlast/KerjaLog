import {
  buildSkillEvidenceSqlQuery,
  GROWTH_EVIDENCE_MAP_SQL,
} from '@/data/queries/growthEvidenceQuery';
import {
  mapGrowthEvidenceMapRows,
  mapSkillEvidenceEntryRows,
} from '@/data/repositories/growthEvidenceRowMapper';
import { SKILL_CATALOG } from '@/domain/skill/catalog';

describe('Growth evidence data mapping', () => {
  const rows = SKILL_CATALOG.map((skill, index) => ({
    skill_id: skill.id,
    entry_count: index === 0 ? 2 : 0,
    total_entry_count: 5,
  })).reverse();

  test('returns every canonical skill in catalog order including zero-evidence skills', () => {
    const result = mapGrowthEvidenceMapRows(rows);

    expect(result.totalEntries).toBe(5);
    expect(result.skills.map((skill) => skill.skillId)).toEqual(
      SKILL_CATALOG.map((skill) => skill.id),
    );
    expect(result.skills[0]).toEqual({
      skillId: 'communication',
      entryCount: 2,
    });
    expect(result.skills[1]?.entryCount).toBe(0);
  });

  test('rejects incomplete, duplicated, or malformed aggregate rows', () => {
    expect(() => mapGrowthEvidenceMapRows(rows.slice(1))).toThrow(
      'Stored Growth skill catalog is incomplete.',
    );

    const duplicated = [...rows];
    const duplicateSource = duplicated.at(1);
    if (!duplicateSource) {
      throw new Error('Test fixture must contain at least two skills.');
    }
    duplicated[0] = { ...duplicateSource };
    expect(() => mapGrowthEvidenceMapRows(duplicated)).toThrow(
      'Stored Growth skill summary is duplicated.',
    );

    const invalidCount = rows.map((row, index) =>
      index === 0 ? { ...row, entry_count: -1 } : row,
    );
    expect(() => mapGrowthEvidenceMapRows(invalidCount)).toThrow(
      'Stored Growth skill entry count is invalid.',
    );
  });

  test('maps evidence detail rows only after validating persisted facts', () => {
    expect(
      mapSkillEvidenceEntryRows([
        {
          id: 'entry-1',
          title: 'Resolved reconciliation discrepancies',
          occurred_at: '2026-08-06T08:00:00.000Z',
          supporting_text: 'Removed 7 duplicate entries before submission.',
        },
      ]),
    ).toEqual([
      {
        id: 'entry-1',
        title: 'Resolved reconciliation discrepancies',
        occurredAt: '2026-08-06T08:00:00.000Z',
        supportingText: 'Removed 7 duplicate entries before submission.',
      },
    ]);

    expect(() =>
      mapSkillEvidenceEntryRows([
        {
          id: 'entry-1',
          title: 'Entry',
          occurred_at: 'not-a-date',
          supporting_text: 'Evidence',
        },
      ]),
    ).toThrow('Stored Growth entry timestamp is invalid.');
  });

  test('keeps aggregate and detail queries evidence-first and parameterized', () => {
    expect(GROWTH_EVIDENCE_MAP_SQL).toContain('FROM skills');
    expect(GROWTH_EVIDENCE_MAP_SQL).toContain('LEFT JOIN entry_skills');

    const query = buildSkillEvidenceSqlQuery('attention_to_detail');
    expect(query.parameters).toEqual({ $skillId: 'attention_to_detail' });
    expect(query.sql).toContain('WHERE entry_skills.skill_id = $skillId');
    expect(query.sql).toContain('SELECT evidence.text_value');
    expect(query.sql).toContain('work_entries.impact_statement');
    expect(query.sql).toContain('work_entries.raw_note');
  });
});
