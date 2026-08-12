export const appLockEn = {
  'appLock.setting.title': 'App lock',
  'appLock.setting.description':
    'Require biometrics or your device PIN/passcode before opening KerjaLog.',
  'appLock.setting.enabled': 'App lock is enabled on this device.',
  'appLock.setting.disabled': 'App lock is currently off.',
  'appLock.setting.unavailable':
    'Set up a device PIN/passcode or biometrics in system settings first.',
  'appLock.setting.failed': 'KerjaLog could not change the app lock setting.',
  'appLock.screen.eyebrow': 'Private by default',
  'appLock.screen.title': 'KerjaLog is locked',
  'appLock.screen.description':
    'Unlock with your enrolled biometrics or device PIN/passcode to continue.',
  'appLock.screen.unlock': 'Unlock KerjaLog',
  'appLock.screen.cancelled':
    'Authentication was cancelled. KerjaLog remains locked.',
  'appLock.screen.failed': 'Authentication failed. Try again.',
  'appLock.auth.prompt': 'Unlock KerjaLog',
  'appLock.auth.description':
    'Confirm that it is you to access your career log.',
  'appLock.auth.cancel': 'Cancel',
  'appLock.auth.fallback': 'Use device passcode',
} as const;

export type AppLockTranslationKey = keyof typeof appLockEn;

export const appLockId: Record<AppLockTranslationKey, string> = {
  'appLock.setting.title': 'Kunci aplikasi',
  'appLock.setting.description':
    'Minta biometrik atau PIN/kode sandi perangkat sebelum membuka KerjaLog.',
  'appLock.setting.enabled': 'Kunci aplikasi aktif di perangkat ini.',
  'appLock.setting.disabled': 'Kunci aplikasi saat ini nonaktif.',
  'appLock.setting.unavailable':
    'Atur PIN/kode sandi perangkat atau biometrik di pengaturan sistem terlebih dahulu.',
  'appLock.setting.failed':
    'KerjaLog tidak dapat mengubah pengaturan kunci aplikasi.',
  'appLock.screen.eyebrow': 'Privat secara default',
  'appLock.screen.title': 'KerjaLog terkunci',
  'appLock.screen.description':
    'Buka dengan biometrik atau PIN/kode sandi perangkat yang sudah terdaftar untuk melanjutkan.',
  'appLock.screen.unlock': 'Buka KerjaLog',
  'appLock.screen.cancelled':
    'Autentikasi dibatalkan. KerjaLog tetap terkunci.',
  'appLock.screen.failed': 'Autentikasi gagal. Coba lagi.',
  'appLock.auth.prompt': 'Buka KerjaLog',
  'appLock.auth.description':
    'Konfirmasi identitas Anda untuk mengakses catatan karier.',
  'appLock.auth.cancel': 'Batal',
  'appLock.auth.fallback': 'Gunakan kode sandi perangkat',
};
