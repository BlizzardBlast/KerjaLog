export const reminderEn = {
  'common.action.cancel': 'Cancel',
  'common.action.done': 'Done',
  'onboarding.review.reminderDescription':
    'Choose a day and time for your weekly reflection reminder.',
  'onboarding.review.reminderDayLabel': 'Day',
  'onboarding.review.reminderTimeLabel': 'Time',
  'onboarding.review.reminderLocalTimeHint': 'Uses your device local time.',
  'onboarding.review.reminderDayAccessibility': 'Change reflection day',
  'onboarding.review.reminderTimeAccessibility': 'Change reflection time',
  'onboarding.review.reminderDayPickerTitle': 'Reflection day',
  'onboarding.review.reminderTimePickerTitle': 'Reflection time',
  'onboarding.review.inexactAlarmTitle': 'Using an approximate reminder time',
  'onboarding.review.inexactAlarmDescription':
    'KerjaLog will still remind you around the time you chose. Allow Alarms & reminders if you want the reminder to arrive at the exact time.',
  'onboarding.review.inexactAlarmOpenSettings': 'Use exact reminder time',
  'weekday.sunday': 'Sunday',
  'weekday.monday': 'Monday',
  'weekday.tuesday': 'Tuesday',
  'weekday.wednesday': 'Wednesday',
  'weekday.thursday': 'Thursday',
  'weekday.friday': 'Friday',
  'weekday.saturday': 'Saturday',
} as const;

export type ReminderTranslationKey = keyof typeof reminderEn;

export const reminderId: Record<ReminderTranslationKey, string> = {
  'common.action.cancel': 'Batal',
  'common.action.done': 'Selesai',
  'onboarding.review.reminderDescription':
    'Pilih hari dan waktu untuk pengingat refleksi mingguan Anda.',
  'onboarding.review.reminderDayLabel': 'Hari',
  'onboarding.review.reminderTimeLabel': 'Waktu',
  'onboarding.review.reminderLocalTimeHint':
    'Menggunakan waktu lokal perangkat Anda.',
  'onboarding.review.reminderDayAccessibility': 'Ubah hari refleksi',
  'onboarding.review.reminderTimeAccessibility': 'Ubah waktu refleksi',
  'onboarding.review.reminderDayPickerTitle': 'Hari refleksi',
  'onboarding.review.reminderTimePickerTitle': 'Waktu refleksi',
  'onboarding.review.inexactAlarmTitle':
    'Menggunakan waktu pengingat perkiraan',
  'onboarding.review.inexactAlarmDescription':
    'KerjaLog tetap akan mengingatkan sekitar waktu yang Anda pilih. Izinkan Alarm & pengingat jika Anda ingin pengingat muncul tepat pada waktunya.',
  'onboarding.review.inexactAlarmOpenSettings': 'Gunakan waktu pengingat tepat',
  'weekday.sunday': 'Minggu',
  'weekday.monday': 'Senin',
  'weekday.tuesday': 'Selasa',
  'weekday.wednesday': 'Rabu',
  'weekday.thursday': 'Kamis',
  'weekday.friday': 'Jumat',
  'weekday.saturday': 'Sabtu',
};
