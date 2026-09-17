import type { ReviewDraftDocument } from '@/domain/review/model';

export type ReviewDraftDocumentValidationIssue =
  | 'document'
  | 'section'
  | 'bullet';

export function getReviewDraftDocumentValidationIssue(
  document: unknown,
): ReviewDraftDocumentValidationIssue | null {
  if (
    typeof document !== 'object' ||
    document === null ||
    !('sections' in document) ||
    !Array.isArray(document.sections)
  ) {
    return 'document';
  }

  const sections: unknown[] = document.sections;
  const sectionIds = new Set<string>();
  for (const section of sections) {
    if (
      typeof section !== 'object' ||
      section === null ||
      !('id' in section) ||
      !('title' in section) ||
      !('bullets' in section) ||
      typeof section.id !== 'string' ||
      !section.id.trim() ||
      typeof section.title !== 'string' ||
      !section.title.trim() ||
      !Array.isArray(section.bullets) ||
      sectionIds.has(section.id)
    ) {
      return 'section';
    }
    const bullets: unknown[] = section.bullets;
    if (
      !bullets.every((bullet) => typeof bullet === 'string' && bullet.trim())
    ) {
      return 'bullet';
    }
    sectionIds.add(section.id);
  }

  return null;
}

export function assertReviewDraftDocument(
  document: unknown,
): asserts document is ReviewDraftDocument {
  const issue = getReviewDraftDocumentValidationIssue(document);
  if (issue === null) {
    return;
  }

  if (issue === 'bullet') {
    throw new Error('Review draft bullet is invalid.');
  }
  if (issue === 'section') {
    throw new Error('Review draft section is invalid.');
  }
  throw new Error('Review draft document is invalid.');
}
