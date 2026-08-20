export const WORK_ENTRY_TEXT_LIMITS = {
  rawNote: 2000,
  evidenceDetail: 1000,
  impactStatement: 2500,
} as const;

export type WorkEntryTextField = keyof typeof WORK_ENTRY_TEXT_LIMITS;

export function assertWorkEntryTextWithinLimits(input: {
  rawNote: string;
  evidenceDetail: string;
  impactStatement: string | null;
}): void {
  if (input.rawNote.length > WORK_ENTRY_TEXT_LIMITS.rawNote) {
    throw new Error('Work entry note exceeds the maximum length.');
  }

  if (input.evidenceDetail.length > WORK_ENTRY_TEXT_LIMITS.evidenceDetail) {
    throw new Error('Work entry evidence exceeds the maximum length.');
  }

  if (
    input.impactStatement !== null &&
    input.impactStatement.length > WORK_ENTRY_TEXT_LIMITS.impactStatement
  ) {
    throw new Error('Work entry impact statement exceeds the maximum length.');
  }
}
