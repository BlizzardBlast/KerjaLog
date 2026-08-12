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

export function useWorkEntryDraft(
  repository: WorkEntryDraftReader = workEntryDraftRepository,
): WorkEntryDraftLoader {
  const [state, setState] = useState<WorkEntryDraftLoadState>({
    status: 'loading',
  });
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setState({ status: 'loading' });

    try {
      const draft = await repository.loadActive();

      if (requestId === requestIdRef.current) {
        setState({ status: 'loaded', draft });
      }
    } catch {
      if (requestId === requestIdRef.current) {
        setState({ status: 'error' });
      }
    }
  }, [repository]);

  useEffect(() => {
    void load();

    return () => {
      requestIdRef.current += 1;
    };
  }, [load]);

  return {
    state,
    retry: () => {
      void load();
    },
  };
}
