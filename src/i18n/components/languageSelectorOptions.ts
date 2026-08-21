import type { Language, TranslationKey } from '@/i18n/catalog';

export type LanguageOption = {
  value: Language;
  flag: string;
  shortLabel: string;
  labelKey: TranslationKey;
};

export const LANGUAGE_OPTIONS = [
  {
    value: 'en',
    flag: '🇬🇧',
    shortLabel: 'EN',
    labelKey: 'common.language.english',
  },
  {
    value: 'id',
    flag: '🇮🇩',
    shortLabel: 'ID',
    labelKey: 'common.language.indonesian',
  },
] as const satisfies readonly LanguageOption[];

export function getLanguageOption(language: Language): LanguageOption {
  return (
    LANGUAGE_OPTIONS.find((option) => option.value === language) ??
    LANGUAGE_OPTIONS[0]
  );
}
