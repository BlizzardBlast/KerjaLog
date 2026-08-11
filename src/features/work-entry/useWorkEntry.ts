import { useEffect, useState } from 'react';
import { workEntryRepository } from '@/data/repositories/workEntryRepository';
import type { WorkEntry } from '@/domain/entry/model';
import type { WorkEntryReader } from '@/domain/entry/repository';

export type WorkEntryLoadState =
  | { status: 'loading' }
  | { status: 'loaded'; entry: WorkEntry }
  | { status: 'not-found' }
  | { status: 'error' };

export function useWorkEntry(
  id: string,
  repository: WorkEntryReader = workEntryRepository,
): WorkEntryLoadState {
  const [state, setState] = useState<WorkEntryLoadState>({ status: 'loading' });

  useEffect(() => {
    let ignore = false;
    setState({ status: 'loading' });

    repository
      .findById(id)
      .then((entry) => {
        if (ignore) {
          return;
        }

        setState(entry ? { status: 'loaded', entry } : { status: 'not-found' });
      })
      .catch(() => {
        if (!ignore) {
          setState({ status: 'error' });
        }
      });

    return () => {
      ignore = true;
    };
  }, [id, repository]);

  return state;
}
