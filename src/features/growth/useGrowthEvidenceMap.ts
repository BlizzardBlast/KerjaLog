import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { growthEvidenceRepository } from '@/data/repositories/growthEvidenceRepository';
import type { GrowthEvidenceMap } from '@/domain/growth/model';
import type { GrowthEvidenceReader } from '@/domain/growth/repository';

export type GrowthEvidenceMapState =
  | { status: 'loading' }
  | { status: 'error' }
  | {
      status: 'loaded';
      evidenceMap: GrowthEvidenceMap;
      isRefreshing: boolean;
      refreshError: boolean;
    };

export type GrowthEvidenceMapController = {
  state: GrowthEvidenceMapState;
  retry: () => void;
};

export function useGrowthEvidenceMap(
  repository: GrowthEvidenceReader = growthEvidenceRepository,
): GrowthEvidenceMapController {
  const [state, setState] = useState<GrowthEvidenceMapState>({
    status: 'loading',
  });
  const requestIdRef = useRef(0);

  const load = useCallback(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setState((current) =>
      current.status === 'loaded'
        ? { ...current, isRefreshing: true, refreshError: false }
        : { status: 'loading' },
    );

    repository
      .loadEvidenceMap()
      .then((evidenceMap) => {
        if (requestIdRef.current !== requestId) {
          return;
        }

        setState({
          status: 'loaded',
          evidenceMap,
          isRefreshing: false,
          refreshError: false,
        });
      })
      .catch(() => {
        if (requestIdRef.current !== requestId) {
          return;
        }

        setState((current) =>
          current.status === 'loaded'
            ? { ...current, isRefreshing: false, refreshError: true }
            : { status: 'error' },
        );
      });
  }, [repository]);

  useFocusEffect(
    useCallback(() => {
      load();

      return () => {
        requestIdRef.current += 1;
      };
    }, [load]),
  );

  return { state, retry: load };
}
