import type { EntryStatus, EntryType } from '@/domain/entry/model';
import type { TranslationKey } from '@/i18n/catalog';

const ENTRY_TYPE_KEYS: Record<EntryType, TranslationKey> = {
  contribution: 'history.type.contribution',
  problem_solved: 'history.type.problemSolved',
  feedback: 'history.type.feedback',
  learning: 'history.type.learning',
  ownership: 'history.type.ownership',
  challenge: 'history.type.challenge',
};

const ENTRY_STATUS_KEYS: Record<EntryStatus, TranslationKey> = {
  quick_note: 'history.status.quickNote',
  developed: 'history.status.developed',
  review_ready: 'history.status.reviewReady',
};

export function getHistoryEntryTypeKey(type: EntryType): TranslationKey {
  return ENTRY_TYPE_KEYS[type];
}

export function getHistoryEntryStatusKey(status: EntryStatus): TranslationKey {
  return ENTRY_STATUS_KEYS[status];
}
