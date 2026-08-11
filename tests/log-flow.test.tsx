import { act, renderHook } from '@testing-library/react-native';
import type { ImpactBuilderCopy } from '@/domain/entry/impact';
import type { WorkEntry } from '@/domain/entry/model';
import { useLogFlow } from '@/features/work-entry/useLogFlow';

const impactCopy: ImpactBuilderCopy = {
  intentLead: {
    completed: 'I completed something',
    solved: 'I solved a problem',
    helped: 'I helped someone',
    feedback: 'I received feedback',
    learned: 'I learned something',
    ownership: 'I took responsibility',
    challenge: 'Something became difficult',
  },
  outcomeLabel: {
    deadline_met: 'A deadline was met',
    error_fixed_or_prevented: 'An error was fixed or prevented',
    work_faster: 'Work became faster',
    work_clearer: 'Work became clearer',
    person_helped: 'A customer or colleague was helped',
    risk_reduced: 'A risk was reduced',
    decision_enabled: 'A decision became possible',
    skill_gained: 'I gained a new skill',
  },
  outcomePrefix: 'Outcome',
  evidencePrefix: 'Evidence',
};

const savedEntry: WorkEntry = {
  id: 'entry-1',
  type: 'contribution',
  title: 'Prepared the weekly report',
  rawNote: 'Prepared the weekly report',
  impactStatement: null,
  occurredAt: '2026-08-11T00:00:00.000Z',
  outcomeType: null,
  status: 'quick_note',
  evidence: null,
  excludedFromExports: false,
  createdAt: '2026-08-11T00:00:00.000Z',
  updatedAt: '2026-08-11T00:00:00.000Z',
};

describe('useLogFlow', () => {
  test('keeps incomplete evidence on the evidence step until it is complete', async () => {
    const { result } = await renderHook(() =>
      useLogFlow({
        impactCopy,
        onExit: jest.fn(),
        onSaved: jest.fn(),
        saveEntry: jest.fn(),
      }),
    );

    await act(async () => {
      result.current.selectIntent('completed');
    });
    await act(async () => {
      result.current.continueFromType();
    });
    await act(async () => {
      result.current.updateRawNote('Prepared the weekly report');
    });
    await act(async () => {
      result.current.continueFromEvent();
    });
    await act(async () => {
      result.current.selectOutcome('deadline_met');
    });
    await act(async () => {
      result.current.continueFromOutcome();
    });
    await act(async () => {
      result.current.toggleEvidenceType('deadline');
    });
    await act(async () => {
      result.current.continueFromEvidence();
    });

    expect(result.current.step).toBe('evidence');
    expect(result.current.evidenceError).toBe(true);

    await act(async () => {
      result.current.updateEvidenceDetail('Finished before Friday close');
    });
    await act(async () => {
      result.current.continueFromEvidence();
    });

    expect(result.current.step).toBe('impact');
    expect(result.current.evidenceError).toBe(false);
    expect(result.current.impactStatement).toContain(
      'Evidence: Finished before Friday close.',
    );
  });

  test('delegates quick-save persistence and reports the saved entry', async () => {
    const onSaved = jest.fn();
    const saveEntry = jest.fn().mockResolvedValue(savedEntry);
    const { result } = await renderHook(() =>
      useLogFlow({
        impactCopy,
        onExit: jest.fn(),
        onSaved,
        saveEntry,
      }),
    );

    await act(async () => {
      result.current.selectIntent('completed');
    });
    await act(async () => {
      result.current.continueFromType();
    });
    await act(async () => {
      result.current.updateRawNote('  Prepared the weekly report  ');
    });
    await act(async () => {
      await result.current.saveQuick();
    });

    expect(saveEntry).toHaveBeenCalledWith({
      intent: 'completed',
      rawNote: '  Prepared the weekly report  ',
      outcomeType: null,
      evidenceTypes: [],
      evidenceDetail: '',
      impactStatement: null,
    });
    expect(onSaved).toHaveBeenCalledWith(savedEntry);
    expect(result.current.saveError).toBe(false);
    expect(result.current.saving).toBe(false);
  });
});
