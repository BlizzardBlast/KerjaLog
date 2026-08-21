import type { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import type { SkillId } from '@/domain/skill/model';
import type { TranslationKey } from '@/i18n/catalog';

export type GrowthSkillIcon = ComponentProps<typeof SymbolView>['name'];

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

const SKILL_ICONS: Record<SkillId, GrowthSkillIcon> = {
  communication: { ios: 'message.fill', android: 'chat', web: 'chat' },
  collaboration: { ios: 'person.2.fill', android: 'group', web: 'group' },
  problem_solving: {
    ios: 'lightbulb.fill',
    android: 'lightbulb',
    web: 'lightbulb',
  },
  execution: {
    ios: 'checkmark.circle.fill',
    android: 'check_circle',
    web: 'check_circle',
  },
  attention_to_detail: {
    ios: 'checkmark.seal.fill',
    android: 'fact_check',
    web: 'fact_check',
  },
  customer_orientation: {
    ios: 'heart.fill',
    android: 'favorite',
    web: 'favorite',
  },
  ownership: { ios: 'flag.fill', android: 'flag', web: 'flag' },
  adaptability: {
    ios: 'arrow.triangle.2.circlepath',
    android: 'sync',
    web: 'sync',
  },
  leadership: { ios: 'person.3.fill', android: 'groups', web: 'groups' },
  role_expertise: { ios: 'hammer.fill', android: 'build', web: 'build' },
};

export function getGrowthSkillDescriptionKey(skillId: SkillId): TranslationKey {
  return SKILL_DESCRIPTION_KEYS[skillId];
}

export function getGrowthSkillIcon(skillId: SkillId): GrowthSkillIcon {
  return SKILL_ICONS[skillId];
}

export function formatEvidenceDate(timestamp: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(timestamp));
}
