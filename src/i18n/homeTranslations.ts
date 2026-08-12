export const homeEn = {
  'home.thisWeek.entryCount': '{{count}} entries',
  'home.thisWeek.loading': 'Loading entries…',
  'home.recent.loading': 'Loading your recent work…',
  'home.workData.errorTitle': 'Your work entries could not be loaded',
  'home.workData.errorDescription':
    'Your saved data was not changed. Reopen KerjaLog and try again.',
} as const;

export type HomeTranslationKey = keyof typeof homeEn;

export const homeId: Record<HomeTranslationKey, string> = {
  'home.thisWeek.entryCount': '{{count}} catatan',
  'home.thisWeek.loading': 'Memuat catatan…',
  'home.recent.loading': 'Memuat pekerjaan terbaru Anda…',
  'home.workData.errorTitle': 'Catatan kerja Anda tidak dapat dimuat',
  'home.workData.errorDescription':
    'Data tersimpan Anda tidak diubah. Buka kembali KerjaLog dan coba lagi.',
};
