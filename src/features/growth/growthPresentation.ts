import type { SkillId } from '@/domain/skill/model';
import type { TranslationKey } from '@/i18n/catalog';

const SKILL_DESCRIPTION_KEYS: Record<SkillId, TranslationKey> = {
  communication: 'growth.skill.communication.description',
  collaboration: 'growth.skill.collaboration.description',
  problem_solving: 'growth.skill.problemSolving.description',
  execution: 'growth.skill.execution.description',
  attention_to_detail: 'growth.skill.attentionToDetail.description',
  customer_orientation: 'growth.skill.customerOrientation.description',
  ownership: 'growth.skill.ownership.description',
  adaptability: 'growth.skill.adaptability.description',
  leadership: 'growth.skill.leadership.description',
  role_expertise: 'growth.skill.roleExpertise.description',
};

const SKILL_SYMBOLS: Record<SkillId, string> = {
  communication: '“',
  collaboration: '↔',
  problem_solving: '✦',
  execution: '✓',
  attention_to_detail: '◎',
  customer_orientation: '♡',
  ownership: '↑',
  adaptability: '↻',
  leadership: '◇',
  role_expertise: '⌘',
};

export function getGrowthSkillDescriptionKey(
  skillId: SkillId,
): TranslationKey {
  return SKILL_DESCRIPTION_KEYS[skillId];
}

export function getGrowthSkillSymbol(skillId: SkillId): string {
  return SKILL_SYMBOLS[skillId];
}

export function formatEvidenceDate(timestamp: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(timestamp));
}
