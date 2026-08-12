import { useEffect, useState } from 'react';
import { workEntryRepository } from '@/data/repositories/workEntryRepository';
import type { WorkEntry } from '@/domain/entry/model';
import type { WorkEntryByIdReader } from '@/domain/entry/repository';

export type WorkEntryLoadState =
  | { status: 'loading' }
  | { status: 'loaded'; entry: WorkEntry }
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
  const [requestVersion, setRequestVersion] = useState(0);

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
  }, [id, repository, requestVersion]);

  return {
    state,
    retry: () => setRequestVersion((current) => current + 1),
  };
}
