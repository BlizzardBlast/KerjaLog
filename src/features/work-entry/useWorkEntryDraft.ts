import { useEffect, useRef, useState } from 'react';
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

export function useWorkEntryDraft(
  repository: WorkEntryDraftReader = workEntryDraftRepository,
): WorkEntryDraftLoader {
  const [state, setState] = useState<WorkEntryDraftLoadState>({
    status: 'loading',
  });
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

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

    return () => {
      requestIdRef.current += 1;
    };
  }, [repository]);

  const retry = () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setState({ status: 'loading' });

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
  };

  return {
    state,
    retry,
  };
}
