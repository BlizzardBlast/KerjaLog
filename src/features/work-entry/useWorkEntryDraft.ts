import { useCallback, useEffect, useRef, useState } from 'react';
import { workEntryDraftRepository } from '@/data/repositories/workEntryDraftRepository';
import type { WorkEntryDraft } from '@/domain/entry/draft';
import type { WorkEntryDraftReader } from '@/domain/entry/repository';

export type WorkEntryDraftLoadState =
  | { status: 'loading' }
  | { status: 'loaded'; draft: WorkEntryDraft | null }
  | { status: 'error' };

export type WorkEntryDraftLoader = {
  state: WorkEntryDraftLoadState;
  retry: () => void;
};

const LOADING_STATE: WorkEntryDraftLoadState = { status: 'loading' };

export function useWorkEntryDraft(
  repository: WorkEntryDraftReader = workEntryDraftRepository,
): WorkEntryDraftLoader {
  const [state, setState] = useState<WorkEntryDraftLoadState>(LOADING_STATE);
  const requestIdRef = useRef(0);

  const loadDraft = useCallback(
    (showLoading: boolean) => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      if (showLoading) {
        setState(LOADING_STATE);
      }

      repository
        .loadActive()
        .then((draft) => {
          if (requestId === requestIdRef.current) {
            setState({ status: 'loaded', draft });
          }
        })
        .catch(() => {
          if (requestId === requestIdRef.current) {
            setState({ status: 'error' });
          }
        });
    },
    [repository],
  );

  useEffect(() => {
    loadDraft(false);

    return () => {
      requestIdRef.current += 1;
    };
  }, [loadDraft]);

  const retry = useCallback(() => {
    loadDraft(true);
  }, [loadDraft]);

  return {
    state,
    retry,
  };
}
