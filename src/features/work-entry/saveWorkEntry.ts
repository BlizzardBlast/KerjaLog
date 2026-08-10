import { workEntryRepository } from '@/data/repositories/workEntryRepository';
import {
  buildEntryTitle,
  deriveEntryStatus,
  hasUsefulEvidence,
  type LogEventIntent,
} from '@/domain/entry/impact';
import type {
  EvidenceType,
  OutcomeType,
  WorkEntry,
} from '@/domain/entry/model';
import type { WorkEntryRepository } from '@/domain/entry/repository';
import { entryTypeByIntent } from '@/features/work-entry/model';

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
  repository: WorkEntryRepository = workEntryRepository,
): Promise<WorkEntry> {
  const rawNote = draft.rawNote.trim();
  if (!rawNote) {
    throw new Error('A work entry requires a note.');
  }

  const evidenceTypes = [...new Set(draft.evidenceTypes)];
  const evidenceDetail = draft.evidenceDetail.trim();
  const hasEvidence = hasUsefulEvidence(evidenceTypes, evidenceDetail);
  const now = new Date().toISOString();

  return repository.create({
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
