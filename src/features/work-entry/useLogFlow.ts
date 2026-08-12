import { useRef, useState } from 'react';
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

export const LOG_STEPS = [
  'type',
  'event',
  'outcome',
  'evidence',
  'impact',
] as const;
export type LogStep = (typeof LOG_STEPS)[number];

type SaveEntry = (draft: SaveWorkEntryDraft) => Promise<WorkEntry>;

type UseLogFlowOptions = {
  impactCopy: ImpactBuilderCopy;
  onExit: () => void;
  onSaved: (entry: WorkEntry) => void;
  onStepChanged?: () => void;
  saveEntry?: SaveEntry;
};

export function useLogFlow({
  impactCopy,
  onExit,
  onSaved,
  onStepChanged,
  saveEntry = (draft) => saveWorkEntry(draft),
}: UseLogFlowOptions) {
  const [step, setStep] = useState<LogStep>('type');
  const [intent, setIntent] = useState<LogEventIntent | null>(null);
  const [rawNote, setRawNote] = useState('');
  const [outcomeType, setOutcomeType] = useState<OutcomeType | null>(null);
  const [evidenceTypes, setEvidenceTypes] = useState<EvidenceType[]>([]);
  const [evidenceDetail, setEvidenceDetail] = useState('');
  const [impactStatement, setImpactStatement] = useState('');
  const [noteError, setNoteError] = useState(false);
  const [evidenceError, setEvidenceError] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [saving, setSaving] = useState(false);
  const saveInProgressRef = useRef(false);

  const currentStep = LOG_STEPS.indexOf(step) + 1;
  const hasUnsavedDraft =
    intent !== null ||
    rawNote.trim().length > 0 ||
    outcomeType !== null ||
    evidenceTypes.length > 0 ||
    evidenceDetail.trim().length > 0 ||
    impactStatement.trim().length > 0;

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

  async function save(quickNote: boolean) {
    if (saveInProgressRef.current) {
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

    try {
      const entry = await saveEntry({
        intent,
        rawNote,
        outcomeType: quickNote ? null : outcomeType,
        evidenceTypes: quickNote ? [] : evidenceTypes,
        evidenceDetail: quickNote ? '' : evidenceDetail,
        impactStatement: quickNote ? null : impactStatement,
      });

      onSaved(entry);
    } catch {
      setSaveError(true);
    } finally {
      saveInProgressRef.current = false;
      setSaving(false);
    }
  }

  return {
    step,
    currentStep,
    totalSteps: LOG_STEPS.length,
    hasUnsavedDraft,
    intent,
    rawNote,
    outcomeType,
    evidenceTypes,
    evidenceDetail,
    impactStatement,
    noteError,
    evidenceError,
    saveError,
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
  };
}
