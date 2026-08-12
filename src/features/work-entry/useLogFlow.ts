import { useRef, useState } from 'react';
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

type UseLogFlowOptions = {
  impactCopy: ImpactBuilderCopy;
  initialDraft?: WorkEntryDraft | null;
  onExit: () => void;
  onSaved: CompleteSavedEntry;
  onStepChanged?: () => void;
  saveEntry?: SaveEntry;
};

export function useLogFlow({
  impactCopy,
  initialDraft = null,
  onExit,
  onSaved,
  onStepChanged,
  saveEntry = (draft) => saveWorkEntry(draft),
}: UseLogFlowOptions) {
  const startingDraft = initialDraft ?? EMPTY_WORK_ENTRY_DRAFT;
  const [step, setStep] = useState<LogStep>(startingDraft.step);
  const [intent, setIntent] = useState<LogEventIntent | null>(
    startingDraft.intent,
  );
  const [rawNote, setRawNote] = useState(startingDraft.rawNote);
  const [outcomeType, setOutcomeType] = useState<OutcomeType | null>(
    startingDraft.outcomeType,
  );
  const [evidenceTypes, setEvidenceTypes] = useState<EvidenceType[]>(
    startingDraft.evidenceTypes,
  );
  const [evidenceDetail, setEvidenceDetail] = useState(
    startingDraft.evidenceDetail,
  );
  const [impactStatement, setImpactStatement] = useState(
    startingDraft.impactStatement,
  );
  const [noteError, setNoteError] = useState(false);
  const [evidenceError, setEvidenceError] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [completionError, setCompletionError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasCommittedEntry, setHasCommittedEntry] = useState(false);
  const saveInProgressRef = useRef(false);
  const committedEntryRef = useRef<WorkEntry | null>(null);

  const currentStep = LOG_STEPS.indexOf(step) + 1;
  const draft: WorkEntryDraft = {
    step,
    intent,
    rawNote,
    outcomeType,
    evidenceTypes,
    evidenceDetail,
    impactStatement,
  };
  const hasUnsavedDraft =
    !hasCommittedEntry && hasWorkEntryDraftContent(draft);

  function moveToStep(nextStep: LogStep) {
    setStep(nextStep);
    onStepChanged?.();
  }

  function goBack() {
    const currentIndex = LOG_STEPS.indexOf(step);
    if (currentIndex <= 0) {
      onExit();
      return;
    }

    moveToStep(LOG_STEPS[currentIndex - 1]);
  }

  function selectIntent(nextIntent: LogEventIntent) {
    setIntent(nextIntent);
    setSaveError(false);
  }

  function continueFromType() {
    if (intent) {
      moveToStep('event');
    }
  }

  function updateRawNote(value: string) {
    setRawNote(value);
    setSaveError(false);

    if (value.trim()) {
      setNoteError(false);
    }
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
    setOutcomeType(nextOutcomeType);
    setSaveError(false);
  }

  function continueFromOutcome() {
    if (outcomeType) {
      moveToStep('evidence');
    }
  }

  function toggleEvidenceType(type: EvidenceType) {
    setEvidenceTypes((current) =>
      current.includes(type)
        ? current.filter((candidate) => candidate !== type)
        : [...current, type],
    );
    setEvidenceError(false);
    setSaveError(false);
  }

  function updateEvidenceDetail(value: string) {
    setEvidenceDetail(value);
    setSaveError(false);

    if (!hasIncompleteEvidence(evidenceTypes, value)) {
      setEvidenceError(false);
    }
  }

  function continueToImpact(skipEvidence = false) {
    if (!intent || !outcomeType) {
      return;
    }

    const nextEvidenceTypes = skipEvidence ? [] : evidenceTypes;
    const nextEvidenceDetail = skipEvidence ? '' : evidenceDetail;

    if (hasIncompleteEvidence(nextEvidenceTypes, nextEvidenceDetail)) {
      setEvidenceError(true);
      return;
    }

    if (skipEvidence) {
      setEvidenceTypes([]);
      setEvidenceDetail('');
    }

    setEvidenceError(false);
    setSaveError(false);
    setImpactStatement(
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
    moveToStep('impact');
  }

  function updateImpactStatement(value: string) {
    setImpactStatement(value);
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
    if (saveInProgressRef.current) {
      return;
    }

    const alreadyCommitted = committedEntryRef.current;
    if (alreadyCommitted) {
      await completeCommittedEntry(alreadyCommitted);
      return;
    }

    if (!intent || !rawNote.trim()) {
      setNoteError(true);
      return;
    }

    if (!quickNote && !outcomeType) {
      return;
    }

    saveInProgressRef.current = true;
    setSaving(true);
    setSaveError(false);
    setCompletionError(false);

    let entry: WorkEntry;
    try {
      entry = await saveEntry({
        intent,
        rawNote,
        outcomeType: quickNote ? null : outcomeType,
        evidenceTypes: quickNote ? [] : evidenceTypes,
        evidenceDetail: quickNote ? '' : evidenceDetail,
        impactStatement: quickNote ? null : impactStatement,
      });
    } catch {
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
