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
  'onboarding.review.exactAlarmPermissionTitle':
    'Precise reminder access needed',
  'onboarding.review.exactAlarmPermissionDescription':
    'To remind you at the exact time you selected, allow KerjaLog to set alarms and reminders.',
  'onboarding.review.exactAlarmOpenSettings': 'Open Alarms & reminders',
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
  'onboarding.review.exactAlarmPermissionTitle':
    'Akses pengingat tepat waktu diperlukan',
  'onboarding.review.exactAlarmPermissionDescription':
    'Agar KerjaLog dapat mengingatkan tepat pada waktu yang Anda pilih, izinkan KerjaLog mengatur alarm dan pengingat.',
  'onboarding.review.exactAlarmOpenSettings': 'Buka Alarm & pengingat',
  'weekday.sunday': 'Minggu',
  'weekday.monday': 'Senin',
  'weekday.tuesday': 'Selasa',
  'weekday.wednesday': 'Rabu',
  'weekday.thursday': 'Kamis',
  'weekday.friday': 'Jumat',
  'weekday.saturday': 'Sabtu',
};
