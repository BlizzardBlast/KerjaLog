import { useEffect, useState } from 'react';
import { workEntryRepository } from '@/data/repositories/workEntryRepository';
import type { WorkEntry } from '@/domain/entry/model';

export type WorkEntryLoadState =
  | { status: 'loading' }
  | { status: 'loaded'; entry: WorkEntry }
  | { status: 'not-found' }
  | { status: 'error' };

export function useWorkEntry(id: string): WorkEntryLoadState {
  const [state, setState] = useState<WorkEntryLoadState>({ status: 'loading' });

  useEffect(() => {
    let ignore = false;
    setState({ status: 'loading' });

    workEntryRepository
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
  }, [id]);

  return state;
}
