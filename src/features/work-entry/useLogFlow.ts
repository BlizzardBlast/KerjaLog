import { useMemo, useState } from 'react';
import {
  EMPTY_WORK_ENTRY_DRAFT,
  hasWorkEntryDraftContent,
  WORK_ENTRY_DRAFT_STEPS,
  type WorkEntryDraft,
} from '@/domain/entry/draft';
import {
  buildImpactStatement,
  hasIncompleteEvidence,
  type ImpactBuilderCopy,
  type LogEventIntent,
} from '@/domain/entry/impact';
import type { EvidenceType, OutcomeType } from '@/domain/entry/model';
import type {
  EntrySkillSource,
  SkillId,
  WorkEntrySkill,
} from '@/domain/skill/model';
import { suggestSkillIds } from '@/domain/skill/suggestions';
import { entryTypeByIntent } from '@/features/work-entry/intentMapping';
import type { SaveWorkEntryDraft } from '@/features/work-entry/saveWorkEntry';
import { useLogForm } from '@/features/work-entry/useLogForm';
import {
  type CompleteSavedEntry,
  type LogSaveEntry,
  type PrepareLogDraftForCommit,
  useLogSave,
} from '@/features/work-entry/useLogSave';

export const LOG_STEPS = WORK_ENTRY_DRAFT_STEPS;
export type LogStep = (typeof LOG_STEPS)[number];

type UseLogFlowOptions = {
  impactCopy: ImpactBuilderCopy;
  initialDraft?: WorkEntryDraft | null;
  onExit: () => void;
  onSaved: CompleteSavedEntry;
  prepareForCommit?: PrepareLogDraftForCommit;
  onCommitFailed?: () => void;
  saveEntry?: LogSaveEntry;
};

export function useLogFlow({
  impactCopy,
  initialDraft = null,
  onExit,
  onSaved,
  prepareForCommit,
  onCommitFailed,
  saveEntry,
}: UseLogFlowOptions) {
  const startingDraft = initialDraft ?? EMPTY_WORK_ENTRY_DRAFT;
  const [step, setStep] = useState<LogStep>(startingDraft.step);
  const [noteError, setNoteError] = useState(false);
  const [evidenceError, setEvidenceError] = useState(false);
  const logSave = useLogSave({
    onSaved,
    prepareForCommit,
    onCommitFailed,
    saveEntry,
  });
  const {
    form,
    intent,
    rawNote,
    workAreaId,
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
      workAreaId,
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
      workAreaId,
      selectedSkills,
      step,
    ],
  );
  const hasUnsavedDraft =
    !logSave.hasCommittedEntry && hasWorkEntryDraftContent(draft);

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
    logSave.clearSaveError();
    invalidateGeneratedImpact();
  }

  function continueFromType() {
    if (intent) moveToStep('event');
  }

  function updateRawNote(value: string) {
    form.setFieldValue('rawNote', value);
    logSave.clearSaveError();
    if (value.trim()) setNoteError(false);
    invalidateGeneratedImpact();
  }

  function updateWorkArea(workAreaId: string | null) {
    form.setFieldValue('workAreaId', workAreaId);
    logSave.clearSaveError();
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
    logSave.clearSaveError();
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
    logSave.clearSaveError();
    invalidateGeneratedImpact();
  }

  function updateEvidenceDetail(value: string) {
    form.setFieldValue('evidenceDetail', value);
    logSave.clearSaveError();
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
    logSave.clearSaveError();
    moveToStep('skills');
  }

  function toggleSkill(skillId: SkillId, source: EntrySkillSource) {
    const hasExisting = selectedSkills.some((skill) => skill.id === skillId);
    const nextSkills: WorkEntrySkill[] = hasExisting
      ? selectedSkills.filter((skill) => skill.id !== skillId)
      : [...selectedSkills, { id: skillId, source }];

    form.setFieldValue('skills', nextSkills);
    logSave.clearSaveError();
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
    logSave.clearSaveError();
  }

  async function save(quickNote: boolean) {
    if (!intent || !rawNote.trim()) {
      setNoteError(true);
      return;
    }

    if (!quickNote && !outcomeType) {
      return;
    }

    const entryDraft: SaveWorkEntryDraft = {
      intent,
      rawNote,
      workAreaId,
      outcomeType: quickNote ? null : outcomeType,
      evidenceTypes: quickNote ? [] : evidenceTypes,
      evidenceDetail: quickNote ? '' : evidenceDetail,
      skills: quickNote ? [] : selectedSkills,
      impactStatement: quickNote ? null : impactStatement,
      impactStatementSource: quickNote ? null : impactStatementSource,
    };

    await logSave.save({
      activeDraft: draft,
      entryDraft,
      mode: quickNote ? 'quick' : 'developed',
      step,
    });
  }

  return {
    step,
    currentStep,
    totalSteps: LOG_STEPS.length,
    draft,
    hasUnsavedDraft,
    hasCommittedEntry: logSave.hasCommittedEntry,
    intent,
    rawNote,
    workAreaId,
    outcomeType,
    evidenceTypes,
    evidenceDetail,
    selectedSkills,
    suggestedSkillIds,
    impactStatement,
    noteError,
    evidenceError,
    saveError: logSave.saveError,
    completionError: logSave.completionError,
    saving: logSave.saving,
    goBack,
    selectIntent,
    continueFromType,
    updateRawNote,
    updateWorkArea,
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
    retryCompletion: logSave.retryCompletion,
  };
}
