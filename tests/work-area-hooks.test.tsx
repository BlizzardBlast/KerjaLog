import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { WorkArea } from '@/domain/work-area/model';
import type {
  WorkAreaReader,
  WorkAreaWriter,
} from '@/domain/work-area/repository';
import { useWorkAreaMutations } from '@/features/work-area/useWorkAreaMutations';
import { useWorkAreas } from '@/features/work-area/useWorkAreas';

jest.mock('expo-router', () => {
  const React = jest.requireActual<typeof import('react')>('react');

  return {
    useFocusEffect: (effect: import('react').EffectCallback) => {
      React.useEffect(effect, [effect]);
    },
  };
});

const firstArea: WorkArea = {
  id: 'area-1',
  name: 'Monthly Reporting',
  archivedAt: null,
  createdAt: '2026-08-30T01:00:00.000Z',
  updatedAt: '2026-08-30T01:00:00.000Z',
};

const secondArea: WorkArea = {
  ...firstArea,
  id: 'area-2',
  name: 'Operations',
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
}

describe('work area hooks', () => {
  test('loads through the narrow read capability', async () => {
    const repository: jest.Mocked<WorkAreaReader> = {
      listActive: jest.fn().mockResolvedValue([firstArea]),
      listAll: jest.fn().mockResolvedValue([firstArea, secondArea]),
    };

    const { result } = await renderHook(() =>
      useWorkAreas({ repository, includeArchived: true }),
    );

    await waitFor(() => expect(result.current.state.status).toBe('loaded'));

    expect(repository.listAll).toHaveBeenCalledTimes(1);
    expect(repository.listActive).not.toHaveBeenCalled();
    expect(result.current.state.workAreas).toEqual([firstArea, secondArea]);
  });

  test('ignores a stale catalog response after a newer reload', async () => {
    const firstRequest = deferred<WorkArea[]>();
    const secondRequest = deferred<WorkArea[]>();
    const repository: jest.Mocked<WorkAreaReader> = {
      listActive: jest
        .fn()
        .mockReturnValueOnce(firstRequest.promise)
        .mockReturnValueOnce(secondRequest.promise),
      listAll: jest.fn(),
    };

    const { result } = await renderHook(() => useWorkAreas({ repository }));

    await act(async () => {
      result.current.reload();
    });

    await act(async () => {
      secondRequest.resolve([secondArea]);
    });
    await waitFor(() =>
      expect(result.current.state.workAreas).toEqual([secondArea]),
    );

    await act(async () => {
      firstRequest.resolve([firstArea]);
    });

    expect(result.current.state.workAreas).toEqual([secondArea]);
  });

  test('mutates through the narrow write capability and refreshes on success', async () => {
    const repository: jest.Mocked<WorkAreaWriter> = {
      create: jest.fn().mockResolvedValue(firstArea),
      rename: jest.fn().mockResolvedValue(secondArea),
      archive: jest.fn().mockResolvedValue(undefined),
    };
    const onMutated = jest.fn();
    const { result } = await renderHook(() =>
      useWorkAreaMutations({ repository, onMutated }),
    );

    await act(async () => {
      await result.current.create('Monthly Reporting');
      await result.current.rename('area-1', 'Operations');
      await result.current.archive('area-1');
    });

    expect(repository.create).toHaveBeenCalledWith('Monthly Reporting');
    expect(repository.rename).toHaveBeenCalledWith('area-1', 'Operations');
    expect(repository.archive).toHaveBeenCalledWith('area-1');
    expect(onMutated).toHaveBeenCalledTimes(3);
  });
});
