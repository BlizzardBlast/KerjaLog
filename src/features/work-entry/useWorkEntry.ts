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

type StoredWorkEntryLoadState = {
  id: string;
  state: WorkEntryLoadState;
};

const LOADING_STATE: WorkEntryLoadState = { status: 'loading' };

export function useWorkEntry(
  id: string,
  repository: WorkEntryByIdReader = workEntryRepository,
): WorkEntryLoader {
  const [stored, setStored] = useState<StoredWorkEntryLoadState>(() => ({
    id,
    state: LOADING_STATE,
  }));
  const requestIdRef = useRef(0);

  const loadEntry = useCallback(
    (showLoading: boolean) => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      if (showLoading) {
        setStored({ id, state: LOADING_STATE });
      }

      repository
        .findById(id)
        .then((entry) => {
          if (requestId === requestIdRef.current) {
            setStored({
              id,
              state: entry
                ? { status: 'loaded', entry }
                : { status: 'not-found' },
            });
          }
        })
        .catch(() => {
          if (requestId === requestIdRef.current) {
            setStored({ id, state: { status: 'error' } });
          }
        });
    },
    [id, repository],
  );

  useEffect(() => {
    loadEntry(false);

    return () => {
      requestIdRef.current += 1;
    };
  }, [loadEntry]);

  const retry = useCallback(() => {
    loadEntry(true);
  }, [loadEntry]);

  return {
    state: stored.id === id ? stored.state : LOADING_STATE,
    retry,
  };
}
