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
  evidence: {
    types: ['deadline'],
    detail: 'Submitted before Friday close.',
  },
  skills: [{ id: 'execution', source: 'rules' }],
  excludedFromExports: false,
  createdAt: '2026-08-10T08:01:00.000Z',
  updatedAt: '2026-08-10T08:01:00.000Z',
};

describe('useEntryRefinement impact ownership', () => {
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
});
