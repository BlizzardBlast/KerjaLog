import type {
  ReviewCandidate,
  ReviewDocumentCopy,
  ReviewDraftDocument,
  ReviewDraftEntrySnapshot,
  ReviewPurpose,
} from '@/domain/review/model';

const markdownInlineEscapePattern = new RegExp(
  String.raw`([\\${String.fromCodePoint(0x60)}*_{}[\]<>()#+.!|])`,
  'gu',
);

export function recommendReviewCandidates(
  candidates: readonly ReviewCandidate[],
  maximum = 3,
): ReviewCandidate[] {
  if (!Number.isInteger(maximum) || maximum < 0) {
    throw new Error(
      'Review recommendation maximum must be a non-negative integer.',
    );
  }

  return [...candidates]
    .sort((left, right) => {
      const scoreDifference =
        getCandidateScore(right) - getCandidateScore(left);
      if (scoreDifference !== 0) {
        return scoreDifference;
      }
      const dateDifference = right.occurredAt.localeCompare(left.occurredAt);
      return dateDifference !== 0
        ? dateDifference
        : left.id.localeCompare(right.id);
    })
    .slice(0, maximum);
}

export function createReviewDraftEntries(
  candidates: readonly ReviewCandidate[],
): ReviewDraftEntrySnapshot[] {
  return candidates.map((candidate, sortOrder) => ({
    sourceEntryId: candidate.id,
    title: candidate.title.trim(),
    statement: getCandidateStatement(candidate),
    evidenceDetail: candidate.evidence?.detail.trim() || null,
    occurredAt: candidate.occurredAt,
    sortOrder,
  }));
}

export function createReviewDraftDocument(
  purpose: ReviewPurpose,
  entries: readonly ReviewDraftEntrySnapshot[],
  copy: ReviewDocumentCopy,
): ReviewDraftDocument {
  const template = copy[purpose];
  return {
    sections: [
      {
        id: 'highlights',
        title: template.primarySectionTitle,
        bullets: entries.map((entry) => entry.statement),
      },
      {
        id: 'evidence',
        title: template.evidenceSectionTitle,
        bullets: entries.flatMap((entry) =>
          entry.evidenceDetail ? [entry.evidenceDetail] : [],
        ),
      },
    ].filter((section) => section.bullets.length > 0),
  };
}

export function renderReviewDocumentPlainText(
  title: string,
  document: ReviewDraftDocument,
): string {
  return [
    title.trim(),
    ...renderSections(document, (section, bullet) => [
      section,
      ...bullet.map((value) => `- ${value}`),
    ]),
  ]
    .flat()
    .filter(Boolean)
    .join('\n\n');
}

export function renderReviewDocumentMarkdown(
  title: string,
  document: ReviewDraftDocument,
): string {
  return [
    `# ${escapeMarkdownInline(title.trim())}`,
    ...document.sections
      .filter(
        (section) =>
          section.title.trim() ||
          section.bullets.some((bullet) => bullet.trim()),
      )
      .map((section) =>
        [
          `## ${escapeMarkdownInline(section.title.trim())}`,
          ...section.bullets
            .filter((bullet) => bullet.trim())
            .map((bullet) => `- ${escapeMarkdownInline(bullet.trim())}`),
        ].join('\n'),
      ),
  ]
    .filter(Boolean)
    .join('\n\n');
}

export function renderReviewDocumentHtml(
  title: string,
  document: ReviewDraftDocument,
): string {
  const sections = document.sections
    .filter(
      (section) =>
        section.title.trim() || section.bullets.some((bullet) => bullet.trim()),
    )
    .map((section) => {
      const bullets = section.bullets
        .filter((bullet) => bullet.trim())
        .map((bullet) => `<li>${escapeHtml(bullet.trim())}</li>`)
        .join('');
      const bulletList = bullets ? `<ul>${bullets}</ul>` : '';
      return `<section><h2>${escapeHtml(section.title.trim())}</h2>${bulletList}</section>`;
    })
    .join('');
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#111827;padding:32px;line-height:1.5}h1{font-size:24px}h2{font-size:18px;margin-top:24px}li{margin:8px 0}</style></head><body><h1>${escapeHtml(title.trim())}</h1>${sections}</body></html>`;
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/gu, (character) => {
    switch (character) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case "'":
        return '&#39;';
      case '"':
        return '&quot;';
      default:
        return character;
    }
  });
}

function getCandidateScore(candidate: ReviewCandidate): number {
  return (
    (candidate.impactStatement?.trim() ? 4 : 0) +
    (candidate.evidence ? 2 + candidate.evidence.types.length : 0) +
    candidate.skillIds.length
  );
}

function getCandidateStatement(candidate: ReviewCandidate): string {
  return candidate.impactStatement?.trim() || candidate.rawNote.trim();
}

function renderSections(
  document: ReviewDraftDocument,
  render: (title: string, bullets: string[]) => string[],
): string[][] {
  return document.sections
    .map((section) =>
      render(
        section.title.trim(),
        section.bullets.filter((bullet) => bullet.trim()),
      ),
    )
    .filter((section) => section.some(Boolean));
}

function escapeMarkdownInline(value: string): string {
  return value.replace(markdownInlineEscapePattern, String.raw`\$1`);
}
