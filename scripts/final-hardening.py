from pathlib import Path
import re


def replace_once(text: str, old: str, new: str) -> str:
    if new in text:
        return text
    if old not in text:
        raise RuntimeError(f"Expected patch target not found:\n{old}")
    return text.replace(old, new, 1)


repository = Path("src/data/repositories/SQLiteWorkEntryRepository.ts")
text = repository.read_text()
text = replace_once(
    text,
    """type ImpactSourceRow = {
  impact_statement_source: unknown;
};""",
    """type DetailedJoinedWorkEntryRow = JoinedWorkEntryRow & {
  impact_statement_source: unknown;
};""",
)
text = replace_once(
    text,
    "const rows = await db.getAllAsync<JoinedWorkEntryRow>(",
    "const rows = await db.getAllAsync<DetailedJoinedWorkEntryRow>(",
)
text = replace_once(
    text,
    """            work_entries.impact_statement,
            work_entries.occurred_at,""",
    """            work_entries.impact_statement,
            work_entries.impact_statement_source,
            work_entries.occurred_at,""",
)
text = replace_once(
    text,
    """      const entry = mapJoinedWorkEntryRows(rows)[0];
      if (!entry) {
        return null;
      }

      const [skillRows, impactSourceRow] = await Promise.all([
        db.getAllAsync<WorkEntrySkillRow>(
          `
            SELECT skill_id, source
            FROM entry_skills
            WHERE entry_id = $id
            ORDER BY skill_id ASC
          `,
          { $id: id },
        ),
        db.getFirstAsync<ImpactSourceRow>(
          `
            SELECT impact_statement_source
            FROM work_entries
            WHERE id = $id
          `,
          { $id: id },
        ),
      ]);

      if (!impactSourceRow) {
        throw new Error('Stored work entry impact source is missing.');
      }

      return {
        ...entry,
        skills: mapWorkEntrySkillRows(skillRows),
        impactStatementSource: mapImpactStatementSource(
          impactSourceRow.impact_statement_source,
          entry.impactStatement,
        ),
      };""",
    """      const firstRow = rows[0];
      const entry = mapJoinedWorkEntryRows(rows)[0];
      if (!entry || !firstRow) {
        return null;
      }

      const impactStatementSource = mapImpactStatementSource(
        firstRow.impact_statement_source,
        entry.impactStatement,
      );
      const skillRows = await db.getAllAsync<WorkEntrySkillRow>(
        `
          SELECT skill_id, source
          FROM entry_skills
          WHERE entry_id = $id
          ORDER BY skill_id ASC
        `,
        { $id: id },
      );

      return {
        ...entry,
        skills: mapWorkEntrySkillRows(skillRows),
        impactStatementSource,
      };""",
)
repository.write_text(text)


tests = Path("tests/sqlite-work-entry-repository.test.ts")
text = tests.read_text()
text = replace_once(
    text,
    """  impact_statement: 'Helped Finance reconcile the monthly report.',
  occurred_at:""",
    """  impact_statement: 'Helped Finance reconcile the monthly report.',
  impact_statement_source: 'generated',
  occurred_at:""",
)
source_pair_old = """      impactStatement: 'Helped Finance reconcile the monthly report.',
      occurredAt:"""
source_pair_new = """      impactStatement: 'Helped Finance reconcile the monthly report.',
      impactStatementSource: 'generated',
      occurredAt:"""
for _ in range(2):
    if source_pair_old in text:
        text = text.replace(source_pair_old, source_pair_new, 1)
text = replace_once(
    text,
    """          impact_statement: 'Corrected the mismatch before submission.',
          outcome_type:""",
    """          impact_statement: 'Corrected the mismatch before submission.',
          impact_statement_source: 'user',
          outcome_type:""",
)
text = replace_once(
    text,
    """      impactStatement: 'Corrected the mismatch before submission.',
      occurredAt:""",
    """      impactStatement: 'Corrected the mismatch before submission.',
      impactStatementSource: 'user',
      occurredAt:""",
)
text = replace_once(
    text,
    """        $rawNote: input.rawNote,
        $excludedFromExports: 0,""",
    """        $rawNote: input.rawNote,
        $impactStatementSource: 'generated',
        $excludedFromExports: 0,""",
)
text = replace_once(
    text,
    """        $rawNote: input.rawNote,
        $status: 'review_ready',""",
    """        $rawNote: input.rawNote,
        $impactStatementSource: 'user',
        $status: 'review_ready',""",
)
tests.write_text(text)


header = Path("src/features/work-entry/components/LogHeader.tsx")
text = header.read_text()
text = re.sub(
    r"const PROGRESS_SEGMENTS = \[\n(?:  'progress-\d+',\n)+\] as const;\n\n",
    "",
    text,
    count=1,
)
text = replace_once(
    text,
    "  const progressSegments = PROGRESS_SEGMENTS.slice(0, totalSteps);",
    """  const progressSegments = Array.from(
    { length: totalSteps },
    (_, index) => `progress-${index + 1}`,
  );""",
)
header.write_text(text)


docs = Path("docs/PRODUCT_AND_ARCHITECTURE.md")
text = docs.read_text()
text = replace_once(
    text,
    """impact_statement
occurred_at""",
    """impact_statement
impact_statement_source
occurred_at""",
)
text = replace_once(
    text,
    "For v1, the Impact Builder must be deterministic and rules/template based. It must not require a remote LLM.",
    """For v1, the Impact Builder must be deterministic and rules/template based. It must not require a remote LLM.

Persist whether a non-empty impact statement is `generated` or `user` authored. Generated statements may be invalidated and rebuilt when the recorded facts change. User-authored impact wording must never be silently overwritten by generated copy. A null impact statement must have null provenance.""",
)
docs.write_text(text)
