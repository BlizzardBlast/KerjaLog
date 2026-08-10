export const logEn = {
  'log.back': 'Back',
  'log.step': 'Step {{current}} of {{total}}',
  'log.capture.eyebrow': 'Quick capture',
  'log.capture.title': 'What happened at work?',
  'log.capture.description': 'Choose the closest match. Small work counts.',
  'log.capture.continue': 'Describe what happened',

  'log.intent.completed.title': 'I completed something',
  'log.intent.completed.description':
    'A task, report, deliverable, or milestone moved forward.',
  'log.intent.solved.title': 'I solved a problem',
  'log.intent.solved.description':
    'An error, blocker, delay, or recurring issue was handled.',
  'log.intent.helped.title': 'I helped someone',
  'log.intent.helped.description':
    'A colleague, team, or customer could move forward.',
  'log.intent.feedback.title': 'I received feedback',
  'log.intent.feedback.description':
    'Praise, coaching, recognition, or an important comment.',
  'log.intent.learned.title': 'I learned something',
  'log.intent.learned.description':
    'A tool, process, lesson, or new way of working.',
  'log.intent.ownership.title': 'I took responsibility',
  'log.intent.ownership.description':
    'A new responsibility, initiative, or ownership moment.',
  'log.intent.challenge.title': 'Something became difficult',
  'log.intent.challenge.description':
    'A private challenge, mistake, setback, or unresolved blocker. Kept out of exports by default.',

  'log.event.eyebrow': 'The event',
  'log.event.title': 'What happened?',
  'log.event.label': 'Write it the way you remember it',
  'log.event.placeholder':
    'Example: I found duplicate entries while checking the monthly report and corrected them before submission.',
  'log.event.help':
    'You do not need professional wording. KerjaLog can structure the facts later.',
  'log.event.privacyTitle': 'Keep confidential data out',
  'log.event.privacyDescription':
    'Do not include passwords, customer personal data, account numbers, confidential documents, or company secrets.',
  'log.event.saveQuick': 'Save as quick note',
  'log.event.continue': 'Find the outcome',
  'log.event.required': 'Add a short note before continuing.',

  'log.outcome.eyebrow': 'The outcome',
  'log.outcome.title': 'What changed because of this?',
  'log.outcome.description':
    'Choose what you know now. “I’m not sure yet” is a valid answer.',
  'log.outcome.continue': 'Add supporting evidence',
  'log.outcome.errorFixed.title': 'An error was fixed or prevented',
  'log.outcome.errorFixed.description':
    'The work became more accurate or avoided a mistake.',
  'log.outcome.deadlineMet.title': 'A deadline was met',
  'log.outcome.workFaster.title': 'Work became faster',
  'log.outcome.workClearer.title': 'Work became clearer',
  'log.outcome.personHelped.title': 'A customer or colleague was helped',
  'log.outcome.riskReduced.title': 'A risk was reduced',
  'log.outcome.decisionEnabled.title': 'A decision became possible',
  'log.outcome.skillGained.title': 'I gained a new skill',
  'log.outcome.unsure.title': 'I’m not sure yet',
  'log.outcome.unsure.description':
    'Save it now. KerjaLog can revisit the outcome later.',

  'log.evidence.eyebrow': 'Optional evidence',
  'log.evidence.title': 'Do you have a useful detail?',
  'log.evidence.description':
    'Numbers help sometimes, but deadlines, feedback, and people helped count too.',
  'log.evidence.number.title': 'A number',
  'log.evidence.deadline.title': 'A deadline',
  'log.evidence.result.title': 'A result',
  'log.evidence.feedback.title': 'Feedback received',
  'log.evidence.peopleHelped.title': 'People or teams helped',
  'log.evidence.referenceLink.title': 'A reference link',
  'log.evidence.supportingNote.title': 'A supporting note',
  'log.evidence.detailLabel': 'Useful detail',
  'log.evidence.detailPlaceholder':
    'Example: 7 duplicate entries were removed before the report was submitted.',
  'log.evidence.detailHelp':
    'Select at least one evidence type if you add a detail.',
  'log.evidence.skip': 'Skip evidence',
  'log.evidence.continue': 'Preview my impact',

  'log.impact.eyebrow': 'Impact Builder',
  'log.impact.title': 'See the value inside the work',
  'log.impact.description':
    'This suggestion only uses facts you wrote or choices you confirmed.',
  'log.impact.whatHappened': 'What happened',
  'log.impact.whatChanged': 'What changed',
  'log.impact.whatSupports': 'What supports it',
  'log.impact.notKnown': 'Not confirmed yet',
  'log.impact.noEvidence': 'No evidence added yet',
  'log.impact.originalNote': 'Your original note',
  'log.impact.suggestion': 'Structured impact statement',
  'log.impact.groundedTitle': 'No invented impact',
  'log.impact.groundedDescription':
    'KerjaLog has not added a number, responsibility, person helped, or business result that you did not provide.',
  'log.impact.outcomePrefix': 'Outcome',
  'log.impact.evidencePrefix': 'Evidence',
  'log.impact.editLabel': 'Edit the statement before saving',
  'log.impact.confirm': 'Confirm & save',
  'log.impact.saveError': 'KerjaLog could not save this entry. Please try again.',

  'log.saved.eyebrow': 'Saved work entry',
  'log.saved.loading': 'Loading your entry…',
  'log.saved.notFoundTitle': 'Entry not found',
  'log.saved.notFoundDescription':
    'This work entry could not be loaded from this device.',
  'log.saved.backHome': 'Back to Home',
  'log.saved.private': 'Private by default',
  'log.saved.quickNote': 'Quick note',
  'log.saved.developed': 'Developed',
  'log.saved.reviewReady': 'Review ready',
  'log.saved.originalNote': 'Original note',
  'log.saved.outcome': 'Outcome',
  'log.saved.evidence': 'Evidence',
  'log.saved.impact': 'Impact statement',
} as const;

export type LogTranslationKey = keyof typeof logEn;

export const logId: Record<LogTranslationKey, string> = {
  'log.back': 'Kembali',
  'log.step': 'Langkah {{current}} dari {{total}}',
  'log.capture.eyebrow': 'Catat cepat',
  'log.capture.title': 'Apa yang terjadi di pekerjaan?',
  'log.capture.description': 'Pilih yang paling sesuai. Pekerjaan kecil juga berarti.',
  'log.capture.continue': 'Ceritakan yang terjadi',

  'log.intent.completed.title': 'Saya menyelesaikan sesuatu',
  'log.intent.completed.description':
    'Tugas, laporan, hasil kerja, atau milestone bergerak maju.',
  'log.intent.solved.title': 'Saya menyelesaikan masalah',
  'log.intent.solved.description':
    'Error, hambatan, keterlambatan, atau masalah berulang berhasil ditangani.',
  'log.intent.helped.title': 'Saya membantu seseorang',
  'log.intent.helped.description':
    'Rekan kerja, tim, atau pelanggan dapat melanjutkan pekerjaannya.',
  'log.intent.feedback.title': 'Saya menerima feedback',
  'log.intent.feedback.description':
    'Pujian, coaching, pengakuan, atau komentar penting.',
  'log.intent.learned.title': 'Saya mempelajari sesuatu',
  'log.intent.learned.description':
    'Alat, proses, pelajaran, atau cara kerja baru.',
  'log.intent.ownership.title': 'Saya mengambil tanggung jawab',
  'log.intent.ownership.description':
    'Tanggung jawab, inisiatif, atau momen ownership baru.',
  'log.intent.challenge.title': 'Sesuatu menjadi sulit',
  'log.intent.challenge.description':
    'Tantangan pribadi, kesalahan, kemunduran, atau hambatan yang belum selesai. Tidak masuk ekspor secara default.',

  'log.event.eyebrow': 'Kejadian',
  'log.event.title': 'Apa yang terjadi?',
  'log.event.label': 'Tulis seperti yang Anda ingat',
  'log.event.placeholder':
    'Contoh: Saya menemukan entri duplikat saat memeriksa laporan bulanan dan memperbaikinya sebelum laporan dikirim.',
  'log.event.help':
    'Tidak perlu menggunakan bahasa profesional. KerjaLog dapat membantu menyusun faktanya nanti.',
  'log.event.privacyTitle': 'Jangan masukkan data rahasia',
  'log.event.privacyDescription':
    'Jangan masukkan kata sandi, data pribadi pelanggan, nomor rekening, dokumen rahasia, atau rahasia perusahaan.',
  'log.event.saveQuick': 'Simpan sebagai catatan cepat',
  'log.event.continue': 'Temukan hasilnya',
  'log.event.required': 'Tambahkan catatan singkat sebelum melanjutkan.',

  'log.outcome.eyebrow': 'Hasil',
  'log.outcome.title': 'Apa yang berubah karena pekerjaan ini?',
  'log.outcome.description':
    'Pilih yang Anda ketahui sekarang. “Saya belum yakin” adalah jawaban yang valid.',
  'log.outcome.continue': 'Tambahkan bukti pendukung',
  'log.outcome.errorFixed.title': 'Kesalahan diperbaiki atau dicegah',
  'log.outcome.errorFixed.description':
    'Pekerjaan menjadi lebih akurat atau kesalahan dapat dihindari.',
  'log.outcome.deadlineMet.title': 'Deadline terpenuhi',
  'log.outcome.workFaster.title': 'Pekerjaan menjadi lebih cepat',
  'log.outcome.workClearer.title': 'Pekerjaan menjadi lebih jelas',
  'log.outcome.personHelped.title': 'Pelanggan atau rekan kerja terbantu',
  'log.outcome.riskReduced.title': 'Risiko berkurang',
  'log.outcome.decisionEnabled.title': 'Keputusan menjadi memungkinkan',
  'log.outcome.skillGained.title': 'Saya memperoleh keterampilan baru',
  'log.outcome.unsure.title': 'Saya belum yakin',
  'log.outcome.unsure.description':
    'Simpan sekarang. KerjaLog dapat meninjau hasilnya lagi nanti.',

  'log.evidence.eyebrow': 'Bukti opsional',
  'log.evidence.title': 'Apakah ada detail yang berguna?',
  'log.evidence.description':
    'Angka kadang membantu, tetapi deadline, feedback, dan orang yang terbantu juga termasuk bukti.',
  'log.evidence.number.title': 'Sebuah angka',
  'log.evidence.deadline.title': 'Sebuah deadline',
  'log.evidence.result.title': 'Sebuah hasil',
  'log.evidence.feedback.title': 'Feedback yang diterima',
  'log.evidence.peopleHelped.title': 'Orang atau tim yang terbantu',
  'log.evidence.referenceLink.title': 'Tautan referensi',
  'log.evidence.supportingNote.title': 'Catatan pendukung',
  'log.evidence.detailLabel': 'Detail yang berguna',
  'log.evidence.detailPlaceholder':
    'Contoh: 7 entri duplikat dihapus sebelum laporan dikirim.',
  'log.evidence.detailHelp':
    'Pilih setidaknya satu jenis bukti jika Anda menambahkan detail.',
  'log.evidence.skip': 'Lewati bukti',
  'log.evidence.continue': 'Pratinjau dampak saya',

  'log.impact.eyebrow': 'Impact Builder',
  'log.impact.title': 'Lihat nilai di balik pekerjaan',
  'log.impact.description':
    'Saran ini hanya menggunakan fakta yang Anda tulis atau pilihan yang Anda konfirmasi.',
  'log.impact.whatHappened': 'Apa yang terjadi',
  'log.impact.whatChanged': 'Apa yang berubah',
  'log.impact.whatSupports': 'Apa bukti pendukungnya',
  'log.impact.notKnown': 'Belum dikonfirmasi',
  'log.impact.noEvidence': 'Belum ada bukti yang ditambahkan',
  'log.impact.originalNote': 'Catatan asli Anda',
  'log.impact.suggestion': 'Pernyataan dampak terstruktur',
  'log.impact.groundedTitle': 'Tidak mengarang dampak',
  'log.impact.groundedDescription':
    'KerjaLog tidak menambahkan angka, tanggung jawab, orang yang terbantu, atau hasil bisnis yang tidak Anda berikan.',
  'log.impact.outcomePrefix': 'Hasil',
  'log.impact.evidencePrefix': 'Bukti',
  'log.impact.editLabel': 'Edit pernyataan sebelum menyimpan',
  'log.impact.confirm': 'Konfirmasi & simpan',
  'log.impact.saveError': 'KerjaLog tidak dapat menyimpan catatan ini. Coba lagi.',

  'log.saved.eyebrow': 'Catatan kerja tersimpan',
  'log.saved.loading': 'Memuat catatan Anda…',
  'log.saved.notFoundTitle': 'Catatan tidak ditemukan',
  'log.saved.notFoundDescription':
    'Catatan kerja ini tidak dapat dimuat dari perangkat ini.',
  'log.saved.backHome': 'Kembali ke Beranda',
  'log.saved.private': 'Privat secara default',
  'log.saved.quickNote': 'Catatan cepat',
  'log.saved.developed': 'Dikembangkan',
  'log.saved.reviewReady': 'Siap untuk review',
  'log.saved.originalNote': 'Catatan asli',
  'log.saved.outcome': 'Hasil',
  'log.saved.evidence': 'Bukti',
  'log.saved.impact': 'Pernyataan dampak',
};
