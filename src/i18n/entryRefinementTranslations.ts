export const entryRefinementEn = {
  'entry.refine.loading': 'Loading this entry…',
  'entry.refine.notFoundTitle': 'Entry not found',
  'entry.refine.notFoundDescription':
    'This work entry is no longer available on this device.',
  'entry.refine.errorTitle': 'Couldn’t open this entry',
  'entry.refine.errorDescription':
    'KerjaLog could not read this entry from encrypted storage. Please try again.',
  'entry.refine.retry': 'Try again',
  'entry.refine.back': 'Back',
  'entry.refine.discardTitle': 'Discard these changes?',
  'entry.refine.discardDescription':
    'Your saved entry will stay unchanged if you leave without saving.',
  'entry.refine.keepEditing': 'Keep editing',
  'entry.refine.discard': 'Discard changes',
  'entry.refine.type.eyebrow': 'Entry type',
  'entry.refine.type.title': 'What kind of work was this?',
  'entry.refine.type.description':
    'Choose the closest description. This only organizes your evidence; it does not score the work.',
  'entry.refine.type.contribution': 'I completed or helped with something',
  'entry.refine.type.problemSolved': 'I solved a problem',
  'entry.refine.type.feedback': 'I received feedback',
  'entry.refine.type.learning': 'I learned something',
  'entry.refine.type.ownership': 'I took responsibility',
  'entry.refine.type.challenge': 'Something became difficult',
  'entry.refine.type.continue': 'Review what happened',
  'entry.refine.skills.eyebrow': 'Career evidence',
  'entry.refine.skills.title': 'What does this demonstrate?',
  'entry.refine.skills.description':
    'KerjaLog can suggest broad skills from the facts you recorded. Confirm only what feels accurate.',
  'entry.refine.skills.suggested': 'Suggested from this entry',
  'entry.refine.skills.continue': 'Review my impact',
  'entry.refine.skills.none': 'No skills confirmed yet',
  'entry.refine.saveError':
    'KerjaLog could not update this entry. Your saved version is unchanged. Please try again.',
  'entry.saved.develop': 'Develop this entry',
  'entry.saved.edit': 'Edit entry',
  'entry.saved.whatDemonstrates': 'What this demonstrates',
} as const;

export type EntryRefinementTranslationKey = keyof typeof entryRefinementEn;

export const entryRefinementId: Record<EntryRefinementTranslationKey, string> =
  {
    'entry.refine.loading': 'Memuat catatan ini…',
    'entry.refine.notFoundTitle': 'Catatan tidak ditemukan',
    'entry.refine.notFoundDescription':
      'Catatan kerja ini sudah tidak tersedia di perangkat ini.',
    'entry.refine.errorTitle': 'Catatan tidak dapat dibuka',
    'entry.refine.errorDescription':
      'KerjaLog tidak dapat membaca catatan ini dari penyimpanan terenkripsi. Silakan coba lagi.',
    'entry.refine.retry': 'Coba lagi',
    'entry.refine.back': 'Kembali',
    'entry.refine.discardTitle': 'Buang perubahan ini?',
    'entry.refine.discardDescription':
      'Catatan yang sudah tersimpan tidak akan berubah jika Anda keluar tanpa menyimpan.',
    'entry.refine.keepEditing': 'Lanjut mengedit',
    'entry.refine.discard': 'Buang perubahan',
    'entry.refine.type.eyebrow': 'Jenis catatan',
    'entry.refine.type.title': 'Pekerjaan seperti apa ini?',
    'entry.refine.type.description':
      'Pilih deskripsi yang paling sesuai. Ini hanya mengatur bukti Anda, bukan menilai pekerjaan.',
    'entry.refine.type.contribution':
      'Saya menyelesaikan atau membantu sesuatu',
    'entry.refine.type.problemSolved': 'Saya menyelesaikan masalah',
    'entry.refine.type.feedback': 'Saya menerima feedback',
    'entry.refine.type.learning': 'Saya mempelajari sesuatu',
    'entry.refine.type.ownership': 'Saya mengambil tanggung jawab',
    'entry.refine.type.challenge': 'Sesuatu menjadi sulit',
    'entry.refine.type.continue': 'Tinjau yang terjadi',
    'entry.refine.skills.eyebrow': 'Bukti karier',
    'entry.refine.skills.title': 'Apa yang ditunjukkan oleh pekerjaan ini?',
    'entry.refine.skills.description':
      'KerjaLog dapat menyarankan keterampilan umum dari fakta yang Anda catat. Konfirmasi hanya yang menurut Anda akurat.',
    'entry.refine.skills.suggested': 'Disarankan dari catatan ini',
    'entry.refine.skills.continue': 'Tinjau dampak saya',
    'entry.refine.skills.none': 'Belum ada keterampilan yang dikonfirmasi',
    'entry.refine.saveError':
      'KerjaLog tidak dapat memperbarui catatan ini. Versi tersimpan Anda tidak berubah. Silakan coba lagi.',
    'entry.saved.develop': 'Kembangkan catatan ini',
    'entry.saved.edit': 'Edit catatan',
    'entry.saved.whatDemonstrates': 'Yang ditunjukkan pekerjaan ini',
  };
