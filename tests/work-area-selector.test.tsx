import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '@/design-system/theme/ThemeProvider';
import type { WorkArea } from '@/domain/work-area/model';
import { WorkAreaSelector } from '@/features/work-area/WorkAreaSelector';

const mockUseWorkAreas = jest.fn();
const mockUseWorkAreaMutations = jest.fn();

jest.mock('@/features/work-area/useWorkAreas', () => ({
  useWorkAreas: (...args: unknown[]) => mockUseWorkAreas(...args),
}));

jest.mock('@/features/work-area/useWorkAreaMutations', () => ({
  useWorkAreaMutations: (...args: unknown[]) =>
    mockUseWorkAreaMutations(...args),
}));

jest.mock('@/i18n/I18nProvider', () => ({
  useI18n: () => ({
    t: (key: string, values?: { name?: string }) =>
      values?.name ? `${key}: ${values.name}` : key,
  }),
}));

const archivedWorkArea: WorkArea = {
  id: 'area-legacy',
  name: 'Legacy Reporting',
  archivedAt: '2026-08-31T01:00:00.000Z',
  createdAt: '2026-08-30T01:00:00.000Z',
  updatedAt: '2026-08-31T01:00:00.000Z',
};

describe('WorkAreaSelector', () => {
  const create = jest.fn();
  const reload = jest.fn();
  const onChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWorkAreas.mockReturnValue({
      state: { status: 'loaded', workAreas: [] },
      reload,
    });
    mockUseWorkAreaMutations.mockReturnValue({ create });
  });

  async function renderSelector(selectedId: string | null = null) {
    return render(
      <ThemeProvider>
        <WorkAreaSelector onChange={onChange} selectedId={selectedId} />
      </ThemeProvider>,
    );
  }

  async function openCreateForm(view: Awaited<ReturnType<typeof render>>) {
    await fireEvent.press(
      view.getByRole('button', { name: 'workArea.createFirst' }),
    );
    return view.findByLabelText('workArea.nameLabel');
  }

  test('drops repeated inline-create submits while first request is pending', async () => {
    let resolveCreate: ((workArea: { id: string }) => void) | undefined;
    create.mockImplementation(
      () =>
        new Promise<{ id: string }>((resolve) => {
          resolveCreate = resolve;
        }),
    );
    const view = await renderSelector();
    const nameField = await openCreateForm(view);

    await fireEvent.changeText(nameField, 'Finance Reporting');
    const createButton = view.getByRole('button', {
      name: 'workArea.createAction',
    });
    await fireEvent.press(createButton);
    await fireEvent.press(createButton);

    await waitFor(() => {
      expect(create).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      resolveCreate?.({ id: 'area-finance' });
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith('area-finance');
    });
  });

  test('uses text value from the same native change-and-submit turn', async () => {
    create.mockResolvedValue({ id: 'area-finance' });
    const view = await renderSelector();
    const nameField = await openCreateForm(view);

    await act(async () => {
      nameField.props.onChangeText('Finance Reporting');
      nameField.props.onSubmitEditing({});
    });

    await waitFor(() => {
      expect(create).toHaveBeenCalledWith('Finance Reporting');
    });
    expect(onChange).toHaveBeenCalledWith('area-finance');
  });

  test('keeps an archived selected area visible but unavailable', async () => {
    mockUseWorkAreas.mockReturnValue({
      state: { status: 'loaded', workAreas: [archivedWorkArea] },
      reload,
    });
    const view = await renderSelector(archivedWorkArea.id);

    const archivedChip = view.getByRole('button', {
      name: 'workArea.archivedName: Legacy Reporting',
    });

    expect(archivedChip.props.accessibilityState).toMatchObject({
      disabled: true,
      selected: true,
    });
  });

  test('shows a mutation error and permits retry after editing', async () => {
    create
      .mockRejectedValueOnce(new Error('write failed'))
      .mockResolvedValueOnce({ id: 'area-finance' });
    const view = await renderSelector();
    const nameField = await openCreateForm(view);

    await fireEvent.changeText(nameField, 'Finance Reporting');
    await fireEvent.press(
      view.getByRole('button', { name: 'workArea.createAction' }),
    );

    await waitFor(() => {
      expect(view.getByText('workArea.mutationError')).toBeTruthy();
    });

    await fireEvent.changeText(nameField, 'Finance Operations');
    expect(view.queryByText('workArea.mutationError')).toBeNull();
    await fireEvent.press(
      view.getByRole('button', { name: 'workArea.createAction' }),
    );

    await waitFor(() => {
      expect(create).toHaveBeenLastCalledWith('Finance Operations');
    });
    expect(onChange).toHaveBeenCalledWith('area-finance');
  });
});
