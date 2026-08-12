import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { workEntryDraftRepository } from '@/data/repositories/workEntryDraftRepository';
import {
  hasWorkEntryDraftContent,
  type WorkEntryDraft,
} from '@/domain/entry/draft';
import type { WorkEntryDraftWriter } from '@/domain/entry/repository';

const DRAFT_SAVE_DEBOUNCE_MS = 350;

type UsePersistedLogDraftOptions = {
  draft: WorkEntryDraft;
  enabled: boolean;
  repository?: WorkEntryDraftWriter;
};

export function usePersistedLogDraft({
  draft,
  enabled,
  repository = workEntryDraftRepository,
}: UsePersistedLogDraftOptions): boolean {
  const [hasPersistenceError, setHasPersistenceError] = useState(false);
  const latestDraftRef = useRef(draft);
  const enabledRef = useRef(enabled);
  const mountedRef = useRef(false);

  latestDraftRef.current = draft;
  enabledRef.current = enabled;

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const persistDraft = useCallback(
    async (draftToPersist: WorkEntryDraft) => {
      if (!enabledRef.current) {
        return;
      }

      try {
        if (hasWorkEntryDraftContent(draftToPersist)) {
          await repository.saveActive(draftToPersist);
        } else {
          await repository.clearActive();
        }

        if (mountedRef.current) {
          setHasPersistenceError(false);
        }
      } catch {
        if (mountedRef.current) {
          setHasPersistenceError(true);
        }
      }
    },
    [repository],
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const timeout = setTimeout(() => {
      void persistDraft(draft);
    }, DRAFT_SAVE_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [draft, enabled, persistDraft]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active' && enabledRef.current) {
        void persistDraft(latestDraftRef.current);
      }
    });

    return () => subscription.remove();
  }, [persistDraft]);

  return hasPersistenceError;
}
