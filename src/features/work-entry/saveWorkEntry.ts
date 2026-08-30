import { workEntryRepository } from '@/data/repositories/workEntryRepository';
import {
  buildEntryTitle,
  deriveEntryStatus,
  hasIncompleteEvidence,
  hasUsefulEvidence,
  type LogEventIntent,
} from '@/domain/entry/impact';
import { assertWorkEntryTextWithinLimits } from '@/domain/entry/limits';
import type {
  EvidenceType,
  ImpactStatementSource,
  OutcomeType,
  WorkEntry,
} from '@/domain/entry/model';
import type { WorkEntryWriter } from '@/domain/entry/repository';
import type { WorkEntrySkill } from '@/domain/skill/model';
import { entryTypeByIntent } from '@/features/work-entry/intentMapping';

export type SaveWorkEntryDraft = {
  intent: LogEventIntent;
  rawNote: string;
  workAreaId: string | null;
  outcomeType: OutcomeType | null;
  evidenceTypes: EvidenceType[];
  evidenceDetail: string;
  skills: WorkEntrySkill[];
  impactStatement: string | null;
  impactStatementSource: ImpactStatementSource | null;
};

export async function saveWorkEntry(
  draft: SaveWorkEntryDraft,
  repository: WorkEntryWriter = workEntryRepository,
): Promise<WorkEntry> {
  assertWorkEntryTextWithinLimits({
    rawNote: draft.rawNote,
    evidenceDetail: draft.evidenceDetail,
    impactStatement: draft.impactStatement,
  });

  const rawNote = draft.rawNote.trim();
  if (!rawNote) throw new Error('A work entry requires a note.');

  const evidenceTypes = [...new Set(draft.evidenceTypes)];
  const evidenceDetail = draft.evidenceDetail.trim();
  if (hasIncompleteEvidence(evidenceTypes, evidenceDetail)) {
    throw new Error('Evidence requires both a type and a supporting detail.');
  }

  const hasEvidence = hasUsefulEvidence(evidenceTypes, evidenceDetail);
  const impactStatement = draft.impactStatement?.trim() || null;
  if ((impactStatement !== null) !== (draft.impactStatementSource !== null)) {
    throw new Error('Impact statement provenance is inconsistent.');
  }

  const skills = [
    ...new Map(draft.skills.map((skill) => [skill.id, skill])).values(),
  ];
  const now = new Date().toISOString();
  return repository.commit({
    type: entryTypeByIntent[draft.intent],
    title: buildEntryTitle(rawNote),
    rawNote,
    workAreaId: draft.workAreaId,
    impactStatement,
    impactStatementSource: draft.impactStatementSource,
    occurredAt: now,
    outcomeType: draft.outcomeType,
    status: deriveEntryStatus(
      draft.outcomeType,
      hasEvidence ? evidenceDetail : undefined,
      impactStatement ?? undefined,
    ),
    evidence: hasEvidence
      ? { types: evidenceTypes, detail: evidenceDetail }
      : null,
    skills,
    excludedFromExports: draft.intent === 'challenge',
  });
}
