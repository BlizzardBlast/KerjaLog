import { WORK_ENTRY_TEXT_LIMITS } from '@/domain/entry/limits';
import type { WorkEntryWriter } from '@/domain/entry/repository';
import { saveWorkEntry } from '@/features/work-entry/saveWorkEntry';

function createRepository(): jest.Mocked<WorkEntryWriter> {
  return {
    commit: jest.fn(async (input) => ({
      ...input,
      id: 'entry-1',
      createdAt: '2026-08-10T00:00:00.000Z',
      updatedAt: '2026-08-10T00:00:00.000Z',
    })),
  };
}

describe('saveWorkEntry', () => {
  test('maps a developed capture into persisted entry data with confirmed skills', async () => {
    const repository = createRepository();
    const entry = await saveWorkEntry(
      {
        intent: 'helped',
        rawNote: 'Helped Finance reconcile the monthly report.',
        workAreaId: 'area-finance',
        outcomeType: 'person_helped',
        evidenceTypes: ['deadline'],
        evidenceDetail: 'Completed before Friday close',
        skills: [
          { id: 'collaboration', source: 'rules' },
          { id: 'collaboration', source: 'rules' },
          { id: 'communication', source: 'user' },
        ],
        impactStatement: 'Helped Finance reconcile the monthly report.',
        impactStatementSource: 'generated',
      },
      repository,
    );

    expect(entry.type).toBe('contribution');
    expect(entry.status).toBe('review_ready');
    expect(entry.workAreaId).toBe('area-finance');
    expect(repository.commit).toHaveBeenCalledWith(
      expect.objectContaining({
        skills: [
          { id: 'collaboration', source: 'rules' },
          { id: 'communication', source: 'user' },
        ],
      }),
    );
    expect(repository.commit).toHaveBeenCalledTimes(1);
  });

  test('keeps challenges out of exports by default', async () => {
    const repository = createRepository();
    const entry = await saveWorkEntry(
      {
        intent: 'challenge',
        rawNote: 'The handoff became difficult',
        workAreaId: null,
        outcomeType: null,
        evidenceTypes: [],
        evidenceDetail: '',
        skills: [],
        impactStatement: null,
        impactStatementSource: null,
      },
      repository,
    );

    expect(entry.excludedFromExports).toBe(true);
  });

  test('validates incomplete evidence', async () => {
    const repository = createRepository();
    await expect(
      saveWorkEntry(
        {
          intent: 'completed',
          rawNote: 'Prepared the monthly report',
          workAreaId: null,
          outcomeType: 'deadline_met',
          evidenceTypes: ['deadline'],
          evidenceDetail: '',
          skills: [],
          impactStatement: 'Prepared the report on time.',
          impactStatementSource: 'generated',
        },
        repository,
      ),
    ).rejects.toThrow('Evidence requires both a type and a supporting detail.');
  });

  test('validates impact provenance', async () => {
    const repository = createRepository();
    await expect(
      saveWorkEntry(
        {
          intent: 'completed',
          rawNote: 'Prepared the monthly report',
          workAreaId: null,
          outcomeType: 'deadline_met',
          evidenceTypes: [],
          evidenceDetail: '',
          skills: [],
          impactStatement: 'Prepared the report on time.',
          impactStatementSource: null,
        },
        repository,
      ),
    ).rejects.toThrow('Impact statement provenance is inconsistent.');
  });

  test('validates note presence', async () => {
    const repository = createRepository();
    await expect(
      saveWorkEntry(
        {
          intent: 'completed',
          rawNote: '   ',
          workAreaId: null,
          outcomeType: null,
          evidenceTypes: [],
          evidenceDetail: '',
          skills: [],
          impactStatement: null,
          impactStatementSource: null,
        },
        repository,
      ),
    ).rejects.toThrow('A work entry requires a note.');
  });

  test.each([
    {
      field: 'note',
      draft: {
        rawNote: 'a'.repeat(WORK_ENTRY_TEXT_LIMITS.rawNote + 1),
        workAreaId: null,
        evidenceTypes: [] as const,
        evidenceDetail: '',
        impactStatement: null,
        impactStatementSource: null,
      },
      message: 'Work entry note exceeds the maximum length.',
    },
    {
      field: 'evidence',
      draft: {
        rawNote: 'Prepared the report',
        workAreaId: null,
        evidenceTypes: ['number'] as const,
        evidenceDetail: 'a'.repeat(WORK_ENTRY_TEXT_LIMITS.evidenceDetail + 1),
        impactStatement: null,
        impactStatementSource: null,
      },
      message: 'Work entry evidence exceeds the maximum length.',
    },
    {
      field: 'impact',
      draft: {
        rawNote: 'Prepared the report',
        workAreaId: null,
        evidenceTypes: [] as const,
        evidenceDetail: '',
        impactStatement: 'a'.repeat(WORK_ENTRY_TEXT_LIMITS.impactStatement + 1),
        impactStatementSource: 'user' as const,
      },
      message: 'Work entry impact statement exceeds the maximum length.',
    },
  ])(
    'rejects an oversized $field before repository commit',
    async ({ draft, message }) => {
      const repository = createRepository();

      await expect(
        saveWorkEntry(
          {
            intent: 'completed',
            outcomeType: null,
            skills: [],
            ...draft,
            evidenceTypes: [...draft.evidenceTypes],
          },
          repository,
        ),
      ).rejects.toThrow(message);

      expect(repository.commit).not.toHaveBeenCalled();
    },
  );
});
