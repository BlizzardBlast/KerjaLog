export const preferenceEn = {
  'common.language.change': 'Change language',
  'common.language.english': 'English',
  'common.language.indonesian': 'Bahasa Indonesia',
} as const;

export type PreferenceTranslationKey = keyof typeof preferenceEn;

export const preferenceId: Record<PreferenceTranslationKey, string> = {
  'common.language.change': 'Ganti bahasa',
  'common.language.english': 'English',
  'common.language.indonesian': 'Bahasa Indonesia',
};
