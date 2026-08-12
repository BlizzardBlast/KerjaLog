import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { workEntryRepository } from '@/data/repositories/workEntryRepository';
import type { WorkEntry } from '@/domain/entry/model';
import type { RecentWorkEntryReader } from '@/domain/entry/repository';
import { getStartOfLocalWeekIso } from '@/features/home/homePeriod';

const RECENT_ENTRY_LIMIT = 3;

export type HomeWorkEntriesState =
  | { status: 'loading' }
  | {
      status: 'loaded';
      recentEntries: WorkEntry[];
      thisWeekCount: number;
    }
  | { status: 'error' };

export function useHomeWorkEntries(
  repository: RecentWorkEntryReader = workEntryRepository,
): HomeWorkEntriesState {
  const [state, setState] = useState<HomeWorkEntriesState>({
    status: 'loading',
  });

  useFocusEffect(
    useCallback(() => {
      let ignore = false;
      const weekStart = getStartOfLocalWeekIso();
      setState({ status: 'loading' });

      Promise.all([
        repository.findRecent(RECENT_ENTRY_LIMIT),
        repository.countSince(weekStart),
      ])
        .then(([recentEntries, thisWeekCount]) => {
          if (!ignore) {
            setState({ status: 'loaded', recentEntries, thisWeekCount });
          }
        })
        .catch(() => {
          if (!ignore) {
            setState({ status: 'error' });
          }
        });

      return () => {
        ignore = true;
      };
    }, [repository]),
  );

  return state;
}
