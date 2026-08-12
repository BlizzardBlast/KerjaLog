import { act, renderHook, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useLogDraftNavigationGuard } from '@/features/work-entry/useLogDraftNavigationGuard';

const mockDispatch = jest.fn();
let mockPreventRemoveHandler:
  | ((event: { data: { action: { type: string } } }) => void)
  | undefined;

jest.mock('expo-router', () => ({
  useNavigation: () => ({ dispatch: mockDispatch }),
}));

jest.mock('expo-router/react-navigation', () => ({
  usePreventRemove: (
    _preventRemove: boolean,
    handler: typeof mockPreventRemoveHandler,
  ) => {
    mockPreventRemoveHandler = handler;
  },
}));

const copy = {
  title: 'Discard this draft?',
  description: 'The draft will be lost.',
  keepEditing: 'Keep editing',
  discard: 'Discard draft',
};

const removeAction = { type: 'GO_BACK' };

async function waitForGuardRegistration() {
  await waitFor(() => expect(mockPreventRemoveHandler).toBeDefined());
}

describe('useLogDraftNavigationGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPreventRemoveHandler = undefined;
  });

  test('turns native route removal into an internal wizard back step', async () => {
    const onInternalBack = jest.fn();
    await renderHook(() =>
      useLogDraftNavigationGuard({
        hasUnsavedDraft: true,
        currentStep: 3,
        onInternalBack,
        onDiscard: jest.fn().mockResolvedValue(true),
        allowNextRemovalRef: { current: false },
        copy,
      }),
    );
    await waitForGuardRegistration();

    await act(async () => {
      mockPreventRemoveHandler?.({ data: { action: removeAction } });
    });

    expect(onInternalBack).toHaveBeenCalledTimes(1);
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  test('clears persisted draft before allowing explicit discard', async () => {
    const onDiscard = jest.fn().mockResolvedValue(true);
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    await renderHook(() =>
      useLogDraftNavigationGuard({
        hasUnsavedDraft: true,
        currentStep: 1,
        onInternalBack: jest.fn(),
        onDiscard,
        allowNextRemovalRef: { current: false },
        copy,
      }),
    );
    await waitForGuardRegistration();

    await act(async () => {
      mockPreventRemoveHandler?.({ data: { action: removeAction } });
    });

    const buttons = alertSpy.mock.calls[0]?.[2];
    const discardButton = buttons?.find(
      (button) => button.text === copy.discard,
    );
    await act(async () => {
      discardButton?.onPress?.();
      await Promise.resolve();
    });

    expect(onDiscard).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith(removeAction);
    alertSpy.mockRestore();
  });

  test('keeps the route when encrypted draft cleanup fails', async () => {
    const onDiscard = jest.fn().mockResolvedValue(false);
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    await renderHook(() =>
      useLogDraftNavigationGuard({
        hasUnsavedDraft: true,
        currentStep: 1,
        onInternalBack: jest.fn(),
        onDiscard,
        allowNextRemovalRef: { current: false },
        copy,
      }),
    );
    await waitForGuardRegistration();

    await act(async () => {
      mockPreventRemoveHandler?.({ data: { action: removeAction } });
    });

    const buttons = alertSpy.mock.calls[0]?.[2];
    const discardButton = buttons?.find(
      (button) => button.text === copy.discard,
    );
    await act(async () => {
      discardButton?.onPress?.();
      await Promise.resolve();
    });

    expect(onDiscard).toHaveBeenCalledTimes(1);
    expect(mockDispatch).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  test('allows the saved-entry replacement without a discard prompt', async () => {
    const allowNextRemovalRef = { current: true };
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    await renderHook(() =>
      useLogDraftNavigationGuard({
        hasUnsavedDraft: true,
        currentStep: 5,
        onInternalBack: jest.fn(),
        onDiscard: jest.fn().mockResolvedValue(true),
        allowNextRemovalRef,
        copy,
      }),
    );
    await waitForGuardRegistration();

    await act(async () => {
      mockPreventRemoveHandler?.({ data: { action: removeAction } });
    });

    expect(mockDispatch).toHaveBeenCalledWith(removeAction);
    expect(allowNextRemovalRef.current).toBe(false);
    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });
});
