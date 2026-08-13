import type { WorkEntryDetail } from '@/domain/entry/model';
import { getInitialRefinementStep } from '@/features/work-entry/refinement/refinementSteps';

const baseEntry: WorkEntryDetail = {
  id: 'entry-1',
  type: 'contribution',
  title: 'Prepared the report',
  rawNote: 'Prepared the report',
  impactStatement: null,
  impactStatementSource: null,
  occurredAt: '2026-08-10T08:00:00.000Z',
  outcomeType: null,
  status: 'quick_note',
  evidence: null,
  skills: [],
  excludedFromExports: false,
  createdAt: '2026-08-10T08:00:00.000Z',
  updatedAt: '2026-08-10T08:00:00.000Z',
};

describe('entry refinement step policy', () => {
  test('starts a quick note at outcome discovery', () => {
    expect(getInitialRefinementStep(baseEntry)).toBe('outcome');
    expect(
      getInitialRefinementStep({ ...baseEntry, outcomeType: 'unsure' }),
    ).toBe('outcome');
  });

  test('resumes at evidence after a confirmed outcome', () => {
    expect(
      getInitialRefinementStep({
        ...baseEntry,
        outcomeType: 'deadline_met',
        status: 'developed',
      }),
    ).toBe('evidence');
  });

  test('resumes at skill confirmation when evidence exists', () => {
    expect(
      getInitialRefinementStep({
        ...baseEntry,
        outcomeType: 'deadline_met',
        status: 'review_ready',
        evidence: { types: ['deadline'], detail: 'Submitted Friday' },
      }),
    ).toBe('skills');
  });

  test('opens impact review once outcome, evidence, and skills exist', () => {
    expect(
      getInitialRefinementStep({
        ...baseEntry,
        outcomeType: 'deadline_met',
        status: 'review_ready',
        evidence: { types: ['deadline'], detail: 'Submitted Friday' },
        skills: [{ id: 'execution', source: 'rules' }],
      }),
    ).toBe('impact');
  });
});
