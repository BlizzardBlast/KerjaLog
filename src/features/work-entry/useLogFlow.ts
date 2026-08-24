import { useMemo, useRef, useState } from 'react';
import {
  EMPTY_WORK_ENTRY_DRAFT,
  hasWorkEntryDraftContent,
  type WorkEntryDraft,
  WORK_ENTRY_DRAFT_STEPS,
} from '@/domain/entry/draft';
import {
  buildImpactStatement,
  hasIncompleteEvidence,
  type ImpactBuilderCopy,
  type LogEventIntent,
} from '@/domain/entry/impact';
import type {
  EvidenceType,
  OutcomeType,
  WorkEntry,
} from '@/domain/entry/model';
import type {
  EntrySkillSource,
  SkillId,
  WorkEntrySkill,
} from '@/domain/skill/model';
import { suggestSkillIds } from '@/domain/skill/suggestions';
import { entryTypeByIntent } from '@/features/work-entry/intentMapping';
import {
  saveWorkEntry,
  type SaveWorkEntryDraft,
} from '@/features/work-entry/saveWorkEntry';
import { useLogForm } from '@/features/work-entry/useLogForm';
import { useSavedEntryCompletion } from '@/features/work-entry/useSavedEntryCompletion';
import {
  captureWorkflowFailure,
  recordWorkflowStart,
  type WorkflowTelemetry,
} from '@/platform/observability/workflowTelemetry';

export const LOG_STEPS = WORK_ENTRY_DRAFT_STEPS;
export type LogStep = (typeof LOG_STEPS)[number];

type SaveEntry = (draft: SaveWorkEntryDraft) => Promise<WorkEntry>;
type CompleteSavedEntry = (entry: WorkEntry) => Promise<void> | void;
type PrepareForCommit = (draft: WorkEntryDraft) => Promise<void> | void;

type UseLogFlowOptions = {
  impactCopy: ImpactBuilderCopy;
  initialDraft?: WorkEntryDraft | null;
  onExit: () => void;
  onSaved: CompleteSavedEntry;
  prepareForCommit?: PrepareForCommit;
  onCommitFailed?: () => void;
  saveEntry?: SaveEntry;
};

export function useLogFlow({
  impactCopy,
  initialDraft = null,
  onExit,
  onSaved,
  prepareForCommit,
  onCommitFailed,
  saveEntry = (draft) => saveWorkEntry(draft),
}: UseLogFlowOptions) {
  const startingDraft = initialDraft ?? EMPTY_WORK_ENTRY_DRAFT;
  const [step, setStep] = useState<LogStep>(startingDraft.step);
  const [noteError, setNoteError] = useState(false);
  const [evidenceError, setEvidenceError] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [saving, setSaving] = useState(false);
  const saveInProgressRef = useRef(false);
  const savedEntryCompletion = useSavedEntryCompletion(onSaved);
  const {
    form,
    intent,
    rawNote,
    outcomeType,
    evidenceTypes,
    evidenceDetail,
    selectedSkills,
    impactStatement,
    impactStatementSource,
  } = useLogForm(startingDraft);

  const currentStep = LOG_STEPS.indexOf(step) + 1;
  const suggestedSkillIds = intent
    ? suggestSkillIds({
        entryType: entryTypeByIntent[intent],
        outcomeType,
      })
    : [];
  const draft = useMemo<WorkEntryDraft>(
    () => ({
      step,
      intent,
      rawNote,
      outcomeType,
      evidenceTypes,
      evidenceDetail,
      skills: selectedSkills,
      impactStatement,
      impactStatementSource,
    }),
    [
      evidenceDetail,
      evidenceTypes,
      impactStatement,
      impactStatementSource,
      intent,
      outcomeType,
      rawNote,
      selectedSkills,
      step,
    ],
  );
  const hasUnsavedDraft =
    !savedEntryCompletion.hasCommittedEntry && hasWorkEntryDraftContent(draft);

  function moveToStep(nextStep: LogStep) {
    setStep(nextStep);
  }

  function goBack() {
    const currentIndex = LOG_STEPS.indexOf(step);
    if (currentIndex <= 0) {
      onExit();
      return;
    }

    const previousStep = LOG_STEPS[currentIndex - 1];
    if (!previousStep) {
      onExit();
      return;
    }

    moveToStep(previousStep);
  }

  function invalidateGeneratedImpact() {
    if (impactStatementSource === 'generated') {
      form.setFieldValue('impactStatement', '');
      form.setFieldValue('impactStatementSource', null);
    }
  }

  function selectIntent(nextIntent: LogEventIntent) {
    form.setFieldValue('intent', nextIntent);
    setSaveError(false);
    invalidateGeneratedImpact();
  }

  function continueFromType() {
    if (intent) moveToStep('event');
  }

  function updateRawNote(value: string) {
    form.setFieldValue('rawNote', value);
    setSaveError(false);
    if (value.trim()) setNoteError(false);
    invalidateGeneratedImpact();
  }

  function continueFromEvent() {
    if (!rawNote.trim()) {
      setNoteError(true);
      return;
    }
    setNoteError(false);
    moveToStep('outcome');
  }

  function selectOutcome(nextOutcomeType: OutcomeType) {
    form.setFieldValue('outcomeType', nextOutcomeType);
    setSaveError(false);
    invalidateGeneratedImpact();
  }

  function continueFromOutcome() {
    if (outcomeType) moveToStep('evidence');
  }

  function toggleEvidenceType(type: EvidenceType) {
    form.setFieldValue(
      'evidenceTypes',
      evidenceTypes.includes(type)
        ? evidenceTypes.filter((candidate) => candidate !== type)
        : [...evidenceTypes, type],
    );
    setEvidenceError(false);
    setSaveError(false);
    invalidateGeneratedImpact();
  }

  function updateEvidenceDetail(value: string) {
    form.setFieldValue('evidenceDetail', value);
    setSaveError(false);
    if (!hasIncompleteEvidence(evidenceTypes, value)) setEvidenceError(false);
    invalidateGeneratedImpact();
  }

  function continueFromEvidence(skipEvidence = false) {
    if (!intent || !outcomeType) return;

    const nextEvidenceTypes = skipEvidence ? [] : evidenceTypes;
    const nextEvidenceDetail = skipEvidence ? '' : evidenceDetail;
    if (hasIncompleteEvidence(nextEvidenceTypes, nextEvidenceDetail)) {
      setEvidenceError(true);
      return;
    }

    if (skipEvidence) {
      form.setFieldValue('evidenceTypes', []);
      form.setFieldValue('evidenceDetail', '');
    }

    setEvidenceError(false);
    setSaveError(false);
    moveToStep('skills');
  }

  function toggleSkill(skillId: SkillId, source: EntrySkillSource) {
    const existing = selectedSkills.find((skill) => skill.id === skillId);
    const nextSkills: WorkEntrySkill[] = existing
      ? selectedSkills.filter((skill) => skill.id !== skillId)
      : [...selectedSkills, { id: skillId, source }];

    form.setFieldValue('skills', nextSkills);
    setSaveError(false);
  }

  function continueToImpact() {
    if (!intent || !outcomeType) return;

    if (impactStatementSource !== 'user') {
      form.setFieldValue(
        'impactStatement',
        buildImpactStatement(
          {
            intent,
            rawNote,
            outcomeType,
            evidenceDetail,
          },
          impactCopy,
        ),
      );
      form.setFieldValue('impactStatementSource', 'generated');
    }
    moveToStep('impact');
  }

  function updateImpactStatement(value: string) {
    form.setFieldValue('impactStatement', value);
    form.setFieldValue('impactStatementSource', value.trim() ? 'user' : null);
    setSaveError(false);
  }

  async function save(quickNote: boolean) {
    if (saveInProgressRef.current) return;

    if (savedEntryCompletion.hasCommitted()) {
      await savedEntryCompletion.retryCompletion();
      return;
    }

    if (!intent || !rawNote.trim()) {
      setNoteError(true);
      return;
    }
    if (!quickNote && !outcomeType) return;

    saveInProgressRef.current = true;
    setSaving(true);
    setSaveError(false);

    let entry: WorkEntry;
    const workflow = {
      feature: 'work-entry' as const,
      mode: quickNote ? 'quick' : 'developed',
      operation: 'save' as const,
      screen: 'log' as const,
      step,
    } satisfies WorkflowTelemetry;
    try {
      recordWorkflowStart(workflow);
      await prepareForCommit?.(draft);
      entry = await saveEntry({
        intent,
        rawNote,
        outcomeType: quickNote ? null : outcomeType,
        evidenceTypes: quickNote ? [] : evidenceTypes,
        evidenceDetail: quickNote ? '' : evidenceDetail,
        skills: quickNote ? [] : selectedSkills,
        impactStatement: quickNote ? null : impactStatement,
        impactStatementSource: quickNote ? null : impactStatementSource,
      });
    } catch (error) {
      captureWorkflowFailure(error, workflow);
      onCommitFailed?.();
      setSaveError(true);
      return;
    } finally {
      saveInProgressRef.current = false;
      setSaving(false);
    }

    await savedEntryCompletion.commitAndComplete(entry);
  }

  return {
    step,
    currentStep,
    totalSteps: LOG_STEPS.length,
    draft,
    hasUnsavedDraft,
    hasCommittedEntry: savedEntryCompletion.hasCommittedEntry,
    intent,
    rawNote,
    outcomeType,
    evidenceTypes,
    evidenceDetail,
    selectedSkills,
    suggestedSkillIds,
    impactStatement,
    noteError,
    evidenceError,
    saveError,
    completionError: savedEntryCompletion.completionError,
    saving,
    goBack,
    selectIntent,
    continueFromType,
    updateRawNote,
    continueFromEvent,
    selectOutcome,
    continueFromOutcome,
    toggleEvidenceType,
    updateEvidenceDetail,
    skipEvidence: () => continueFromEvidence(true),
    continueFromEvidence: () => continueFromEvidence(false),
    toggleSkill,
    continueToImpact,
    updateImpactStatement,
    saveQuick: () => save(true),
    saveDeveloped: () => save(false),
    retryCompletion: savedEntryCompletion.retryCompletion,
  };
}
