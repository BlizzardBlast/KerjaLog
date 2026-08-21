import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { growthEvidenceRepository } from '@/data/repositories/growthEvidenceRepository';
import type { SkillEvidenceEntry } from '@/domain/growth/model';
import type { GrowthEvidenceReader } from '@/domain/growth/repository';
import type { SkillId } from '@/domain/skill/model';

export type SkillEvidenceState =
  | { status: 'loading' }
  | { status: 'error' }
  | {
      status: 'loaded';
      entries: SkillEvidenceEntry[];
      isRefreshing: boolean;
      refreshError: boolean;
    };

export type SkillEvidenceController = {
  state: SkillEvidenceState;
  retry: () => void;
};

export function useSkillEvidence(
  skillId: SkillId,
  repository: GrowthEvidenceReader = growthEvidenceRepository,
): SkillEvidenceController {
  const [state, setState] = useState<SkillEvidenceState>({ status: 'loading' });
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
      .findSkillEvidence(skillId)
      .then((entries) => {
        if (requestIdRef.current !== requestId) {
          return;
        }

        setState({
          status: 'loaded',
          entries,
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
  }, [repository, skillId]);

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
