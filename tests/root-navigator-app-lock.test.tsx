import { render } from '@testing-library/react-native';
import { RootNavigator } from '@/navigation/RootNavigator';

const mockAppLockState = {
  enabled: true,
  locked: false,
  isHydrated: true,
};
let mockStackMounts = 0;
let mockStackUnmounts = 0;

jest.mock('expo-router', () => {
  const React = jest.requireActual<typeof import('react')>('react');

  return {
    Stack: () => {
      React.useEffect(() => {
        mockStackMounts += 1;
        return () => {
          mockStackUnmounts += 1;
        };
      }, []);

      return null;
    },
  };
});

jest.mock('expo-splash-screen', () => ({
  hide: jest.fn(),
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

jest.mock('@/design-system/theme/ThemeProvider', () => ({
  useTheme: () => ({
    theme: { colors: { surface: '#fff' } },
    resolvedTheme: 'light',
    isHydrated: true,
  }),
}));

jest.mock('@/features/app-lock/AppLockProvider', () => ({
  useAppLock: () => mockAppLockState,
}));

jest.mock('@/features/app-lock/AppLockScreen', () => ({
  AppLockScreen: () => null,
}));

jest.mock('@/features/onboarding/useOnboarding', () => ({
  useOnboarding: () => ({
    state: { completed: true },
    isHydrated: true,
  }),
}));

jest.mock('@/i18n/I18nProvider', () => ({
  useI18n: () => ({ isHydrated: true }),
}));

describe('RootNavigator app lock', () => {
  beforeEach(() => {
    mockAppLockState.locked = false;
    mockStackMounts = 0;
    mockStackUnmounts = 0;
  });

  test('keeps the navigation tree mounted while showing the lock screen', async () => {
    const view = await render(<RootNavigator />);

    expect(mockStackMounts).toBe(1);
    expect(mockStackUnmounts).toBe(0);

    mockAppLockState.locked = true;
    await view.rerender(<RootNavigator />);

    expect(mockStackMounts).toBe(1);
    expect(mockStackUnmounts).toBe(0);

    mockAppLockState.locked = false;
    await view.rerender(<RootNavigator />);

    expect(mockStackMounts).toBe(1);
    expect(mockStackUnmounts).toBe(0);

    await view.unmount();
    expect(mockStackUnmounts).toBe(1);
  });
});
