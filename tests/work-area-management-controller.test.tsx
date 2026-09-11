import { act, renderHook } from '@testing-library/react-native';
import type { WorkArea } from '@/domain/work-area/model';
import { useWorkAreaManagement } from '@/features/work-area/useWorkAreaManagement';

const mockUseWorkAreas = jest.fn();
const mockUseWorkAreaMutations = jest.fn();

jest.mock('@/features/work-area/useWorkAreas', () => ({
  useWorkAreas: (...args: unknown[]) => mockUseWorkAreas(...args),
}));

jest.mock('@/features/work-area/useWorkAreaMutations', () => ({
  useWorkAreaMutations: (...args: unknown[]) =>
    mockUseWorkAreaMutations(...args),
}));

const activeWorkArea: WorkArea = {
  id: 'area-reporting',
  name: 'Monthly Reporting',
  archivedAt: null,
  createdAt: '2026-08-30T01:00:00.000Z',
  updatedAt: '2026-08-30T01:00:00.000Z',
};

const archivedWorkArea: WorkArea = {
  ...activeWorkArea,
  id: 'area-legacy',
  name: 'Legacy Reporting',
  archivedAt: '2026-08-31T01:00:00.000Z',
};

describe('useWorkAreaManagement', () => {
  const create = jest.fn();
  const rename = jest.fn();
  const archive = jest.fn();
  const reload = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWorkAreas.mockReturnValue({
      state: {
        status: 'loaded',
        workAreas: [activeWorkArea, archivedWorkArea],
      },
      reload,
    });
    mockUseWorkAreaMutations.mockReturnValue({ create, rename, archive });
  });

  test('renames an active work area then restores create mode', async () => {
    rename.mockResolvedValue({
      ...activeWorkArea,
      name: 'Finance Reporting',
    });

    const { result } = await renderHook(() => useWorkAreaManagement());

    await act(() => {
      result.current.startRename(activeWorkArea);
    });

    expect(result.current.editor).toEqual({
      mode: 'rename',
      workAreaId: activeWorkArea.id,
      initialName: activeWorkArea.name,
      revision: 1,
    });

    await act(async () => {
      await result.current.submit('Finance Reporting');
    });

    expect(rename).toHaveBeenCalledWith(activeWorkArea.id, 'Finance Reporting');
    expect(result.current.editor).toEqual({
      mode: 'create',
      initialName: '',
      revision: 2,
    });
    expect(result.current.error).toBeNull();
  });

  test('archives an active work area and exits its rename mode', async () => {
    archive.mockResolvedValue(undefined);

    const { result } = await renderHook(() => useWorkAreaManagement());

    await act(() => result.current.startRename(activeWorkArea));

    await act(async () => {
      await result.current.archive(activeWorkArea.id);
    });

    expect(archive).toHaveBeenCalledWith(activeWorkArea.id);
    expect(result.current.editor).toEqual({
      mode: 'create',
      initialName: '',
      revision: 2,
    });
    expect(result.current.activeWorkAreas).toEqual([activeWorkArea]);
    expect(result.current.archivedWorkAreas).toEqual([archivedWorkArea]);
  });

  test('drops a repeated create submit while the first request is pending', async () => {
    let resolveCreate = () => {};
    const createPending = new Promise<void>((resolve) => {
      resolveCreate = resolve;
    });
    create.mockReturnValue(createPending);

    const { result } = await renderHook(() => useWorkAreaManagement());

    let firstSubmit: Promise<void> = Promise.resolve();
    await act(() => {
      firstSubmit = result.current.submit('Finance Reporting');
      void result.current.submit('Finance Reporting');
    });

    expect(create).toHaveBeenCalledTimes(1);
    expect(result.current.isMutating).toBe(true);

    await act(async () => {
      resolveCreate();
      await firstSubmit;
    });

    expect(result.current.isMutating).toBe(false);
  });

  test('reports failed editor and archive mutations, then permits retry', async () => {
    create
      .mockRejectedValueOnce(new Error('create failed'))
      .mockResolvedValueOnce(activeWorkArea);
    archive
      .mockRejectedValueOnce(new Error('archive failed'))
      .mockResolvedValueOnce(undefined);
    const { result } = await renderHook(() => useWorkAreaManagement());

    await act(async () => {
      await result.current.submit('Finance Reporting');
    });
    expect(result.current.error).toBe('editor');

    await act(() => result.current.clearEditorError());
    expect(result.current.error).toBeNull();
    await act(async () => {
      await result.current.submit('Finance Operations');
    });
    expect(create).toHaveBeenLastCalledWith('Finance Operations');

    await act(async () => {
      await result.current.archive(activeWorkArea.id);
    });
    expect(result.current.error).toBe('archive');

    await act(async () => {
      await result.current.archive(activeWorkArea.id);
    });
    expect(result.current.error).toBeNull();
    expect(archive).toHaveBeenCalledTimes(2);
  });
});
