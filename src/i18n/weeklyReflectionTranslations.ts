export const weeklyReflectionEn = {
  'reflection.eyebrow': 'Weekly reflection',
  'reflection.title': 'Remember the work that almost disappeared',
  'reflection.description':
    'Take a few minutes to recover useful moments from this week. Every prompt is optional.',
  'reflection.progress': 'Prompt {{current}} of {{total}}',
  'reflection.prompt.moved_forward': 'What did you finish or move forward?',
  'reflection.prompt.helped': 'Who did you help?',
  'reflection.prompt.problem': 'What problem did you handle?',
  'reflection.prompt.learned': 'What did you learn?',
  'reflection.placeholder.moved_forward': 'A task, project, or follow-up…',
  'reflection.placeholder.helped': 'A colleague, team, or customer…',
  'reflection.placeholder.problem': 'An error, blocker, delay, or risk…',
  'reflection.placeholder.learned': 'A process, tool, lesson, or new approach…',
  'reflection.privacy':
    'Avoid passwords, account numbers, customer personal data, confidential documents, or company secrets.',
  'reflection.skip': 'Skip',
  'reflection.continue': 'Continue',
  'reflection.finish': 'Review answers',
  'reflection.close': 'Close reflection',
  'reflection.summary.eyebrow': 'Reflection complete',
  'reflection.summary.title': 'Choose what is worth logging',
  'reflection.summary.description':
    'Nothing is saved as a work entry until you choose Log this. You can also leave without logging anything.',
  'reflection.summary.emptyTitle': 'Nothing to log right now',
  'reflection.summary.emptyDescription':
    'That is okay. Reflection is here to help you remember, not to create pressure.',
  'reflection.summary.logThis': 'Log this',
  'reflection.summary.logPrompt': 'Log answer for {{prompt}}',
  'reflection.summary.backHome': 'Back to Home',
  'reflection.handoff.activeDraftTitle':
    'You already have an unfinished work entry',
  'reflection.handoff.activeDraftDescription':
    'Finish or discard the current draft before sending another reflection answer to Log.',
  'reflection.handoff.openDraft': 'Open current draft',
  'reflection.handoff.error':
    'KerjaLog could not prepare this answer for Log. Your reflection answer is still on this screen.',
} as const;

export type WeeklyReflectionTranslationKey = keyof typeof weeklyReflectionEn;

export const weeklyReflectionId: Record<
  WeeklyReflectionTranslationKey,
  string
> = {
  'reflection.eyebrow': 'Refleksi mingguan',
  'reflection.title': 'Ingat kembali pekerjaan yang hampir terlupakan',
  'reflection.description':
    'Luangkan beberapa menit untuk mengingat momen berguna dari minggu ini. Semua pertanyaan boleh dilewati.',
  'reflection.progress': 'Pertanyaan {{current}} dari {{total}}',
  'reflection.prompt.moved_forward': 'Apa yang Anda selesaikan atau majukan?',
  'reflection.prompt.helped': 'Siapa yang Anda bantu?',
  'reflection.prompt.problem': 'Masalah apa yang Anda tangani?',
  'reflection.prompt.learned': 'Apa yang Anda pelajari?',
  'reflection.placeholder.moved_forward': 'Tugas, proyek, atau tindak lanjut…',
  'reflection.placeholder.helped': 'Rekan, tim, atau pelanggan…',
  'reflection.placeholder.problem':
    'Kesalahan, hambatan, keterlambatan, atau risiko…',
  'reflection.placeholder.learned':
    'Proses, alat, pelajaran, atau pendekatan baru…',
  'reflection.privacy':
    'Hindari kata sandi, nomor rekening, data pribadi pelanggan, dokumen rahasia, atau rahasia perusahaan.',
  'reflection.skip': 'Lewati',
  'reflection.continue': 'Lanjutkan',
  'reflection.finish': 'Tinjau jawaban',
  'reflection.close': 'Tutup refleksi',
  'reflection.summary.eyebrow': 'Refleksi selesai',
  'reflection.summary.title': 'Pilih yang layak dicatat',
  'reflection.summary.description':
    'Belum ada yang disimpan sebagai catatan kerja sampai Anda memilih Catat ini. Anda juga boleh keluar tanpa mencatat apa pun.',
  'reflection.summary.emptyTitle': 'Belum ada yang perlu dicatat',
  'reflection.summary.emptyDescription':
    'Tidak masalah. Refleksi membantu Anda mengingat, bukan memberi tekanan.',
  'reflection.summary.logThis': 'Catat ini',
  'reflection.summary.logPrompt': 'Catat jawaban untuk {{prompt}}',
  'reflection.summary.backHome': 'Kembali ke Beranda',
  'reflection.handoff.activeDraftTitle':
    'Anda masih punya catatan kerja yang belum selesai',
  'reflection.handoff.activeDraftDescription':
    'Selesaikan atau hapus draf saat ini sebelum mengirim jawaban refleksi lain ke alur Catat.',
  'reflection.handoff.openDraft': 'Buka draf saat ini',
  'reflection.handoff.error':
    'KerjaLog tidak dapat menyiapkan jawaban ini untuk alur Catat. Jawaban refleksi Anda masih ada di layar ini.',
};
