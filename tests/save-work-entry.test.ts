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
  test('maps a developed capture into persisted entry data', async () => {
    const repository = createRepository();
    const entry = await saveWorkEntry(
      {
        intent: 'helped',
        rawNote: 'Helped Finance reconcile the monthly report.',
        outcomeType: 'person_helped',
        evidenceTypes: ['deadline'],
        evidenceDetail: 'Completed before Friday close',
        impactStatement: 'Helped Finance reconcile the monthly report.',
        impactStatementSource: 'generated',
      },
      repository,
    );

    expect(entry.type).toBe('contribution');
    expect(entry.status).toBe('review_ready');
    expect(repository.commit).toHaveBeenCalledTimes(1);
  });

  test('keeps challenges out of exports by default', async () => {
    const repository = createRepository();
    const entry = await saveWorkEntry(
      {
        intent: 'challenge',
        rawNote: 'The handoff became difficult',
        outcomeType: null,
        evidenceTypes: [],
        evidenceDetail: '',
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
          outcomeType: 'deadline_met',
          evidenceTypes: ['deadline'],
          evidenceDetail: '',
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
          outcomeType: 'deadline_met',
          evidenceTypes: [],
          evidenceDetail: '',
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
          outcomeType: null,
          evidenceTypes: [],
          evidenceDetail: '',
          impactStatement: null,
          impactStatementSource: null,
        },
        repository,
      ),
    ).rejects.toThrow('A work entry requires a note.');
  });
});
