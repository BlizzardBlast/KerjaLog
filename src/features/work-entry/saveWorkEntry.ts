import { workEntryRepository } from '@/data/repositories/workEntryRepository';
import {
  buildEntryTitle,
  deriveEntryStatus,
  hasIncompleteEvidence,
  hasUsefulEvidence,
  type LogEventIntent,
} from '@/domain/entry/impact';
import type {
  EvidenceType,
  OutcomeType,
  WorkEntry,
} from '@/domain/entry/model';
import type { WorkEntryWriter } from '@/domain/entry/repository';
import { entryTypeByIntent } from '@/features/work-entry/intentMapping';

export type SaveWorkEntryDraft = {
  intent: LogEventIntent;
  rawNote: string;
  outcomeType: OutcomeType | null;
  evidenceTypes: EvidenceType[];
  evidenceDetail: string;
  impactStatement: string | null;
};

export async function saveWorkEntry(
  draft: SaveWorkEntryDraft,
  repository: WorkEntryWriter = workEntryRepository,
): Promise<WorkEntry> {
  const rawNote = draft.rawNote.trim();
  if (!rawNote) {
    throw new Error('A work entry requires a note.');
  }

  const evidenceTypes = [...new Set(draft.evidenceTypes)];
  const evidenceDetail = draft.evidenceDetail.trim();

  if (hasIncompleteEvidence(evidenceTypes, evidenceDetail)) {
    throw new Error('Evidence requires both a type and a supporting detail.');
  }

  const hasEvidence = hasUsefulEvidence(evidenceTypes, evidenceDetail);
  const now = new Date().toISOString();

  return repository.commit({
    type: entryTypeByIntent[draft.intent],
    title: buildEntryTitle(rawNote),
    rawNote,
    impactStatement: draft.impactStatement?.trim() || null,
    occurredAt: now,
    outcomeType: draft.outcomeType,
    status: deriveEntryStatus(
      draft.outcomeType,
      hasEvidence ? evidenceDetail : undefined,
    ),
    evidence: hasEvidence
      ? {
          types: evidenceTypes,
          detail: evidenceDetail,
        }
      : null,
    excludedFromExports: draft.intent === 'challenge',
  });
}
