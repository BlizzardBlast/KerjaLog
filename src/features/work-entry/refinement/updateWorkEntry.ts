import { workEntryRepository } from '@/data/repositories/workEntryRepository';
import {
  buildEntryTitle,
  deriveEntryStatus,
  hasUsefulEvidence,
} from '@/domain/entry/impact';
import type { WorkEntryDetail } from '@/domain/entry/model';
import type { WorkEntryUpdater } from '@/domain/entry/repository';
import type { WorkEntrySkill } from '@/domain/skill/model';
import {
  entryRefinementSchema,
  type EntryRefinementValues,
} from '@/features/work-entry/refinement/refinementSchema';

export async function updateWorkEntry(
  originalEntry: WorkEntryDetail,
  values: EntryRefinementValues,
  repository: WorkEntryUpdater = workEntryRepository,
): Promise<WorkEntryDetail> {
  const parsed = entryRefinementSchema.safeParse(values);
  if (!parsed.success) {
    throw new Error('Work entry refinement is invalid.');
  }

  const rawNote = parsed.data.rawNote.trim();
  const evidenceTypes = [...new Set(parsed.data.evidenceTypes)];
  const evidenceDetail = parsed.data.evidenceDetail.trim();
  const hasEvidence = hasUsefulEvidence(evidenceTypes, evidenceDetail);
  const impactStatement = parsed.data.impactStatement.trim() || null;

  return repository.update(originalEntry.id, {
    type: parsed.data.type,
    title: buildEntryTitle(rawNote),
    rawNote,
    impactStatement,
    impactStatementSource: impactStatement
      ? parsed.data.impactStatementSource
      : null,
    occurredAt: originalEntry.occurredAt,
    outcomeType: parsed.data.outcomeType,
    status: deriveEntryStatus(
      parsed.data.outcomeType,
      hasEvidence ? evidenceDetail : undefined,
      impactStatement ?? undefined,
    ),
    evidence: hasEvidence
      ? { types: evidenceTypes, detail: evidenceDetail }
      : null,
    skills: dedupeSkills(parsed.data.skills),
    excludedFromExports:
      parsed.data.type === 'challenge' || originalEntry.excludedFromExports,
  });
}

function dedupeSkills(skills: WorkEntrySkill[]): WorkEntrySkill[] {
  return [...new Map(skills.map((skill) => [skill.id, skill])).values()];
}
