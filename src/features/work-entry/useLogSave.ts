import { useRef, useState } from 'react';
import type { WorkEntryDraft } from '@/domain/entry/draft';
import type { WorkEntry } from '@/domain/entry/model';
import {
  type SaveWorkEntryDraft,
  saveWorkEntry,
} from '@/features/work-entry/saveWorkEntry';
import { useSavedEntryCompletion } from '@/features/work-entry/useSavedEntryCompletion';
import {
  captureWorkflowFailure,
  recordWorkflowStart,
  type WorkflowTelemetry,
} from '@/platform/observability/workflowTelemetry';

export type LogSaveEntry = (
  draft: SaveWorkEntryDraft,
) => Promise<WorkEntry>;

export type CompleteSavedEntry = (
  entry: WorkEntry,
) => Promise<void> | void;

export type PrepareLogDraftForCommit = (
  draft: WorkEntryDraft,
) => Promise<void> | void;

type UseLogSaveOptions = {
  onSaved: CompleteSavedEntry;
  prepareForCommit?: PrepareLogDraftForCommit;
  onCommitFailed?: () => void;
  saveEntry?: LogSaveEntry;
};

type SaveLogRequest = {
  activeDraft: WorkEntryDraft;
  entryDraft: SaveWorkEntryDraft;
  mode: 'quick' | 'developed';
  step: string;
};

export function useLogSave({
  onSaved,
  prepareForCommit,
  onCommitFailed,
  saveEntry = (draft) => saveWorkEntry(draft),
}: UseLogSaveOptions) {
  const [saveError, setSaveError] = useState(false);
  const [saving, setSaving] = useState(false);
  const saveInProgressRef = useRef(false);
  const savedEntryCompletion = useSavedEntryCompletion(onSaved);

  const clearSaveError = () => setSaveError(false);

  const save = async ({
    activeDraft,
    entryDraft,
    mode,
    step,
  }: SaveLogRequest): Promise<void> => {
    if (saveInProgressRef.current) {
      return;
    }

    if (savedEntryCompletion.hasCommitted()) {
      await savedEntryCompletion.retryCompletion();
      return;
    }

    saveInProgressRef.current = true;
    setSaving(true);
    setSaveError(false);

    const workflow = {
      feature: 'work-entry' as const,
      mode,
      operation: 'save' as const,
      screen: 'log' as const,
      step,
    } satisfies WorkflowTelemetry;

    let entry: WorkEntry;
    try {
      recordWorkflowStart(workflow);
      await prepareForCommit?.(activeDraft);
      entry = await saveEntry(entryDraft);
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
  };

  return {
    save,
    clearSaveError,
    saving,
    saveError,
    hasCommittedEntry: savedEntryCompletion.hasCommittedEntry,
    completionError: savedEntryCompletion.completionError,
    retryCompletion: savedEntryCompletion.retryCompletion,
  };
}
