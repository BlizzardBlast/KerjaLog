import { act, renderHook, waitFor } from '@testing-library/react-native';
import { StrictMode, type PropsWithChildren } from 'react';
import { EMPTY_WORK_ENTRY_DRAFT } from '@/domain/entry/draft';
import { useWeeklyReflectionController } from '@/features/weekly-reflection/useWeeklyReflectionController';

jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
}));

function StrictModeWrapper({ children }: PropsWithChildren) {
  return <StrictMode>{children}</StrictMode>;
}

function createRepository() {
  return {
    loadActive: jest.fn(),
    saveActive: jest.fn(),
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
}

function renderController(
  onOpenLog: () => void,
  repository: ReturnType<typeof createRepository>,
) {
  return renderHook(
    () => useWeeklyReflectionController({ onOpenLog, repository }),
    { wrapper: StrictModeWrapper },
  );
}

describe('weekly reflection controller', () => {
  test('lets users skip every prompt without creating persisted work', async () => {
    const repository = createRepository();
    const onOpenLog = jest.fn();
    const { result } = await renderController(onOpenLog, repository);

    for (let index = 0; index < 4; index += 1) {
      await act(async () => {
        result.current.advance(false);
      });
    }

    expect(result.current.reviewing).toBe(true);
    expect(result.current.answeredPrompts).toEqual([]);
    expect(repository.saveActive).not.toHaveBeenCalled();
    expect(onOpenLog).not.toHaveBeenCalled();
  });

  test('seeds a normalized encrypted work-entry draft before opening Log', async () => {
    const repository = createRepository();
    repository.loadActive.mockResolvedValue(null);
    repository.saveActive.mockResolvedValue(undefined);
    const onOpenLog = jest.fn();
    const { result } = await renderController(onOpenLog, repository);

    await act(async () => {
      await result.current.handoffToLog(
        'problem',
        '  Resolved a duplicate reconciliation issue  ',
      );
    });

    expect(repository.saveActive).toHaveBeenCalledWith({
      ...EMPTY_WORK_ENTRY_DRAFT,
      step: 'event',
      intent: 'solved',
      rawNote: 'Resolved a duplicate reconciliation issue',
    });
    expect(onOpenLog).toHaveBeenCalledTimes(1);
    expect(result.current.handoffState).toEqual({ status: 'idle' });
  });

  test('consumes a successfully handed-off answer so it cannot be logged twice on return', async () => {
    const repository = createRepository();
    repository.loadActive.mockResolvedValue(null);
    repository.saveActive.mockResolvedValue(undefined);
    const onOpenLog = jest.fn();
    const { result } = await renderController(onOpenLog, repository);

    await act(async () => {
      result.current.setCurrentAnswer('Finished the month-end report');
    });
    await act(async () => {
      result.current.advance(true);
    });
    for (let index = 1; index < 4; index += 1) {
      await act(async () => {
        result.current.advance(false);
      });
    }

    expect(result.current.answeredPrompts).toHaveLength(1);

    await act(async () => {
      await result.current.handoffToLog(
        'moved_forward',
        'Finished the month-end report',
      );
    });

    expect(result.current.answeredPrompts).toEqual([]);
    expect(repository.saveActive).toHaveBeenCalledTimes(1);
    expect(onOpenLog).toHaveBeenCalledTimes(1);
  });

  test('never overwrites an existing unfinished work-entry draft', async () => {
    const repository = createRepository();
    repository.loadActive.mockResolvedValue({
      ...EMPTY_WORK_ENTRY_DRAFT,
      step: 'event',
      intent: 'completed',
      rawNote: 'Existing unfinished note',
    });
    const onOpenLog = jest.fn();
    const { result } = await renderController(onOpenLog, repository);

    await act(async () => {
      await result.current.handoffToLog('helped', 'Helped the operations team');
    });

    expect(result.current.handoffState).toEqual({
      status: 'active-draft',
      promptId: 'helped',
    });
    expect(repository.saveActive).not.toHaveBeenCalled();
    expect(onOpenLog).not.toHaveBeenCalled();
  });

  test('does not persist empty reflection answers', async () => {
    const repository = createRepository();
    const onOpenLog = jest.fn();
    const { result } = await renderController(onOpenLog, repository);

    await act(async () => {
      await result.current.handoffToLog('learned', '   ');
    });

    expect(repository.loadActive).not.toHaveBeenCalled();
    expect(repository.saveActive).not.toHaveBeenCalled();
    expect(onOpenLog).not.toHaveBeenCalled();
  });

  test('serializes rapid handoff attempts so a double press cannot duplicate writes', async () => {
    const repository = createRepository();
    const activeDraft = deferred<null>();
    repository.loadActive.mockReturnValue(activeDraft.promise);
    repository.saveActive.mockResolvedValue(undefined);
    const onOpenLog = jest.fn();
    const { result } = await renderController(onOpenLog, repository);

    let firstHandoff!: Promise<void>;
    await act(async () => {
      firstHandoff = result.current.handoffToLog('helped', 'Helped finance');
      void result.current.handoffToLog('problem', 'Fixed a report issue');
    });

    expect(repository.loadActive).toHaveBeenCalledTimes(1);

    activeDraft.resolve(null);
    await act(async () => {
      await firstHandoff;
    });

    expect(repository.saveActive).toHaveBeenCalledTimes(1);
    expect(onOpenLog).toHaveBeenCalledTimes(1);
  });

  test('does not navigate after the reflection screen unmounts during a handoff', async () => {
    const repository = createRepository();
    const save = deferred<void>();
    repository.loadActive.mockResolvedValue(null);
    repository.saveActive.mockReturnValue(save.promise);
    const onOpenLog = jest.fn();
    const { result, unmount } = await renderController(onOpenLog, repository);

    let handoff!: Promise<void>;
    await act(async () => {
      handoff = result.current.handoffToLog('learned', 'Learned a new process');
    });

    await waitFor(() => expect(repository.saveActive).toHaveBeenCalledTimes(1));
    await act(async () => {
      unmount();
    });
    save.resolve();
    await handoff;

    expect(onOpenLog).not.toHaveBeenCalled();
  });
});
