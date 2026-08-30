import { act, renderHook } from '@testing-library/react-native';
import type { WorkEntryDraft } from '@/domain/entry/draft';
import type { ImpactBuilderCopy } from '@/domain/entry/impact';
import type { WorkEntry } from '@/domain/entry/model';
import { useLogFlow } from '@/features/work-entry/useLogFlow';
import {
  captureWorkflowFailure,
  recordWorkflowStart,
} from '@/platform/observability/workflowTelemetry';

jest.mock('@/platform/observability/workflowTelemetry', () => ({
  captureWorkflowFailure: jest.fn(),
  recordWorkflowStart: jest.fn(),
}));

const captureWorkflowFailureMock = jest.mocked(captureWorkflowFailure);
const recordWorkflowStartMock = jest.mocked(recordWorkflowStart);

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
  workAreaId: null,
  evidence: null,
  excludedFromExports: false,
  createdAt: '2026-08-11T00:00:00.000Z',
  updatedAt: '2026-08-11T00:00:00.000Z',
};

describe('useLogFlow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('reports an unsaved draft as soon as the user starts the flow', async () => {
    const { result } = await renderHook(() =>
      useLogFlow({
        impactCopy,
        onExit: jest.fn(),
        onSaved: jest.fn(),
        saveEntry: jest.fn(),
      }),
    );

    expect(result.current.hasUnsavedDraft).toBe(false);

    await act(async () => {
      result.current.selectIntent('completed');
    });

    expect(result.current.hasUnsavedDraft).toBe(true);
  });

  test('restores wizard state from an encrypted draft snapshot', async () => {
    const initialDraft: WorkEntryDraft = {
      step: 'evidence',
      intent: 'solved',
      rawNote: 'Fixed duplicate records before submission.',
      workAreaId: 'area-operations',
      outcomeType: 'error_fixed_or_prevented',
      evidenceTypes: ['number'],
      evidenceDetail: '7 duplicate records fixed.',
      skills: [{ id: 'problem_solving', source: 'rules' }],
      impactStatement: '',
      impactStatementSource: null,
    };
    const { result } = await renderHook(() =>
      useLogFlow({
        impactCopy,
        initialDraft,
        onExit: jest.fn(),
        onSaved: jest.fn(),
        saveEntry: jest.fn(),
      }),
    );

    expect(result.current.draft).toEqual(initialDraft);
    expect(result.current.currentStep).toBe(4);
    expect(result.current.selectedSkills).toEqual(initialDraft.skills);
    expect(result.current.workAreaId).toBe('area-operations');
    expect(result.current.hasUnsavedDraft).toBe(true);
  });

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

    expect(result.current.step).toBe('skills');
    expect(result.current.evidenceError).toBe(false);

    await act(async () => {
      result.current.continueToImpact();
    });

    expect(result.current.step).toBe('impact');
    expect(result.current.impactStatement).toContain(
      'Evidence: Finished before Friday close.',
    );
  });

  test('suggests and saves confirmed skills for a full entry', async () => {
    const onSaved = jest.fn();
    const saveEntry = jest.fn().mockResolvedValue({
      ...savedEntry,
      outcomeType: 'error_fixed_or_prevented',
      status: 'developed',
    });
    const { result } = await renderHook(() =>
      useLogFlow({
        impactCopy,
        onExit: jest.fn(),
        onSaved,
        saveEntry,
      }),
    );

    await act(async () => {
      result.current.selectIntent('solved');
    });
    await act(async () => {
      result.current.continueFromType();
    });
    await act(async () => {
      result.current.updateRawNote('Fixed duplicate rows before submission.');
    });
    await act(async () => {
      result.current.continueFromEvent();
    });
    await act(async () => {
      result.current.selectOutcome('error_fixed_or_prevented');
    });
    await act(async () => {
      result.current.continueFromOutcome();
    });
    await act(async () => {
      result.current.skipEvidence();
    });

    expect(result.current.step).toBe('skills');
    expect(result.current.suggestedSkillIds).toEqual(
      expect.arrayContaining(['problem_solving', 'attention_to_detail']),
    );

    await act(async () => {
      result.current.toggleSkill('problem_solving', 'rules');
    });

    expect(result.current.selectedSkills).toEqual([
      { id: 'problem_solving', source: 'rules' },
    ]);

    await act(async () => {
      result.current.continueToImpact();
    });

    expect(result.current.step).toBe('impact');

    await act(async () => {
      await result.current.saveDeveloped();
    });

    expect(saveEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        skills: [{ id: 'problem_solving', source: 'rules' }],
      }),
    );
    expect(onSaved).toHaveBeenCalledTimes(1);
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
      result.current.updateRawNote('  Prepared the weekly report  ');
      result.current.updateWorkArea('area-reporting');
    });

    await act(async () => {
      await result.current.saveQuick();
    });

    expect(saveEntry).toHaveBeenCalledWith({
      intent: 'completed',
      rawNote: '  Prepared the weekly report  ',
      workAreaId: 'area-reporting',
      outcomeType: null,
      evidenceTypes: [],
      evidenceDetail: '',
      skills: [],
      impactStatement: null,
      impactStatementSource: null,
    });
    expect(onSaved).toHaveBeenCalledWith(savedEntry);
    expect(result.current.saveError).toBe(false);
    expect(result.current.completionError).toBe(false);
    expect(result.current.saving).toBe(false);
  });

  test('reports failed quick-save persistence without entry data', async () => {
    // Given
    const error = new Error('database unavailable');
    const saveEntry = jest.fn().mockRejectedValue(error);
    const { result } = await renderHook(() =>
      useLogFlow({
        impactCopy,
        onExit: jest.fn(),
        onSaved: jest.fn(),
        saveEntry,
      }),
    );

    await act(async () => {
      result.current.selectIntent('completed');
      result.current.updateRawNote('Prepared the weekly report');
    });

    // When
    await act(async () => {
      await result.current.saveQuick();
    });

    // Then
    expect(recordWorkflowStartMock).toHaveBeenCalledWith({
      feature: 'work-entry',
      mode: 'quick',
      operation: 'save',
      screen: 'log',
      step: 'type',
    });
    expect(captureWorkflowFailureMock).toHaveBeenCalledWith(error, {
      feature: 'work-entry',
      mode: 'quick',
      operation: 'save',
      screen: 'log',
      step: 'type',
    });
    expect(result.current.saveError).toBe(true);
  });

  test('preserves user-authored impact wording when supporting facts change', async () => {
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
      result.current.skipEvidence();
    });
    await act(async () => {
      result.current.continueToImpact();
    });
    await act(async () => {
      result.current.updateImpactStatement(
        'My carefully edited impact wording.',
      );
    });

    await act(async () => {
      result.current.goBack();
    });
    await act(async () => {
      result.current.goBack();
    });
    await act(async () => {
      result.current.goBack();
    });

    expect(result.current.step).toBe('outcome');

    await act(async () => {
      result.current.selectOutcome('work_clearer');
    });
    await act(async () => {
      result.current.continueFromOutcome();
    });
    await act(async () => {
      result.current.skipEvidence();
    });
    await act(async () => {
      result.current.continueToImpact();
    });

    expect(result.current.impactStatement).toBe(
      'My carefully edited impact wording.',
    );
  });

  test('does not recreate an entry when post-commit completion fails', async () => {
    const saveEntry = jest.fn().mockResolvedValue(savedEntry);
    const onSaved = jest
      .fn()
      .mockRejectedValueOnce(new Error('navigation unavailable'))
      .mockResolvedValueOnce(undefined);
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
      result.current.updateRawNote('Prepared the weekly report');
    });

    await act(async () => {
      await result.current.saveQuick();
    });

    expect(saveEntry).toHaveBeenCalledTimes(1);
    expect(result.current.saveError).toBe(false);
    expect(result.current.completionError).toBe(true);
    expect(result.current.hasUnsavedDraft).toBe(false);

    await act(async () => {
      await result.current.retryCompletion();
    });

    expect(saveEntry).toHaveBeenCalledTimes(1);
    expect(onSaved).toHaveBeenCalledTimes(2);
    expect(result.current.completionError).toBe(false);
  });

  test('prevents rapid duplicate save submissions before React rerenders', async () => {
    let resolveSave: ((entry: WorkEntry) => void) | undefined;
    const saveEntry = jest.fn(
      () =>
        new Promise<WorkEntry>((resolve) => {
          resolveSave = resolve;
        }),
    );
    const onSaved = jest.fn();
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
      result.current.updateRawNote('Prepared the weekly report');
    });

    let firstSave: Promise<void> | undefined;
    let secondSave: Promise<void> | undefined;
    await act(async () => {
      firstSave = result.current.saveQuick();
      secondSave = result.current.saveQuick();
    });

    expect(saveEntry).toHaveBeenCalledTimes(1);

    resolveSave?.(savedEntry);
    await act(async () => {
      await Promise.all([firstSave, secondSave]);
    });

    expect(onSaved).toHaveBeenCalledTimes(1);
  });
});
