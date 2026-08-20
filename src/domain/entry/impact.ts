import type {
  EntryStatus,
  EvidenceType,
  OutcomeType,
} from '@/domain/entry/model';

export const LOG_EVENT_INTENTS = [
  'completed',
  'solved',
  'helped',
  'feedback',
  'learned',
  'ownership',
  'challenge',
] as const;

export type LogEventIntent = (typeof LOG_EVENT_INTENTS)[number];

export type ImpactBuilderCopy = {
  intentLead: Record<LogEventIntent, string>;
  outcomeLabel: Record<Exclude<OutcomeType, 'unsure'>, string>;
  outcomePrefix: string;
  evidencePrefix: string;
};

export type BuildImpactStatementInput = {
  intent: LogEventIntent;
  rawNote: string;
  outcomeType: OutcomeType;
  evidenceDetail?: string;
};

export type BuildRefinementImpactStatementInput = {
  rawNote: string;
  outcomeType: OutcomeType;
  evidenceDetail?: string;
};

export function deriveEntryStatus(
  outcomeType: OutcomeType | null,
  evidenceDetail?: string,
  impactStatement?: string,
): EntryStatus {
  if (!outcomeType || outcomeType === 'unsure') {
    return 'quick_note';
  }

  if (evidenceDetail?.trim() && impactStatement?.trim()) {
    return 'review_ready';
  }

  return 'developed';
}

export function buildEntryTitle(rawNote: string, maxLength = 72): string {
  const normalized = normalizeWhitespace(rawNote);
  const firstSentence = normalized.split(/(?<=[.!?])\s/u, 1)[0] ?? normalized;

  if (firstSentence.length <= maxLength) {
    return trimEndingPunctuation(firstSentence);
  }

  const clipped = firstSentence.slice(0, Math.max(1, maxLength - 1));
  const lastSpace = clipped.lastIndexOf(' ');
  const safeClip =
    lastSpace >= Math.floor(maxLength * 0.6)
      ? clipped.slice(0, lastSpace)
      : clipped;

  return `${trimEndingPunctuation(safeClip)}…`;
}

export function buildImpactStatement(
  input: BuildImpactStatementInput,
  copy: ImpactBuilderCopy,
): string {
  const note = ensureSentence(input.rawNote);
  const parts = [`${copy.intentLead[input.intent]}: ${note}`];

  appendOutcomeAndEvidence(parts, input, copy);

  return parts.join(' ');
}

export function buildRefinementImpactStatement(
  input: BuildRefinementImpactStatementInput,
  copy: Omit<ImpactBuilderCopy, 'intentLead'>,
): string {
  const parts = [ensureSentence(input.rawNote)];

  appendOutcomeAndEvidence(parts, input, copy);

  return parts.join(' ');
}

export function hasUsefulEvidence(
  evidenceTypes: EvidenceType[],
  evidenceDetail: string,
): boolean {
  return evidenceTypes.length > 0 && evidenceDetail.trim().length > 0;
}

export function hasIncompleteEvidence(
  evidenceTypes: EvidenceType[],
  evidenceDetail: string,
): boolean {
  const hasTypes = evidenceTypes.length > 0;
  const hasDetail = evidenceDetail.trim().length > 0;

  return hasTypes !== hasDetail;
}

function appendOutcomeAndEvidence(
  parts: string[],
  input: BuildRefinementImpactStatementInput,
  copy: Omit<ImpactBuilderCopy, 'intentLead'>,
): void {
  if (input.outcomeType !== 'unsure') {
    parts.push(
      `${copy.outcomePrefix}: ${ensureSentence(
        copy.outcomeLabel[input.outcomeType],
      )}`,
    );
  }

  const evidence = input.evidenceDetail?.trim();
  if (evidence) {
    parts.push(`${copy.evidencePrefix}: ${ensureSentence(evidence)}`);
  }
}

function normalizeWhitespace(value: string): string {
  return value.trim().replace(/\s+/gu, ' ');
}

function ensureSentence(value: string): string {
  const normalized = normalizeWhitespace(value);
  if (!normalized) {
    return normalized;
  }

  return /[.!?]$/u.test(normalized) ? normalized : `${normalized}.`;
}

function trimEndingPunctuation(value: string): string {
  return value.trim().replace(/[.!?]+$/u, '');
}
