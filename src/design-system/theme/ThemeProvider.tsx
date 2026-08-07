import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import {
  type AppTheme,
  type ResolvedTheme,
  type ThemeMode,
  themes,
} from '@/design-system/tokens/theme';

const THEME_MODE_STORAGE_KEY = '@kerjalog/theme-mode/v1';

type ThemeContextValue = {
  theme: AppTheme;
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'system' || value === 'light' || value === 'dark';
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemColorScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    let isActive = true;

    AsyncStorage.getItem(THEME_MODE_STORAGE_KEY)
      .then((storedMode) => {
        if (isActive && isThemeMode(storedMode)) {
          setModeState(storedMode);
        }
      })
      .catch(() => {
        // Theme persistence is a convenience. The app can safely fall back to
        // the system theme if local storage is unavailable.
      });

    return () => {
      isActive = false;
    };
  }, []);

  const setMode = useCallback((nextMode: ThemeMode) => {
    setModeState(nextMode);
    void AsyncStorage.setItem(THEME_MODE_STORAGE_KEY, nextMode).catch(() => {
      // Keep the in-memory choice even when persistence fails.
    });
  }, []);

  const resolvedTheme: ResolvedTheme =
    mode === 'system'
      ? systemColorScheme === 'dark'
        ? 'dark'
        : 'light'
      : mode;

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: themes[resolvedTheme],
      mode,
      resolvedTheme,
      setMode,
    }),
    [mode, resolvedTheme, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider.');
  }

  return context;
}
