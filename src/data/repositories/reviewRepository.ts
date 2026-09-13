import { SQLiteReviewRepository } from '@/data/repositories/SQLiteReviewRepository';
import type { ReviewRepository } from '@/domain/review/repository';

export const reviewRepository: ReviewRepository = new SQLiteReviewRepository();
