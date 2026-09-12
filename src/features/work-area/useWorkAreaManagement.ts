import { useRef, useState } from 'react';
import type { WorkArea } from '@/domain/work-area/model';
import { normalizeWorkAreaName } from '@/domain/work-area/validation';
import { useWorkAreaMutations } from '@/features/work-area/useWorkAreaMutations';
import { useWorkAreas } from '@/features/work-area/useWorkAreas';

export type WorkAreaEditor =
  | { mode: 'create'; initialName: string; revision: number }
  | {
      mode: 'rename';
      workAreaId: string;
      initialName: string;
      revision: number;
    };

type WorkAreaManagementError = 'editor' | 'archive' | null;
type WorkAreaManagementMutation = 'editor' | 'archive' | null;

function createEditor(revision: number): WorkAreaEditor {
  return { mode: 'create', initialName: '', revision };
}

export function useWorkAreaManagement() {
  const { state, reload } = useWorkAreas({ includeArchived: true });
  const {
    create,
    rename,
    archive: archiveWorkArea,
  } = useWorkAreaMutations({
    onMutated: reload,
  });
  const [editor, setEditor] = useState<WorkAreaEditor>(() => createEditor(0));
  const [mutation, setMutation] = useState<WorkAreaManagementMutation>(null);
  const [error, setError] = useState<WorkAreaManagementError>(null);
  // Closes duplicate press/IME events before state updates rerender controls.
  const mutationInFlightRef = useRef(false);
  const activeWorkAreas = state.workAreas.filter(
    (workArea) => workArea.archivedAt === null,
  );
  const archivedWorkAreas = state.workAreas.filter(
    (workArea) => workArea.archivedAt !== null,
  );
  const hasCatalogData = state.workAreas.length > 0;
  const isInitialLoading = state.status === 'loading' && !hasCatalogData;
  const hasBlockingLoadError = state.status === 'error' && !hasCatalogData;

  const resetEditor = () => {
    setEditor((current) => createEditor(current.revision + 1));
    setError((current) => (current === 'editor' ? null : current));
  };

  const startRename = (workArea: WorkArea) => {
    setEditor((current) => ({
      mode: 'rename',
      workAreaId: workArea.id,
      initialName: workArea.name,
      revision: current.revision + 1,
    }));
    setError((current) => (current === 'editor' ? null : current));
  };

  const clearEditorError = () => {
    setError((current) => (current === 'editor' ? null : current));
  };

  const submit = async (name: string): Promise<void> => {
    if (
      mutation !== null ||
      mutationInFlightRef.current ||
      isInitialLoading ||
      hasBlockingLoadError
    ) {
      return;
    }

    let normalizedName: string;
    try {
      normalizedName = normalizeWorkAreaName(name);
    } catch {
      setError('editor');
      return;
    }

    mutationInFlightRef.current = true;
    setMutation('editor');
    setError(null);
    try {
      if (editor.mode === 'rename') {
        await rename(editor.workAreaId, normalizedName);
      } else {
        await create(normalizedName);
      }
      setEditor((current) => createEditor(current.revision + 1));
    } catch {
      setError('editor');
    } finally {
      mutationInFlightRef.current = false;
      setMutation(null);
    }
  };

  const archive = async (workAreaId: string): Promise<void> => {
    if (mutation !== null || mutationInFlightRef.current) {
      return;
    }

    mutationInFlightRef.current = true;
    setMutation('archive');
    setError((current) => (current === 'archive' ? null : current));
    try {
      await archiveWorkArea(workAreaId);
      setEditor((current) =>
        current.mode === 'rename' && current.workAreaId === workAreaId
          ? createEditor(current.revision + 1)
          : current,
      );
    } catch {
      setError('archive');
    } finally {
      mutationInFlightRef.current = false;
      setMutation(null);
    }
  };

  return {
    state,
    reload,
    activeWorkAreas,
    archivedWorkAreas,
    editor,
    error,
    isInitialLoading,
    hasBlockingLoadError,
    isMutating: mutation !== null,
    resetEditor,
    startRename,
    clearEditorError,
    submit,
    archive,
  };
}
