import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  type PropsWithChildren,
  use,
  useCallback,
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
import { ignoreError } from '@/shared/utils/function';

const THEME_MODE_STORAGE_KEY = '@kerjalog/theme-mode/v1';

type ThemeContextValue = {
  theme: AppTheme;
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  isHydrated: boolean;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'system' || value === 'light' || value === 'dark';
}

async function persistThemeMode(mode: ThemeMode): Promise<void> {
  await AsyncStorage.setItem(THEME_MODE_STORAGE_KEY, mode);
}

export function ThemeProvider({ children }: Readonly<PropsWithChildren>) {
  const systemColorScheme = useColorScheme();
  const [modeState, setModeState] = useState<ThemeMode>('system');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let ignore = false;

    const hydrateThemeMode = async () => {
      try {
        const storedMode = await AsyncStorage.getItem(THEME_MODE_STORAGE_KEY);

        if (!ignore && isThemeMode(storedMode)) {
          setModeState(storedMode);
        }
      } finally {
        if (!ignore) {
          setIsHydrated(true);
        }
      }
    };

    hydrateThemeMode().catch(ignoreError);

    return () => {
      ignore = true;
    };
  }, []);

  const setMode = useCallback((nextMode: ThemeMode) => {
    setModeState(nextMode);
    persistThemeMode(nextMode).catch(ignoreError);
  }, []);

  let resolvedTheme: ResolvedTheme;
  if (modeState === 'system') {
    resolvedTheme = systemColorScheme === 'dark' ? 'dark' : 'light';
  } else {
    resolvedTheme = modeState;
  }

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: themes[resolvedTheme],
      mode: modeState,
      resolvedTheme,
      isHydrated,
      setMode,
    }),
    [isHydrated, modeState, resolvedTheme, setMode],
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
}

export function useTheme() {
  const context = use(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider.');
  }

  return context;
}
