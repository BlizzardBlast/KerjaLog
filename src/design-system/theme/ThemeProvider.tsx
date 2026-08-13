import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  type PropsWithChildren,
  use,
  useEffect,
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

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemColorScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
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

  const setMode = (nextMode: ThemeMode) => {
    setModeState(nextMode);
    persistThemeMode(nextMode).catch(ignoreError);
  };

  const resolvedTheme: ResolvedTheme =
    mode === 'system'
      ? systemColorScheme === 'dark'
        ? 'dark'
        : 'light'
      : mode;

  const value: ThemeContextValue = {
    theme: themes[resolvedTheme],
    mode,
    resolvedTheme,
    isHydrated,
    setMode,
  };

  return <ThemeContext value={value}>{children}</ThemeContext>;
}

export function useTheme() {
  const context = use(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider.');
  }

  return context;
}
