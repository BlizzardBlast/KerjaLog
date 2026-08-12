export const logDraftEn = {
  'log.discard.clearErrorTitle': "Couldn't discard draft",
  'log.discard.clearErrorDescription':
    "KerjaLog couldn't remove the encrypted draft. Try again so it doesn't reappear later.",
  'log.draft.loading': 'Restoring your draft…',
  'log.draft.loadErrorTitle': "Couldn't restore this draft",
  'log.draft.loadErrorDescription':
    "KerjaLog couldn't read the encrypted draft. Retry before starting a new entry so recoverable work isn't overwritten.",
  'log.draft.persistenceError':
    "KerjaLog couldn't update the encrypted draft backup. Keep the app open and try again before leaving.",
  'log.completion.title': 'Your entry is saved',
  'log.completion.description':
    "The entry was saved to encrypted storage, but KerjaLog couldn't finish opening it. Retry without saving a duplicate.",
  'log.completion.retry': 'Open saved entry',
} as const;

export type LogDraftTranslationKey = keyof typeof logDraftEn;

export const logDraftId: Record<LogDraftTranslationKey, string> = {
  'log.discard.clearErrorTitle': 'Draf tidak dapat dibuang',
  'log.discard.clearErrorDescription':
    'KerjaLog tidak dapat menghapus draf terenkripsi. Coba lagi agar draf tidak muncul kembali nanti.',
  'log.draft.loading': 'Memulihkan draf Anda…',
  'log.draft.loadErrorTitle': 'Draf tidak dapat dipulihkan',
  'log.draft.loadErrorDescription':
    'KerjaLog tidak dapat membaca draf terenkripsi. Coba lagi sebelum membuat catatan baru agar pekerjaan yang masih dapat dipulihkan tidak tertimpa.',
  'log.draft.persistenceError':
    'KerjaLog tidak dapat memperbarui cadangan draf terenkripsi. Biarkan aplikasi tetap terbuka dan coba lagi sebelum keluar.',
  'log.completion.title': 'Catatan Anda sudah tersimpan',
  'log.completion.description':
    'Catatan sudah tersimpan di penyimpanan terenkripsi, tetapi KerjaLog tidak dapat menyelesaikan pembukaannya. Coba lagi tanpa menyimpan catatan duplikat.',
  'log.completion.retry': 'Buka catatan tersimpan',
};
