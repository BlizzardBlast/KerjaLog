import type {
  CreateReviewDraft,
  ReviewCandidate,
  ReviewDraft,
  ReviewPeriod,
  UpdateReviewDraft,
} from '@/domain/review/model';
import type { SkillId } from '@/domain/skill/model';

export type ReviewCandidateQuery = {
  period: ReviewPeriod;
  skillId: SkillId | null;
};

export interface ReviewCandidateReader {
  findCandidates(query: ReviewCandidateQuery): Promise<ReviewCandidate[]>;
}

export interface ReviewDraftReader {
  listDrafts(): Promise<ReviewDraft[]>;
  findDraft(id: string): Promise<ReviewDraft | null>;
}

export interface ReviewDraftWriter {
  createDraft(input: CreateReviewDraft): Promise<ReviewDraft>;
  updateDraft(id: string, input: UpdateReviewDraft): Promise<ReviewDraft>;
  deleteDraft(id: string): Promise<void>;
}

export interface ReviewRepository
  extends ReviewCandidateReader,
    ReviewDraftReader,
    ReviewDraftWriter {}
