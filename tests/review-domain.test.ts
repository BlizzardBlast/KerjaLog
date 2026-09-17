import {
  createReviewDraftDocument,
  createReviewDraftEntries,
  escapeHtml,
  recommendReviewCandidates,
  renderReviewDocumentHtml,
  renderReviewDocumentMarkdown,
  renderReviewDocumentPlainText,
} from '@/domain/review/document';
import type {
  ReviewCandidate,
  ReviewDocumentCopy,
  ReviewPurpose,
} from '@/domain/review/model';
import { getReviewPeriod } from '@/domain/review/period';

const copy: ReviewDocumentCopy = {
  performance_self_review: {
    title: 'Performance review',
    primarySectionTitle: 'Contributions',
    evidenceSectionTitle: 'Evidence',
  },
  one_on_one: {
    title: 'One-on-one',
    primarySectionTitle: 'Progress',
    evidenceSectionTitle: 'Evidence',
  },
  resume: {
    title: 'Resume',
    primarySectionTitle: 'Highlights',
    evidenceSectionTitle: 'Evidence',
  },
  interview: {
    title: 'Interview',
    primarySectionTitle: 'Examples',
    evidenceSectionTitle: 'Evidence',
  },
};

function createCandidate(
  overrides: Partial<ReviewCandidate> = {},
): ReviewCandidate {
  return {
    id: 'entry-a',
    title: 'Simplified intake',
    impactStatement: 'Simplified the intake handoff.',
    rawNote: 'Worked on intake.',
    occurredAt: '2026-09-01T00:00:00.000Z',
    outcomeType: 'work_clearer',
    evidence: {
      types: ['result'],
      detail: 'Team adopted the updated checklist.',
    },
    skillIds: ['communication'],
    ...overrides,
  };
}

describe('review periods', () => {
  test('uses local calendar boundaries for every preset', () => {
    const now = new Date(2026, 0, 15, 12);
    expect(getReviewPeriod('this_month', now)).toEqual({
      startDate: '2026-01-01',
      endDate: '2026-01-31',
    });
    expect(getReviewPeriod('last_quarter', now)).toEqual({
      startDate: '2025-10-01',
      endDate: '2025-12-31',
    });
    expect(getReviewPeriod('this_year', now)).toEqual({
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    });
  });
});

describe('review document rules', () => {
  test('recommends a deterministic top three', () => {
    const candidates = [
      createCandidate({
        id: 'third',
        impactStatement: null,
        evidence: null,
        skillIds: [],
      }),
      createCandidate({
        id: 'first',
        occurredAt: '2026-09-02T00:00:00.000Z',
        skillIds: ['communication', 'execution'],
      }),
      createCandidate({ id: 'second', occurredAt: '2026-09-03T00:00:00.000Z' }),
      createCandidate({
        id: 'fourth',
        impactStatement: null,
        evidence: null,
        skillIds: [],
      }),
    ];
    expect(
      recommendReviewCandidates(candidates).map((candidate) => candidate.id),
    ).toEqual(['first', 'second', 'fourth']);
  });

  test.each<ReviewPurpose>([
    'performance_self_review',
    'one_on_one',
    'resume',
    'interview',
  ])('creates a factual %s document', (purpose) => {
    const entries = createReviewDraftEntries([createCandidate()]);
    const document = createReviewDraftDocument(purpose, entries, copy);
    expect(document.sections[0]?.title).toBe(copy[purpose].primarySectionTitle);
    expect(document.sections[0]?.bullets).toEqual([
      'Simplified the intake handoff.',
    ]);
    expect(document.sections[1]?.bullets).toEqual([
      'Team adopted the updated checklist.',
    ]);
  });

  test('renders editable content without HTML injection', () => {
    const document = {
      sections: [
        {
          id: 'one',
          title: '<Section>',
          bullets: ['A <script>alert(1)</script> & B'],
        },
      ],
    };
    expect(renderReviewDocumentPlainText('Review', document)).toContain(
      '- A <script>alert(1)</script> & B',
    );
    expect(renderReviewDocumentMarkdown('Review', document)).toContain(
      'A \\<script\\>',
    );
    expect(renderReviewDocumentHtml('Review <unsafe>', document)).toContain(
      '&lt;script&gt;alert(1)&lt;/script&gt; &amp; B',
    );
    expect(renderReviewDocumentHtml('Review <unsafe>', document)).not.toContain(
      '<script>',
    );
    expect(escapeHtml(`'"&<>`)).toBe('&#39;&quot;&amp;&lt;&gt;');
  });
});
