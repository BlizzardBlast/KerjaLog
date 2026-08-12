import { appLockEn, appLockId } from '@/i18n/appLockTranslations';
import { historyEn, historyId } from '@/i18n/historyTranslations';
import { homeEn, homeId } from '@/i18n/homeTranslations';
import { logDraftEn, logDraftId } from '@/i18n/logDraftTranslations';
import { logEn, logId } from '@/i18n/logTranslations';
import { reminderEn, reminderId } from '@/i18n/reminderTranslations';
import { en as baseEn, id as baseId } from '@/i18n/translations';

export const en = {
  ...baseEn,
  ...appLockEn,
  ...historyEn,
  ...homeEn,
  ...logEn,
  ...logDraftEn,
  ...reminderEn,
} as const;

export type TranslationKey = keyof typeof en;

export const id: Record<TranslationKey, string> = {
  ...baseId,
  ...appLockId,
  ...historyId,
  ...homeId,
  ...logId,
  ...logDraftId,
  ...reminderId,
};

export const translations = { en, id } as const;
