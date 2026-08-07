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
import { type TranslationKey, translations } from '@/i18n/translations';
import { EMPTY_FUNCTION } from '@/shared/utils/function';

const LANGUAGE_STORAGE_KEY = '@kerjalog/language/v1';

export type Language = keyof typeof translations;

type TranslationParams = Record<string, string | number>;

type I18nContextValue = {
  language: Language;
  isHydrated: boolean;
  setLanguage: (language: Language) => Promise<void>;
  t: (key: TranslationKey, params?: TranslationParams) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function isLanguage(value: string | null): value is Language {
  return value === 'en' || value === 'id';
}

function getDeviceLanguage(): Language {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase();
    return locale.startsWith('id') ? 'id' : 'en';
  } catch {
    return 'en';
  }
}

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) {
    return template;
  }

  return template.replace(/{{(\w+)}}/g, (match, key: string) => {
    const value = params[key];
    return value === undefined ? match : String(value);
  });
}

export function I18nProvider({ children }: PropsWithChildren) {
  const [language, setLanguageState] = useState<Language>(getDeviceLanguage);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let ignore = false;

    const hydrateLanguage = async () => {
      try {
        const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);

        if (!ignore && isLanguage(storedLanguage)) {
          setLanguageState(storedLanguage);
        }
      } finally {
        if (!ignore) {
          setIsHydrated(true);
        }
      }
    };

    hydrateLanguage().catch(EMPTY_FUNCTION);

    return () => {
      ignore = true;
    };
  }, []);

  const setLanguage = useCallback(async (nextLanguage: Language) => {
    setLanguageState(nextLanguage);

    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    } catch {
      // Keep the optimistic session preference even if persistence is unavailable.
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: TranslationParams) =>
      interpolate(translations[language][key], params),
    [language],
  );

  const value = useMemo<I18nContextValue>(
    () => ({ language, isHydrated, setLanguage, t }),
    [isHydrated, language, setLanguage, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error('useI18n must be used inside I18nProvider.');
  }

  return context;
}
