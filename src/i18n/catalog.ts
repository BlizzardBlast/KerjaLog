import { reminderEn, reminderId } from '@/i18n/reminderTranslations';
import { en as baseEn, id as baseId } from '@/i18n/translations';

export const en = {
  ...baseEn,
  ...reminderEn,
} as const;

export type TranslationKey = keyof typeof en;

export const id: Record<TranslationKey, string> = {
  ...baseId,
  ...reminderId,
};

export const translations = { en, id } as const;
