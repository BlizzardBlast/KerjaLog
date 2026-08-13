import { useForm, useSelector } from '@tanstack/react-form';
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
import {
  saveWorkEntry,
  type SaveWorkEntryDraft,
} from '@/features/work-entry/saveWorkEntry';

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
  const [completionError, setCompletionError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasCommittedEntry, setHasCommittedEntry] = useState(false);
  const saveInProgressRef = useRef(false);
  const committedEntryRef = useRef<WorkEntry | null>(null);

  const form = useForm({
    defaultValues: {
      intent: startingDraft.intent,
      rawNote: startingDraft.rawNote,
      outcomeType: startingDraft.outcomeType,
      evidenceTypes: startingDraft.evidenceTypes,
      evidenceDetail: startingDraft.evidenceDetail,
      impactStatement: startingDraft.impactStatement,
      impactStatementSource: startingDraft.impactStatementSource,
    },
  });

  const intent = useSelector(form.store, (state) => state.values.intent);
  const rawNote = useSelector(form.store, (state) => state.values.rawNote);
  const outcomeType = useSelector(
    form.store,
    (state) => state.values.outcomeType,
  );
  const evidenceTypes = useSelector(
    form.store,
    (state) => state.values.evidenceTypes,
  );
  const evidenceDetail = useSelector(
    form.store,
    (state) => state.values.evidenceDetail,
  );
  const impactStatement = useSelector(
    form.store,
    (state) => state.values.impactStatement,
  );
  const impactStatementSource = useSelector(
    form.store,
    (state) => state.values.impactStatementSource,
  );

  const currentStep = LOG_STEPS.indexOf(step) + 1;
  const draft = useMemo<WorkEntryDraft>(
    () => ({
      step,
      intent,
      rawNote,
      outcomeType,
      evidenceTypes,
      evidenceDetail,
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
      step,
    ],
  );
  const hasUnsavedDraft = !hasCommittedEntry && hasWorkEntryDraftContent(draft);

  function moveToStep(nextStep: LogStep) {
    setStep(nextStep);
  }

  function goBack() {
    const currentIndex = LOG_STEPS.indexOf(step);
    if (currentIndex <= 0) {
      onExit();
      return;
    }
    moveToStep(LOG_STEPS[currentIndex - 1]);
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

  function continueToImpact(skipEvidence = false) {
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
    if (impactStatementSource !== 'user') {
      form.setFieldValue(
        'impactStatement',
        buildImpactStatement(
          {
            intent,
            rawNote,
            outcomeType,
            evidenceDetail: nextEvidenceDetail,
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

  async function completeCommittedEntry(entry: WorkEntry): Promise<void> {
    setCompletionError(false);
    try {
      await onSaved(entry);
    } catch {
      setCompletionError(true);
    }
  }

  async function save(quickNote: boolean) {
    if (saveInProgressRef.current) return;

    const alreadyCommitted = committedEntryRef.current;
    if (alreadyCommitted) {
      await completeCommittedEntry(alreadyCommitted);
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
    setCompletionError(false);

    let entry: WorkEntry;
    try {
      await prepareForCommit?.(draft);
      entry = await saveEntry({
        intent,
        rawNote,
        outcomeType: quickNote ? null : outcomeType,
        evidenceTypes: quickNote ? [] : evidenceTypes,
        evidenceDetail: quickNote ? '' : evidenceDetail,
        impactStatement: quickNote ? null : impactStatement,
        impactStatementSource: quickNote ? null : impactStatementSource,
      });
    } catch {
      onCommitFailed?.();
      setSaveError(true);
      return;
    } finally {
      saveInProgressRef.current = false;
      setSaving(false);
    }

    committedEntryRef.current = entry;
    setHasCommittedEntry(true);
    await completeCommittedEntry(entry);
  }

  return {
    step,
    currentStep,
    totalSteps: LOG_STEPS.length,
    draft,
    hasUnsavedDraft,
    hasCommittedEntry,
    intent,
    rawNote,
    outcomeType,
    evidenceTypes,
    evidenceDetail,
    impactStatement,
    noteError,
    evidenceError,
    saveError,
    completionError,
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
    skipEvidence: () => continueToImpact(true),
    continueFromEvidence: () => continueToImpact(false),
    updateImpactStatement,
    saveQuick: () => save(true),
    saveDeveloped: () => save(false),
    retryCompletion: () => {
      const entry = committedEntryRef.current;
      return entry ? completeCommittedEntry(entry) : Promise.resolve();
    },
  };
}
