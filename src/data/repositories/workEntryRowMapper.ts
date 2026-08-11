import {
  ENTRY_STATUSES,
  ENTRY_TYPES,
  EVIDENCE_TYPES,
  type EvidenceType,
  OUTCOME_TYPES,
  type WorkEntry,
} from '@/domain/entry/model';

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

export function mapJoinedWorkEntryRows(rows: JoinedWorkEntryRow[]): WorkEntry[] {
  const entries = new Map<string, AccumulatedWorkEntry>();

  for (const row of rows) {
    const id = expectNonEmptyString(row.id, 'work entry id');
    const type = expectOneOf(row.type, ENTRY_TYPES, 'work entry type');
    const title = expectNonEmptyString(row.title, 'work entry title');
    const rawNote = expectNonEmptyString(row.raw_note, 'work entry raw note');
    const impactStatement = expectNullableNonEmptyString(
      row.impact_statement,
      'work entry impact statement',
    );
    const occurredAt = expectNonEmptyString(
      row.occurred_at,
      'work entry occurred at',
    );
    const outcomeType =
      row.outcome_type === null
        ? null
        : expectOneOf(
            row.outcome_type,
            OUTCOME_TYPES,
            'work entry outcome type',
          );
    const status = expectOneOf(row.status, ENTRY_STATUSES, 'work entry status');
    const excludedFromExports = expectBooleanInteger(
      row.excluded_from_exports,
      'work entry excluded from exports',
    );
    const createdAt = expectNonEmptyString(
      row.created_at,
      'work entry created at',
    );
    const updatedAt = expectNonEmptyString(
      row.updated_at,
      'work entry updated at',
    );
    const evidenceType =
      row.evidence_type === null
        ? null
        : expectOneOf(row.evidence_type, EVIDENCE_TYPES, 'evidence type');
    const evidenceTextValue = expectNullableNonEmptyString(
      row.evidence_text_value,
      'evidence text value',
    );

    validateEvidenceRow(id, evidenceType, evidenceTextValue);

    let accumulated = entries.get(id);

    if (!accumulated) {
      accumulated = {
        entry: {
          id,
          type,
          title,
          rawNote,
          impactStatement,
          occurredAt,
          outcomeType,
          status,
          evidence: null,
          excludedFromExports,
          createdAt,
          updatedAt,
        },
        evidenceTypes: [],
        evidenceDetail: null,
      };

      entries.set(id, accumulated);
    }

    if (
      evidenceType !== null &&
      !accumulated.evidenceTypes.includes(evidenceType)
    ) {
      accumulated.evidenceTypes.push(evidenceType);
    }

    if (evidenceTextValue !== null) {
      if (
        accumulated.evidenceDetail !== null &&
        accumulated.evidenceDetail !== evidenceTextValue
      ) {
        throw new Error(
          `Stored evidence for work entry ${id} is inconsistent.`,
        );
      }

      accumulated.evidenceDetail = evidenceTextValue;
    }
  }

  return [...entries.values()].map(toWorkEntry);
}

function toWorkEntry({
  entry,
  evidenceTypes,
  evidenceDetail,
}: AccumulatedWorkEntry): WorkEntry {
  if (evidenceTypes.length === 0) {
    if (evidenceDetail !== null) {
      throw new Error(
        `Stored evidence for work entry ${entry.id} is inconsistent.`,
      );
    }

    return entry;
  }

  if (evidenceDetail === null) {
    throw new Error(`Stored evidence for work entry ${entry.id} is incomplete.`);
  }

  return {
    ...entry,
    evidence: {
      types: [...evidenceTypes].sort(compareEvidenceTypes),
      detail: evidenceDetail,
    },
  };
}

function validateEvidenceRow(
  entryId: string,
  type: EvidenceType | null,
  detail: string | null,
) {
  if ((type === null) !== (detail === null)) {
    throw new Error(`Stored evidence for work entry ${entryId} is incomplete.`);
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
