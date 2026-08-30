import { act, renderHook } from '@testing-library/react-native';
import type { WorkEntryDetail } from '@/domain/entry/model';
import type { Translate } from '@/features/work-entry/components/logStepTypes';
import { useEntryRefinement } from '@/features/work-entry/refinement/useEntryRefinement';
import { en } from '@/i18n/catalog';

const t: Translate = (key) => en[key];

const baseEntry: WorkEntryDetail = {
  id: 'entry-1',
  type: 'contribution',
  title: 'Prepared the report',
  rawNote: 'Prepared the report.',
  impactStatement: 'Prepared the report. Outcome: A deadline was met.',
  impactStatementSource: 'generated',
  occurredAt: '2026-08-10T08:00:00.000Z',
  outcomeType: 'deadline_met',
  status: 'review_ready',
  workAreaId: null,
  evidence: {
    types: ['deadline'],
    detail: 'Submitted before Friday close.',
  },
  skills: [{ id: 'execution', source: 'rules' }],
  excludedFromExports: false,
  createdAt: '2026-08-10T08:01:00.000Z',
  updatedAt: '2026-08-10T08:01:00.000Z',
};

describe('useEntryRefinement', () => {
  test('updates organizational metadata without invalidating impact wording', async () => {
    const { result } = await renderHook(() =>
      useEntryRefinement({ entry: baseEntry, t, onSaved: jest.fn() }),
    );

    await act(async () => {
      result.current.updateWorkArea('area-reporting');
    });

    expect(result.current.workAreaId).toBe('area-reporting');
    expect(result.current.impactStatement).toBe(baseEntry.impactStatement);
  });

  test('never overwrites user-authored impact wording when recorded facts change', async () => {
    const entry: WorkEntryDetail = {
      ...baseEntry,
      impactStatement: 'My carefully edited impact wording.',
      impactStatementSource: 'user',
    };
    const { result } = await renderHook(() =>
      useEntryRefinement({ entry, t, onSaved: jest.fn() }),
    );

    await act(async () => {
      result.current.setCurrentStep('evidence');
    });
    await act(async () => {
      result.current.updateEvidenceDetail('Submitted two days earlier.');
    });

    expect(result.current.impactStatement).toBe(
      'My carefully edited impact wording.',
    );
  });

  test('invalidates and rebuilds generated impact wording after facts change', async () => {
    const { result } = await renderHook(() =>
      useEntryRefinement({ entry: baseEntry, t, onSaved: jest.fn() }),
    );

    await act(async () => {
      result.current.setCurrentStep('evidence');
    });
    await act(async () => {
      result.current.updateEvidenceDetail('Submitted two days earlier.');
    });

    expect(result.current.impactStatement).toBe('');

    await act(async () => {
      result.current.continueFromEvidence();
    });
    await act(async () => {
      result.current.continueToImpact();
    });

    expect(result.current.impactStatement).toContain(
      'Evidence: Submitted two days earlier.',
    );
  });

  test('retries post-commit completion without updating the entry twice', async () => {
    const updatedEntry: WorkEntryDetail = {
      ...baseEntry,
      updatedAt: '2026-08-14T00:00:00.000Z',
    };
    const updateEntry = jest.fn().mockResolvedValue(updatedEntry);
    const onSaved = jest
      .fn()
      .mockRejectedValueOnce(new Error('navigation unavailable'))
      .mockResolvedValueOnce(undefined);
    const { result } = await renderHook(() =>
      useEntryRefinement({
        entry: baseEntry,
        t,
        onSaved,
        updateEntry,
      }),
    );

    await act(async () => {
      await result.current.submit();
    });

    expect(updateEntry).toHaveBeenCalledTimes(1);
    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(result.current.saveError).toBe(false);
    expect(result.current.completionError).toBe(true);

    await act(async () => {
      await result.current.retryCompletion();
    });

    expect(updateEntry).toHaveBeenCalledTimes(1);
    expect(onSaved).toHaveBeenCalledTimes(2);
    expect(result.current.completionError).toBe(false);
  });
});
