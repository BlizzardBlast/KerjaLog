import {
  ENTRY_STATUSES,
  ENTRY_TYPES,
  EVIDENCE_TYPES,
  type EvidenceType,
  OUTCOME_TYPES,
  type WorkEntry,
} from '@/domain/entry/model';
import { isCanonicalIsoTimestamp } from '@/domain/entry/timestamp';

export type JoinedWorkEntryRow = {
  id: string;
  type: string;
  title: string;
  raw_note: string;
  impact_statement: string | null;
  occurred_at: string;
  outcome_type: string | null;
  status: string;
  excluded_from_exports: number;
  created_at: string;
  updated_at: string;
  evidence_type: string | null;
  evidence_text_value: string | null;
};

type AccumulatedWorkEntry = {
  entry: WorkEntry;
  evidenceTypes: EvidenceType[];
  evidenceDetail: string | null;
};

export function mapJoinedWorkEntryRows(
  rows: JoinedWorkEntryRow[],
): WorkEntry[] {
  const entries = new Map<string, AccumulatedWorkEntry>();

  for (const row of rows) {
    const parsed = parseJoinedWorkEntryRow(row);
    validateEvidenceRow(parsed.evidenceType, parsed.evidenceTextValue);

    let accumulated = entries.get(parsed.entry.id);
    if (!accumulated) {
      accumulated = {
        entry: parsed.entry,
        evidenceTypes: [],
        evidenceDetail: null,
      };
      entries.set(parsed.entry.id, accumulated);
    }

    accumulateEvidence(
      accumulated,
      parsed.evidenceType,
      parsed.evidenceTextValue,
    );
  }

  return [...entries.values()].map(toWorkEntry);
}

function parseJoinedWorkEntryRow(row: JoinedWorkEntryRow): {
  entry: WorkEntry;
  evidenceType: EvidenceType | null;
  evidenceTextValue: string | null;
} {
  const outcomeType =
    row.outcome_type === null
      ? null
      : expectOneOf(row.outcome_type, OUTCOME_TYPES, 'work entry outcome type');
  const evidenceType =
    row.evidence_type === null
      ? null
      : expectOneOf(row.evidence_type, EVIDENCE_TYPES, 'evidence type');
  const evidenceTextValue = expectNullableNonEmptyString(
    row.evidence_text_value,
    'evidence text value',
  );

  return {
    entry: {
      id: expectNonEmptyString(row.id, 'work entry id'),
      type: expectOneOf(row.type, ENTRY_TYPES, 'work entry type'),
      title: expectNonEmptyString(row.title, 'work entry title'),
      rawNote: expectNonEmptyString(row.raw_note, 'work entry raw note'),
      impactStatement: expectNullableNonEmptyString(
        row.impact_statement,
        'work entry impact statement',
      ),
      occurredAt: expectIsoTimestamp(row.occurred_at, 'work entry occurred at'),
      outcomeType,
      status: expectOneOf(row.status, ENTRY_STATUSES, 'work entry status'),
      evidence: null,
      excludedFromExports: expectBooleanInteger(
        row.excluded_from_exports,
        'work entry excluded from exports',
      ),
      createdAt: expectIsoTimestamp(row.created_at, 'work entry created at'),
      updatedAt: expectIsoTimestamp(row.updated_at, 'work entry updated at'),
    },
    evidenceType,
    evidenceTextValue,
  };
}

function accumulateEvidence(
  accumulated: AccumulatedWorkEntry,
  evidenceType: EvidenceType | null,
  evidenceTextValue: string | null,
): void {
  if (
    evidenceType !== null &&
    !accumulated.evidenceTypes.includes(evidenceType)
  ) {
    accumulated.evidenceTypes.push(evidenceType);
  }

  if (evidenceTextValue === null) {
    return;
  }

  if (
    accumulated.evidenceDetail !== null &&
    accumulated.evidenceDetail !== evidenceTextValue
  ) {
    throw new Error('Stored evidence is inconsistent.');
  }

  accumulated.evidenceDetail = evidenceTextValue;
}

function toWorkEntry({
  entry,
  evidenceTypes,
  evidenceDetail,
}: AccumulatedWorkEntry): WorkEntry {
  if (evidenceTypes.length === 0) {
    if (evidenceDetail !== null) {
      throw new Error('Stored evidence is inconsistent.');
    }

    return entry;
  }

  if (evidenceDetail === null) {
    throw new Error('Stored evidence is incomplete.');
  }

  return {
    ...entry,
    evidence: {
      types: [...evidenceTypes].sort(compareEvidenceTypes),
      detail: evidenceDetail,
    },
  };
}

function validateEvidenceRow(type: EvidenceType | null, detail: string | null) {
  if ((type === null) !== (detail === null)) {
    throw new Error('Stored evidence is incomplete.');
  }
}

function compareEvidenceTypes(left: EvidenceType, right: EvidenceType): number {
  return EVIDENCE_TYPES.indexOf(left) - EVIDENCE_TYPES.indexOf(right);
}

function expectNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Stored ${field} is invalid.`);
  }

  return value;
}

function expectIsoTimestamp(value: unknown, field: string): string {
  if (!isCanonicalIsoTimestamp(value)) {
    throw new Error(`Stored ${field} is invalid.`);
  }

  return value;
}

function expectNullableNonEmptyString(
  value: unknown,
  field: string,
): string | null {
  if (value === null) {
    return null;
  }

  return expectNonEmptyString(value, field);
}

function expectBooleanInteger(value: unknown, field: string): boolean {
  if (value === 0) {
    return false;
  }

  if (value === 1) {
    return true;
  }

  throw new Error(`Stored ${field} is invalid.`);
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
