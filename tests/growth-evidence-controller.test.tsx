import { act, renderHook, waitFor } from '@testing-library/react-native';
import type {
  GrowthEvidenceMap,
  SkillEvidenceEntry,
} from '@/domain/growth/model';
import type { GrowthEvidenceReader } from '@/domain/growth/repository';
import { useGrowthEvidenceMap } from '@/features/growth/useGrowthEvidenceMap';
import { useSkillEvidence } from '@/features/growth/useSkillEvidence';

jest.mock('expo-router', () => {
  const React = jest.requireActual<typeof import('react')>('react');

  return {
    useFocusEffect: (effect: import('react').EffectCallback) => {
      React.useEffect(effect, [effect]);
    },
  };
});

const evidenceMap: GrowthEvidenceMap = {
  totalEntries: 3,
  skills: [
    {
      skillId: 'attention_to_detail',
      entryCount: 2,
      latestOccurredAt: '2026-08-20T08:00:00.000Z',
    },
  ],
};

const evidenceEntries: SkillEvidenceEntry[] = [
  {
    id: 'entry-1',
    title: 'Resolved reconciliation discrepancies',
    occurredAt: '2026-08-20T08:00:00.000Z',
    supportingText: 'Removed 7 duplicate entries before submission.',
  },
];

function createRepository(): jest.Mocked<GrowthEvidenceReader> {
  return {
    loadEvidenceMap: jest.fn().mockResolvedValue(evidenceMap),
    findSkillEvidence: jest.fn().mockResolvedValue(evidenceEntries),
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
}

describe('Growth evidence controllers', () => {
  test('loads the evidence map through the narrow Growth reader', async () => {
    const repository = createRepository();
    const { result } = await renderHook(() =>
      useGrowthEvidenceMap(repository),
    );

    await waitFor(() => expect(result.current.state.status).toBe('loaded'));

    expect(repository.loadEvidenceMap).toHaveBeenCalledTimes(1);
    expect(result.current.state).toEqual({
      status: 'loaded',
      evidenceMap,
      isRefreshing: false,
      refreshError: false,
    });
  });

  test('surfaces retryable initial load failures', async () => {
    const repository = createRepository();
    repository.loadEvidenceMap
      .mockRejectedValueOnce(new Error('database unavailable'))
      .mockResolvedValueOnce(evidenceMap);
    const { result } = await renderHook(() =>
      useGrowthEvidenceMap(repository),
    );

    await waitFor(() => expect(result.current.state.status).toBe('error'));

    await act(async () => {
      result.current.retry();
    });

    await waitFor(() => expect(result.current.state.status).toBe('loaded'));
    expect(repository.loadEvidenceMap).toHaveBeenCalledTimes(2);
  });

  test('ignores a stale evidence-map request after unmount', async () => {
    const pending = deferred<GrowthEvidenceMap>();
    const repository = createRepository();
    repository.loadEvidenceMap.mockReturnValueOnce(pending.promise);
    const { result, unmount } = await renderHook(() =>
      useGrowthEvidenceMap(repository),
    );

    expect(result.current.state.status).toBe('loading');
    unmount();

    await act(async () => {
      pending.resolve(evidenceMap);
      await pending.promise;
    });
  });

  test('loads skill-specific entries without querying unrelated skills', async () => {
    const repository = createRepository();
    const { result } = await renderHook(() =>
      useSkillEvidence('attention_to_detail', repository),
    );

    await waitFor(() => expect(result.current.state.status).toBe('loaded'));

    expect(repository.findSkillEvidence).toHaveBeenCalledWith(
      'attention_to_detail',
    );
    expect(repository.loadEvidenceMap).not.toHaveBeenCalled();
    expect(result.current.state).toEqual({
      status: 'loaded',
      entries: evidenceEntries,
      isRefreshing: false,
      refreshError: false,
    });
  });
});
