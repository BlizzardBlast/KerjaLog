import { act, renderHook } from '@testing-library/react-native';
import { useWeeklyReflectionNotificationNavigation } from '@/navigation/useWeeklyReflectionNotificationNavigation';

const mockPush = jest.fn();
const mockObserve = jest.fn();
let mockPathname = '/home';

jest.mock('expo-router', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/platform/notifications/weeklyReflection', () => ({
  observeWeeklyReflectionNotificationResponses: (
    callback: () => void,
  ): (() => void) => mockObserve(callback),
}));

describe('weekly reflection notification navigation', () => {
  beforeEach(() => {
    mockPathname = '/home';
    mockPush.mockReset();
    mockObserve.mockReset();
    mockObserve.mockReturnValue(jest.fn());
  });

  test('subscribes only after the root navigator is ready', async () => {
    const view = await renderHook(
      (enabled: boolean) => useWeeklyReflectionNotificationNavigation(enabled),
      { initialProps: false },
    );

    expect(mockObserve).not.toHaveBeenCalled();

    await view.rerender(true);

    expect(mockObserve).toHaveBeenCalledTimes(1);
  });

  test('opens the reflection route for a handled weekly reminder', async () => {
    await renderHook(() => useWeeklyReflectionNotificationNavigation(true));
    const onOpenReflection = mockObserve.mock.calls[0]?.[0];

    act(() => {
      onOpenReflection?.();
    });

    expect(mockPush).toHaveBeenCalledWith('/reflection');
  });

  test('does not stack another reflection route when already there', async () => {
    mockPathname = '/reflection';
    await renderHook(() => useWeeklyReflectionNotificationNavigation(true));
    const onOpenReflection = mockObserve.mock.calls[0]?.[0];

    act(() => {
      onOpenReflection?.();
    });

    expect(mockPush).not.toHaveBeenCalled();
  });
});
