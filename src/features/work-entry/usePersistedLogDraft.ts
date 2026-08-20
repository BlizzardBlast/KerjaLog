import { useCallback, useEffect, useEffectEvent, useState } from 'react';
import { AppState } from 'react-native';
import { workEntryDraftRepository } from '@/data/repositories/workEntryDraftRepository';
import {
  hasWorkEntryDraftContent,
  type WorkEntryDraft,
} from '@/domain/entry/draft';
import type { WorkEntryDraftWriter } from '@/domain/entry/repository';

const DRAFT_SAVE_DEBOUNCE_MS = 350;

type MutableFlag = {
  current: boolean;
};

type UsePersistedLogDraftOptions = {
  draft: WorkEntryDraft;
  enabled: boolean;
  suspendedRef?: MutableFlag;
  repository?: WorkEntryDraftWriter;
};

export function usePersistedLogDraft({
  draft,
  enabled,
  suspendedRef,
  repository = workEntryDraftRepository,
}: UsePersistedLogDraftOptions): boolean {
  const [hasPersistenceError, setHasPersistenceError] = useState(false);

  const persistDraft = useCallback(
    async (draftToPersist: WorkEntryDraft) => {
      if (suspendedRef?.current) {
        return;
      }

      try {
        if (hasWorkEntryDraftContent(draftToPersist)) {
          await repository.saveActive(draftToPersist);
        } else {
          await repository.clearActive();
        }

        setHasPersistenceError(false);
      } catch {
        setHasPersistenceError(true);
      }
    },
    [repository, suspendedRef],
  );

  useEffect(() => {
    if (!enabled || suspendedRef?.current) {
      return;
    }

    const timeout = setTimeout(() => {
      void persistDraft(draft);
    }, DRAFT_SAVE_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [draft, enabled, persistDraft, suspendedRef]);

  const persistLatestDraft = useEffectEvent(() => {
    if (!enabled || suspendedRef?.current) {
      return;
    }

    void persistDraft(draft);
  });

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') {
        persistLatestDraft();
      }
    });

    return () => subscription.remove();
  }, []);

  return hasPersistenceError;
}
