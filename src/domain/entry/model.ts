import type { WorkEntrySkill } from '@/domain/skill/model';

export const ENTRY_TYPES = [
  'contribution',
  'problem_solved',
  'feedback',
  'learning',
  'ownership',
  'challenge',
] as const;

export type EntryType = (typeof ENTRY_TYPES)[number];

export const ENTRY_STATUSES = [
  'quick_note',
  'developed',
  'review_ready',
] as const;

export type EntryStatus = (typeof ENTRY_STATUSES)[number];

export const OUTCOME_TYPES = [
  'deadline_met',
  'error_fixed_or_prevented',
  'work_faster',
  'work_clearer',
  'person_helped',
  'risk_reduced',
  'decision_enabled',
  'skill_gained',
  'unsure',
] as const;

export type OutcomeType = (typeof OUTCOME_TYPES)[number];

export const EVIDENCE_TYPES = [
  'number',
  'deadline',
  'result',
  'feedback',
  'people_helped',
  'reference_link',
  'supporting_note',
] as const;

export type EvidenceType = (typeof EVIDENCE_TYPES)[number];

export const IMPACT_STATEMENT_SOURCES = ['generated', 'user'] as const;

export type ImpactStatementSource = (typeof IMPACT_STATEMENT_SOURCES)[number];

export type WorkEntryEvidence = {
  types: EvidenceType[];
  detail: string;
};

export type WorkEntry = {
  id: string;
  type: EntryType;
  title: string;
  rawNote: string;
  impactStatement: string | null;
  occurredAt: string;
  outcomeType: OutcomeType | null;
  status: EntryStatus;
  evidence: WorkEntryEvidence | null;
  excludedFromExports: boolean;
  createdAt: string;
  updatedAt: string;
};

export type WorkEntryDetail = WorkEntry & {
  skills: WorkEntrySkill[];
  impactStatementSource: ImpactStatementSource | null;
};

export type CreateWorkEntry = Omit<
  WorkEntry,
  'id' | 'createdAt' | 'updatedAt'
> & {
  impactStatementSource: ImpactStatementSource | null;
};

export type UpdateWorkEntry = Omit<
  WorkEntry,
  'id' | 'createdAt' | 'updatedAt'
> & {
  skills: WorkEntrySkill[];
  impactStatementSource: ImpactStatementSource | null;
};
