import { appLockEn, appLockId } from '@/i18n/appLockTranslations';
import { homeEn, homeId } from '@/i18n/homeTranslations';
import { logEn, logId } from '@/i18n/logTranslations';
import { reminderEn, reminderId } from '@/i18n/reminderTranslations';
import { en as baseEn, id as baseId } from '@/i18n/translations';

export const en = {
  ...baseEn,
  ...appLockEn,
  ...homeEn,
  ...logEn,
  ...reminderEn,
} as const;

export type TranslationKey = keyof typeof en;

export const id: Record<TranslationKey, string> = {
  ...baseId,
  ...appLockId,
  ...homeId,
  ...logId,
  ...reminderId,
};

export const translations = { en, id } as const;
