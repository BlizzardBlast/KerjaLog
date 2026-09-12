import type { WorkEntryDetail } from '@/domain/entry/model';
import type { WorkEntryUpdater } from '@/domain/entry/repository';
import { updateWorkEntry } from '@/features/work-entry/refinement/updateWorkEntry';

const originalEntry: WorkEntryDetail = {
  id: 'entry-1',
  type: 'contribution',
  title: 'Checked the report',
  rawNote: 'Checked the report.',
  impactStatement: null,
  impactStatementSource: null,
  occurredAt: '2026-08-10T08:00:00.000Z',
  outcomeType: null,
  status: 'quick_note',
  workAreaId: null,
  evidence: null,
  skills: [],
  excludedFromExports: false,
  createdAt: '2026-08-10T08:01:00.000Z',
  updatedAt: '2026-08-10T08:01:00.000Z',
};

function createRepository(): WorkEntryUpdater & {
  update: jest.Mock;
} {
  return {
    update: jest.fn(async (id, input) => ({
      ...input,
      id,
      createdAt: originalEntry.createdAt,
      updatedAt: '2026-08-13T10:00:00.000Z',
    })),
  };
}

describe('updateWorkEntry', () => {
  test('normalizes refined evidence and derives review readiness', async () => {
    const repository = createRepository();

    await updateWorkEntry(
      originalEntry,
      {
        type: 'problem_solved',
        rawNote: '  Fixed a reconciliation mismatch.  ',
        workAreaId: 'area-reconciliation',
        outcomeType: 'error_fixed_or_prevented',
        evidenceTypes: ['number', 'number', 'result'],
        evidenceDetail: '  7 duplicate rows removed.  ',
        impactStatement: '  Corrected the mismatch before submission.  ',
        impactStatementSource: 'user',
        skills: [
          { id: 'problem_solving', source: 'rules' },
          { id: 'problem_solving', source: 'rules' },
          { id: 'attention_to_detail', source: 'user' },
        ],
      },
      repository,
    );

    expect(repository.update).toHaveBeenCalledWith(
      'entry-1',
      expect.objectContaining({
        type: 'problem_solved',
        title: 'Fixed a reconciliation mismatch',
        rawNote: 'Fixed a reconciliation mismatch.',
        workAreaId: 'area-reconciliation',
        status: 'review_ready',
        evidence: {
          types: ['number', 'result'],
          detail: '7 duplicate rows removed.',
        },
        impactStatement: 'Corrected the mismatch before submission.',
        impactStatementSource: 'user',
        skills: [
          { id: 'problem_solving', source: 'rules' },
          { id: 'attention_to_detail', source: 'user' },
        ],
      }),
    );
  });

  test('keeps an entry developed until evidence and impact are both usable', async () => {
    const repository = createRepository();

    await updateWorkEntry(
      originalEntry,
      {
        type: 'contribution',
        rawNote: 'Prepared the report',
        workAreaId: null,
        outcomeType: 'deadline_met',
        evidenceTypes: ['deadline'],
        evidenceDetail: 'Submitted Friday',
        impactStatement: '',
        impactStatementSource: null,
        skills: [],
      },
      repository,
    );

    expect(repository.update).toHaveBeenCalledWith(
      'entry-1',
      expect.objectContaining({
        status: 'developed',
        impactStatementSource: null,
      }),
    );
  });

  test('never removes challenge export privacy implicitly', async () => {
    const repository = createRepository();
    const privateEntry = {
      ...originalEntry,
      type: 'challenge' as const,
      excludedFromExports: true,
    };

    await updateWorkEntry(
      privateEntry,
      {
        type: 'contribution',
        rawNote: 'Recovered from a difficult handoff',
        workAreaId: null,
        outcomeType: 'work_clearer',
        evidenceTypes: [],
        evidenceDetail: '',
        impactStatement: 'Clarified the handoff process.',
        impactStatementSource: 'user',
        skills: [{ id: 'communication', source: 'user' }],
      },
      repository,
    );

    expect(repository.update).toHaveBeenCalledWith(
      'entry-1',
      expect.objectContaining({
        excludedFromExports: true,
        impactStatementSource: 'user',
      }),
    );
  });
});
