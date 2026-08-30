import { useCallback } from 'react';
import { workAreaRepository } from '@/data/repositories/workAreaRepository';
import type { WorkAreaWriter } from '@/domain/work-area/repository';

type UseWorkAreaMutationsOptions = {
  repository?: WorkAreaWriter;
  onMutated?: () => void;
};

export function useWorkAreaMutations({
  repository = workAreaRepository,
  onMutated,
}: UseWorkAreaMutationsOptions = {}) {
  const create = useCallback(
    async (name: string) => {
      const workArea = await repository.create(name);
      onMutated?.();
      return workArea;
    },
    [onMutated, repository],
  );

  const rename = useCallback(
    async (id: string, name: string) => {
      const workArea = await repository.rename(id, name);
      onMutated?.();
      return workArea;
    },
    [onMutated, repository],
  );

  const archive = useCallback(
    async (id: string) => {
      await repository.archive(id);
      onMutated?.();
    },
    [onMutated, repository],
  );

  return { create, rename, archive };
}
