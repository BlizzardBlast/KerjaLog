import type { EvidenceType, OutcomeType } from '@/domain/entry/model';
import type { SkillId } from '@/domain/skill/model';

export const REVIEW_PURPOSES = [
  'performance_self_review',
  'one_on_one',
  'resume',
  'interview',
] as const;

export type ReviewPurpose = (typeof REVIEW_PURPOSES)[number];

export const REVIEW_PERIOD_PRESETS = [
  'this_month',
  'last_quarter',
  'this_year',
  'custom',
] as const;

export type ReviewPeriodPreset = (typeof REVIEW_PERIOD_PRESETS)[number];

/** Inclusive local-calendar dates, kept separate from UTC persistence timestamps. */
export type ReviewPeriod = {
  startDate: string;
  endDate: string;
};

/** A non-private, review-ready entry prepared for a Review Builder selection. */
export type ReviewCandidate = {
  id: string;
  title: string;
  impactStatement: string | null;
  rawNote: string;
  occurredAt: string;
  outcomeType: OutcomeType | null;
  evidence: {
    types: EvidenceType[];
    detail: string;
  } | null;
  skillIds: SkillId[];
};

/** Immutable source values retained with a draft even if its entry changes later. */
export type ReviewDraftEntrySnapshot = {
  sourceEntryId: string;
  title: string;
  statement: string;
  evidenceDetail: string | null;
  occurredAt: string;
  sortOrder: number;
};

export type ReviewDraftSection = {
  id: string;
  title: string;
  bullets: string[];
};

export type ReviewDraftDocument = {
  sections: ReviewDraftSection[];
};

export type ReviewDraft = {
  id: string;
  title: string;
  purpose: ReviewPurpose;
  period: ReviewPeriod;
  document: ReviewDraftDocument;
  entries: ReviewDraftEntrySnapshot[];
  createdAt: string;
  updatedAt: string;
};

export type CreateReviewDraft = Omit<
  ReviewDraft,
  'id' | 'createdAt' | 'updatedAt'
>;

export type UpdateReviewDraft = Pick<ReviewDraft, 'title' | 'document'>;

export type ReviewDocumentCopy = Record<
  ReviewPurpose,
  {
    title: string;
    primarySectionTitle: string;
    evidenceSectionTitle: string;
  }
>;
