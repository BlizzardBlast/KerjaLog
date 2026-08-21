export const growthEn = {
  'growth.eyebrow': 'Growth',
  'growth.title': 'Your evidence map',
  'growth.description':
    'This is not a performance score. It only shows where KerjaLog has recorded supporting examples.',
  'growth.summary.entries': '{{count}} work entries',
  'growth.summary.skillAreaOne': 'Evidence across 1 skill area',
  'growth.summary.skillAreaMany': 'Evidence across {{count}} skill areas',
  'growth.summary.hint': 'Tap a skill to see the real work behind it.',
  'growth.skill.entryOne': '1 entry',
  'growth.skill.entryMany': '{{count}} entries',
  'growth.skill.none': 'No evidence recorded yet',
  'growth.guidance.title': 'Nothing is “weak” here.',
  'growth.guidance.description':
    'Skills with no entries only mean KerjaLog has not recorded supporting evidence yet.',
  'growth.loading': 'Loading your evidence map',
  'growth.error.title': 'Your evidence map could not be loaded',
  'growth.error.description':
    'Your work entries are still stored locally. Try loading Growth again.',
  'growth.error.retry': 'Try Again',
  'growth.refreshError':
    'Growth could not refresh. The evidence shown below may be slightly out of date.',
  'growth.detail.eyebrow': 'Skill evidence',
  'growth.detail.supportingOne': '1 supporting entry',
  'growth.detail.supportingMany': '{{count}} supporting entries',
  'growth.detail.description':
    'These are the real work entries currently supporting this skill.',
  'growth.detail.coverageTitle': 'Evidence coverage, not a rating',
  'growth.detail.coverageDescription':
    'KerjaLog never converts these entries into a performance percentage, rank, or claim about your professional worth.',
  'growth.detail.openEntry': 'Open saved entry',
  'growth.detail.back': 'Back to Growth',
  'growth.detail.loading': 'Loading supporting evidence',
  'growth.detail.error.title': 'Supporting evidence could not be loaded',
  'growth.detail.error.description':
    'Your saved entries are still stored locally. Try loading this skill again.',
  'growth.detail.empty.title': 'No supporting entries yet',
  'growth.detail.empty.description':
    'This only means KerjaLog has not recorded confirmed evidence for this skill yet.',
  'growth.detail.invalid.title': 'Skill not found',
  'growth.detail.invalid.description':
    'This skill is not part of the current KerjaLog evidence map.',
  'growth.skill.communication.description':
    'Clear updates, feedback, and shared understanding',
  'growth.skill.collaboration.description':
    'Support and coordination with other people or teams',
  'growth.skill.problemSolving.description':
    'Errors, blockers, and root-cause checks',
  'growth.skill.execution.description': 'Deadlines and dependable delivery',
  'growth.skill.attentionToDetail.description':
    'Validation, accuracy, and careful checks',
  'growth.skill.customerOrientation.description':
    'Work that helped a customer or improved their outcome',
  'growth.skill.ownership.description':
    'Initiative, follow-through, and added responsibility',
  'growth.skill.adaptability.description':
    'Learning and adjusting when the work changes',
  'growth.skill.leadership.description':
    'Guidance, coordination, and positive influence',
  'growth.skill.roleExpertise.description':
    'Technical or role-specific capability shown in real work',
} as const;

export type GrowthTranslationKey = keyof typeof growthEn;

export const growthId: Record<GrowthTranslationKey, string> = {
  'growth.eyebrow': 'Perkembangan',
  'growth.title': 'Peta bukti Anda',
  'growth.description':
    'Ini bukan skor performa. Bagian ini hanya menunjukkan area yang sudah memiliki contoh pendukung di KerjaLog.',
  'growth.summary.entries': '{{count}} catatan kerja',
  'growth.summary.skillAreaOne': 'Bukti di 1 area keterampilan',
  'growth.summary.skillAreaMany': 'Bukti di {{count}} area keterampilan',
  'growth.summary.hint':
    'Ketuk keterampilan untuk melihat pekerjaan nyata di baliknya.',
  'growth.skill.entryOne': '1 catatan',
  'growth.skill.entryMany': '{{count}} catatan',
  'growth.skill.none': 'Belum ada bukti tercatat',
  'growth.guidance.title': 'Tidak ada yang “lemah” di sini.',
  'growth.guidance.description':
    'Keterampilan tanpa catatan hanya berarti KerjaLog belum memiliki bukti pendukung yang tercatat.',
  'growth.loading': 'Memuat peta bukti Anda',
  'growth.error.title': 'Peta bukti tidak dapat dimuat',
  'growth.error.description':
    'Catatan kerja Anda tetap tersimpan secara lokal. Coba muat kembali Perkembangan.',
  'growth.error.retry': 'Coba Lagi',
  'growth.refreshError':
    'Perkembangan tidak dapat diperbarui. Bukti di bawah mungkin sedikit tertinggal.',
  'growth.detail.eyebrow': 'Bukti keterampilan',
  'growth.detail.supportingOne': '1 catatan pendukung',
  'growth.detail.supportingMany': '{{count}} catatan pendukung',
  'growth.detail.description':
    'Berikut catatan kerja nyata yang saat ini mendukung keterampilan ini.',
  'growth.detail.coverageTitle': 'Cakupan bukti, bukan penilaian',
  'growth.detail.coverageDescription':
    'KerjaLog tidak mengubah catatan ini menjadi persentase performa, peringkat, atau klaim tentang nilai profesional Anda.',
  'growth.detail.openEntry': 'Buka catatan tersimpan',
  'growth.detail.back': 'Kembali ke Perkembangan',
  'growth.detail.loading': 'Memuat bukti pendukung',
  'growth.detail.error.title': 'Bukti pendukung tidak dapat dimuat',
  'growth.detail.error.description':
    'Catatan tersimpan Anda tetap ada secara lokal. Coba muat kembali keterampilan ini.',
  'growth.detail.empty.title': 'Belum ada catatan pendukung',
  'growth.detail.empty.description':
    'Ini hanya berarti KerjaLog belum mencatat bukti yang dikonfirmasi untuk keterampilan ini.',
  'growth.detail.invalid.title': 'Keterampilan tidak ditemukan',
  'growth.detail.invalid.description':
    'Keterampilan ini bukan bagian dari peta bukti KerjaLog saat ini.',
  'growth.skill.communication.description':
    'Pembaruan yang jelas, umpan balik, dan pemahaman bersama',
  'growth.skill.collaboration.description':
    'Dukungan dan koordinasi dengan orang atau tim lain',
  'growth.skill.problemSolving.description':
    'Kesalahan, hambatan, dan pemeriksaan akar masalah',
  'growth.skill.execution.description':
    'Tenggat waktu dan penyelesaian kerja yang dapat diandalkan',
  'growth.skill.attentionToDetail.description':
    'Validasi, akurasi, dan pemeriksaan yang teliti',
  'growth.skill.customerOrientation.description':
    'Pekerjaan yang membantu pelanggan atau memperbaiki hasil mereka',
  'growth.skill.ownership.description':
    'Inisiatif, tindak lanjut, dan tanggung jawab tambahan',
  'growth.skill.adaptability.description':
    'Belajar dan menyesuaikan diri saat pekerjaan berubah',
  'growth.skill.leadership.description':
    'Arahan, koordinasi, dan pengaruh yang positif',
  'growth.skill.roleExpertise.description':
    'Kemampuan teknis atau spesifik peran yang terlihat dari pekerjaan nyata',
};
