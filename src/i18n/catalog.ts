import { appLockEn, appLockId } from '@/i18n/appLockTranslations';
import {
  entryRefinementEn,
  entryRefinementId,
} from '@/i18n/entryRefinementTranslations';
import { growthEn, growthId } from '@/i18n/growthTranslations';
import { historyEn, historyId } from '@/i18n/historyTranslations';
import { homeEn, homeId } from '@/i18n/homeTranslations';
import { logDraftEn, logDraftId } from '@/i18n/logDraftTranslations';
import { logEn, logId } from '@/i18n/logTranslations';
import {
  preferenceEn,
  preferenceId,
} from '@/i18n/preferenceTranslations';
import { reminderEn, reminderId } from '@/i18n/reminderTranslations';
import { skillEn, skillId } from '@/i18n/skillTranslations';
import { en as baseEn, id as baseId } from '@/i18n/translations';

export const en = {
  ...baseEn,
  ...appLockEn,
  ...entryRefinementEn,
  ...growthEn,
  ...historyEn,
  ...homeEn,
  ...logEn,
  ...logDraftEn,
  ...preferenceEn,
  ...reminderEn,
  ...skillEn,
} as const;

export type TranslationKey = keyof typeof en;

export const id: Record<TranslationKey, string> = {
  ...baseId,
  ...appLockId,
  ...entryRefinementId,
  ...growthId,
  ...historyId,
  ...homeId,
  ...logId,
  ...logDraftId,
  ...preferenceId,
  ...reminderId,
  ...skillId,
};

export const translations = { en, id } as const;
