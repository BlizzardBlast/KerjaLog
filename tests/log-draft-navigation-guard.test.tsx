import { act, renderHook } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useLogDraftNavigationGuard } from '@/features/work-entry/useLogDraftNavigationGuard';

const dispatch = jest.fn();
let preventRemoveHandler:
  | ((event: { data: { action: { type: string } } }) => void)
  | undefined;

jest.mock('expo-router', () => ({
  useNavigation: () => ({ dispatch }),
}));

jest.mock('expo-router/react-navigation', () => ({
  usePreventRemove: (
    _preventRemove: boolean,
    handler: typeof preventRemoveHandler,
  ) => {
    preventRemoveHandler = handler;
  },
}));

const copy = {
  title: 'Discard this draft?',
  description: 'The draft will be lost.',
  keepEditing: 'Keep editing',
  discard: 'Discard draft',
};

const removeAction = { type: 'GO_BACK' };

describe('useLogDraftNavigationGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    preventRemoveHandler = undefined;
  });

  test('turns native route removal into an internal wizard back step', async () => {
    const onInternalBack = jest.fn();
    await renderHook(() =>
      useLogDraftNavigationGuard({
        hasUnsavedDraft: true,
        currentStep: 3,
        onInternalBack,
        allowNextRemovalRef: { current: false },
        copy,
      }),
    );

    act(() => {
      preventRemoveHandler?.({ data: { action: removeAction } });
    });

    expect(onInternalBack).toHaveBeenCalledTimes(1);
    expect(dispatch).not.toHaveBeenCalled();
  });

  test('asks before discarding a dirty draft from the first step', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    await renderHook(() =>
      useLogDraftNavigationGuard({
        hasUnsavedDraft: true,
        currentStep: 1,
        onInternalBack: jest.fn(),
        allowNextRemovalRef: { current: false },
        copy,
      }),
    );

    act(() => {
      preventRemoveHandler?.({ data: { action: removeAction } });
    });

    expect(alertSpy).toHaveBeenCalledWith(
      copy.title,
      copy.description,
      expect.arrayContaining([
        expect.objectContaining({ text: copy.keepEditing, style: 'cancel' }),
        expect.objectContaining({ text: copy.discard, style: 'destructive' }),
      ]),
    );
    expect(dispatch).not.toHaveBeenCalled();

    const buttons = alertSpy.mock.calls[0]?.[2];
    const discardButton = buttons?.find((button) => button.text === copy.discard);
    act(() => {
      discardButton?.onPress?.();
    });

    expect(dispatch).toHaveBeenCalledWith(removeAction);
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
        allowNextRemovalRef,
        copy,
      }),
    );

    act(() => {
      preventRemoveHandler?.({ data: { action: removeAction } });
    });

    expect(dispatch).toHaveBeenCalledWith(removeAction);
    expect(allowNextRemovalRef.current).toBe(false);
    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });
});
