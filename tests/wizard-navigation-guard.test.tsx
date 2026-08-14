import { act, renderHook, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useWizardNavigationGuard } from '@/features/work-entry/useWizardNavigationGuard';

const mockDispatch = jest.fn();
let mockPreventRemoveEnabled = false;
let mockPreventRemoveHandler:
  | ((event: { data: { action: { type: string } } }) => void)
  | undefined;

jest.mock('expo-router', () => ({
  useNavigation: () => ({ dispatch: mockDispatch }),
}));

jest.mock('expo-router/react-navigation', () => ({
  usePreventRemove: (
    preventRemove: boolean,
    handler: typeof mockPreventRemoveHandler,
  ) => {
    mockPreventRemoveEnabled = preventRemove;
    mockPreventRemoveHandler = handler;
  },
}));

const copy = {
  title: 'Discard changes?',
  description: 'Unsaved changes will be lost.',
  keepEditing: 'Keep editing',
  discard: 'Discard changes',
};

const removeAction = { type: 'GO_BACK' };

async function waitForGuardRegistration() {
  await waitFor(() => expect(mockPreventRemoveHandler).toBeDefined());
}

describe('useWizardNavigationGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPreventRemoveEnabled = false;
    mockPreventRemoveHandler = undefined;
  });

  test('intercepts native route removal for an internal step even when pristine', async () => {
    const onInternalBack = jest.fn();
    await renderHook(() =>
      useWizardNavigationGuard({
        hasUnsavedChanges: false,
        currentStep: 3,
        onInternalBack,
        onDiscard: jest.fn().mockResolvedValue(true),
        copy,
      }),
    );
    await waitForGuardRegistration();

    expect(mockPreventRemoveEnabled).toBe(true);

    act(() => {
      mockPreventRemoveHandler?.({ data: { action: removeAction } });
    });

    expect(onInternalBack).toHaveBeenCalledTimes(1);
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  test('does not prevent removal at the first pristine step', async () => {
    await renderHook(() =>
      useWizardNavigationGuard({
        hasUnsavedChanges: false,
        currentStep: 1,
        onInternalBack: jest.fn(),
        onDiscard: jest.fn().mockResolvedValue(true),
        copy,
      }),
    );
    await waitForGuardRegistration();

    expect(mockPreventRemoveEnabled).toBe(false);
  });

  test('runs discard cleanup before dispatching a dirty first-step removal', async () => {
    const onDiscard = jest.fn().mockResolvedValue(true);
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    await renderHook(() =>
      useWizardNavigationGuard({
        hasUnsavedChanges: true,
        currentStep: 1,
        onInternalBack: jest.fn(),
        onDiscard,
        copy,
      }),
    );
    await waitForGuardRegistration();

    act(() => {
      mockPreventRemoveHandler?.({ data: { action: removeAction } });
    });

    const discardButton = alertSpy.mock.calls[0]?.[2]?.find(
      (button) => button.text === copy.discard,
    );
    act(() => {
      discardButton?.onPress?.();
    });

    await waitFor(() => {
      expect(onDiscard).toHaveBeenCalledTimes(1);
      expect(mockDispatch).toHaveBeenCalledWith(removeAction);
    });
    alertSpy.mockRestore();
  });

  test('keeps the route when discard cleanup fails', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    const onDiscard = jest.fn().mockResolvedValue(false);
    await renderHook(() =>
      useWizardNavigationGuard({
        hasUnsavedChanges: true,
        currentStep: 1,
        onInternalBack: jest.fn(),
        onDiscard,
        copy,
      }),
    );
    await waitForGuardRegistration();

    act(() => {
      mockPreventRemoveHandler?.({ data: { action: removeAction } });
    });

    const discardButton = alertSpy.mock.calls[0]?.[2]?.find(
      (button) => button.text === copy.discard,
    );
    act(() => {
      discardButton?.onPress?.();
    });

    await waitFor(() => expect(onDiscard).toHaveBeenCalledTimes(1));
    expect(mockDispatch).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  test('allows one programmatic removal without prompting', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    const { result } = await renderHook(() =>
      useWizardNavigationGuard({
        hasUnsavedChanges: true,
        currentStep: 5,
        onInternalBack: jest.fn(),
        onDiscard: jest.fn().mockResolvedValue(true),
        copy,
      }),
    );
    await waitForGuardRegistration();

    act(() => {
      result.current();
      mockPreventRemoveHandler?.({ data: { action: removeAction } });
    });

    expect(mockDispatch).toHaveBeenCalledWith(removeAction);
    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });
});
