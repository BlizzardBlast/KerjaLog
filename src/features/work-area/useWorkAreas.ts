import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { workAreaRepository } from '@/data/repositories/workAreaRepository';
import type { WorkArea } from '@/domain/work-area/model';
import type { WorkAreaReader } from '@/domain/work-area/repository';

export type WorkAreasState =
  | { status: 'loading'; workAreas: WorkArea[] }
  | { status: 'loaded'; workAreas: WorkArea[] }
  | { status: 'error'; workAreas: WorkArea[] };

type UseWorkAreasOptions = {
  includeArchived?: boolean;
  repository?: WorkAreaReader;
};

export function useWorkAreas({
  includeArchived = false,
  repository = workAreaRepository,
}: UseWorkAreasOptions = {}) {
  const [state, setState] = useState<WorkAreasState>({
    status: 'loading',
    workAreas: [],
  });
  const requestIdRef = useRef(0);

  const reload = useCallback(() => {
    const requestId = ++requestIdRef.current;
    setState((current) => ({
      status: 'loading',
      workAreas: current.workAreas,
    }));

    const request = includeArchived
      ? repository.listAll()
      : repository.listActive();

    void request
      .then((workAreas) => {
        if (requestIdRef.current !== requestId) return;
        setState({ status: 'loaded', workAreas });
      })
      .catch(() => {
        if (requestIdRef.current !== requestId) return;
        setState((current) => ({
          status: 'error',
          workAreas: current.workAreas,
        }));
      });
  }, [includeArchived, repository]);

  useFocusEffect(
    useCallback(() => {
      reload();
      return () => {
        requestIdRef.current += 1;
      };
    }, [reload]),
  );

  return { state, reload };
}
