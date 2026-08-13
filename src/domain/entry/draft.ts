import { LOG_EVENT_INTENTS, type LogEventIntent } from '@/domain/entry/impact';
import {
  EVIDENCE_TYPES,
  type EvidenceType,
  IMPACT_STATEMENT_SOURCES,
  type ImpactStatementSource,
  OUTCOME_TYPES,
  type OutcomeType,
} from '@/domain/entry/model';

export const WORK_ENTRY_DRAFT_STEPS = [
  'type',
  'event',
  'outcome',
  'evidence',
  'impact',
] as const;

export type WorkEntryDraftStep = (typeof WORK_ENTRY_DRAFT_STEPS)[number];

export type WorkEntryDraft = {
  step: WorkEntryDraftStep;
  intent: LogEventIntent | null;
  rawNote: string;
  outcomeType: OutcomeType | null;
  evidenceTypes: EvidenceType[];
  evidenceDetail: string;
  impactStatement: string;
  impactStatementSource: ImpactStatementSource | null;
};

export const EMPTY_WORK_ENTRY_DRAFT: WorkEntryDraft = {
  step: 'type',
  intent: null,
  rawNote: '',
  outcomeType: null,
  evidenceTypes: [],
  evidenceDetail: '',
  impactStatement: '',
  impactStatementSource: null,
};

export function hasWorkEntryDraftContent(draft: WorkEntryDraft): boolean {
  return (
    draft.intent !== null ||
    draft.rawNote.trim().length > 0 ||
    draft.outcomeType !== null ||
    draft.evidenceTypes.length > 0 ||
    draft.evidenceDetail.trim().length > 0 ||
    draft.impactStatement.trim().length > 0 ||
    draft.impactStatementSource !== null
  );
}

export function isWorkEntryDraftStep(
  value: unknown,
): value is WorkEntryDraftStep {
  return (
    typeof value === 'string' &&
    WORK_ENTRY_DRAFT_STEPS.includes(value as WorkEntryDraftStep)
  );
}

export function isLogEventIntent(value: unknown): value is LogEventIntent {
  return (
    typeof value === 'string' &&
    LOG_EVENT_INTENTS.includes(value as LogEventIntent)
  );
}

export function isOutcomeType(value: unknown): value is OutcomeType {
  return (
    typeof value === 'string' && OUTCOME_TYPES.includes(value as OutcomeType)
  );
}

export function isEvidenceType(value: unknown): value is EvidenceType {
  return (
    typeof value === 'string' && EVIDENCE_TYPES.includes(value as EvidenceType)
  );
}

export function isImpactStatementSource(
  value: unknown,
): value is ImpactStatementSource {
  return (
    typeof value === 'string' &&
    IMPACT_STATEMENT_SOURCES.includes(value as ImpactStatementSource)
  );
}
