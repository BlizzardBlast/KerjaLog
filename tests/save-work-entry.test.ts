import type { WorkEntryWriter } from '@/domain/entry/repository';
import { saveWorkEntry } from '@/features/work-entry/saveWorkEntry';

function createRepository(): jest.Mocked<WorkEntryWriter> {
  return {
    create: jest.fn(async (input) => ({
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
        rawNote: '  Helped Finance reconcile the monthly report.  ',
        outcomeType: 'person_helped',
        evidenceTypes: ['deadline', 'deadline'],
        evidenceDetail: 'Completed before Friday close',
        impactStatement: '  Helped Finance reconcile the monthly report.  ',
      },
      repository,
    );

    expect(entry.type).toBe('contribution');
    expect(entry.rawNote).toBe('Helped Finance reconcile the monthly report.');
    expect(entry.status).toBe('review_ready');
    expect(entry.evidence).toEqual({
      types: ['deadline'],
      detail: 'Completed before Friday close',
    });
    expect(entry.excludedFromExports).toBe(false);
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
      },
      repository,
    );

    expect(entry.type).toBe('challenge');
    expect(entry.status).toBe('quick_note');
    expect(entry.excludedFromExports).toBe(true);
  });

  test.each([
    {
      evidenceTypes: ['deadline'] as const,
      evidenceDetail: '',
    },
    {
      evidenceTypes: [] as const,
      evidenceDetail: 'Completed before Friday close',
    },
  ])(
    'rejects incomplete evidence instead of silently discarding it',
    async ({ evidenceTypes, evidenceDetail }) => {
      const repository = createRepository();

      await expect(
        saveWorkEntry(
          {
            intent: 'completed',
            rawNote: 'Prepared the monthly report',
            outcomeType: 'deadline_met',
            evidenceTypes: [...evidenceTypes],
            evidenceDetail,
            impactStatement: 'Prepared the monthly report on time.',
          },
          repository,
        ),
      ).rejects.toThrow(
        'Evidence requires both a type and a supporting detail.',
      );

      expect(repository.create).not.toHaveBeenCalled();
    },
  );

  test('rejects an empty note before writing', async () => {
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
        },
        repository,
      ),
    ).rejects.toThrow('A work entry requires a note.');

    expect(repository.create).not.toHaveBeenCalled();
  });
});
