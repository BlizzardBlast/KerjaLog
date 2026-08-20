import { useRef, useState } from 'react';

type CompleteSavedEntry<Entry> = (entry: Entry) => Promise<void> | void;

/**
 * Keeps post-persistence navigation/completion retryable without repeating the
 * durable write. The committed entry lives in a ref because it is imperative
 * idempotency state: rendering only needs the boolean/error projections.
 */
export function useSavedEntryCompletion<Entry>(
  onSaved: CompleteSavedEntry<Entry>,
) {
  const committedEntryRef = useRef<Entry | null>(null);
  const completionInProgressRef = useRef(false);
  const [hasCommittedEntry, setHasCommittedEntry] = useState(false);
  const [completionError, setCompletionError] = useState(false);

  const complete = async (entry: Entry): Promise<void> => {
    if (completionInProgressRef.current) {
      return;
    }

    completionInProgressRef.current = true;
    setCompletionError(false);

    try {
      await onSaved(entry);
    } catch {
      setCompletionError(true);
    } finally {
      completionInProgressRef.current = false;
    }
  };

  const hasCommitted = (): boolean => committedEntryRef.current !== null;

  const commitAndComplete = async (entry: Entry): Promise<void> => {
    committedEntryRef.current = entry;
    setHasCommittedEntry(true);
    await complete(entry);
  };

  const retryCompletion = (): Promise<void> => {
    const entry = committedEntryRef.current;
    return entry ? complete(entry) : Promise.resolve();
  };

  return {
    hasCommittedEntry,
    completionError,
    hasCommitted,
    commitAndComplete,
    retryCompletion,
  };
}
