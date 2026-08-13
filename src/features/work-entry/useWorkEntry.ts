import { useCallback, useEffect, useRef, useState } from 'react';
import { workEntryRepository } from '@/data/repositories/workEntryRepository';
import type { WorkEntryDetail } from '@/domain/entry/model';
import type { WorkEntryByIdReader } from '@/domain/entry/repository';

export type WorkEntryLoadState =
  | { status: 'loading' }
  | { status: 'loaded'; entry: WorkEntryDetail }
  | { status: 'not-found' }
  | { status: 'error' };

export type WorkEntryLoader = {
  state: WorkEntryLoadState;
  retry: () => void;
};

export function useWorkEntry(
  id: string,
  repository: WorkEntryByIdReader = workEntryRepository,
): WorkEntryLoader {
  const [state, setState] = useState<WorkEntryLoadState>({ status: 'loading' });
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setState({ status: 'loading' });

    try {
      const entry = await repository.findById(id);

      if (requestId === requestIdRef.current) {
        setState(entry ? { status: 'loaded', entry } : { status: 'not-found' });
      }
    } catch {
      if (requestId === requestIdRef.current) {
        setState({ status: 'error' });
      }
    }
  }, [id, repository]);

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
