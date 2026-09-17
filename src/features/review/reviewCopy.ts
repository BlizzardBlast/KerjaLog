import type { ReviewDocumentCopy, ReviewPurpose } from '@/domain/review/model';
import type { TranslationKey } from '@/i18n/catalog';

type Translate = (
  key: TranslationKey,
  params?: Record<string, string | number>,
) => string;

export function createReviewDocumentCopy(t: Translate): ReviewDocumentCopy {
  return {
    performance_self_review: createPurposeCopy('performance_self_review', t),
    one_on_one: createPurposeCopy('one_on_one', t),
    resume: createPurposeCopy('resume', t),
    interview: createPurposeCopy('interview', t),
  };
}

export function getReviewPurposeTitle(
  purpose: ReviewPurpose,
  t: Translate,
): string {
  return t(`review.purpose.${purpose}.title` as TranslationKey);
}

function createPurposeCopy(purpose: ReviewPurpose, t: Translate) {
  return {
    title: getReviewPurposeTitle(purpose, t),
    primarySectionTitle: t(
      `review.document.${purpose}.primary` as TranslationKey,
    ),
    evidenceSectionTitle: t(
      `review.document.${purpose}.evidence` as TranslationKey,
    ),
  };
}
