import type { SkillId } from '@/domain/skill/model';

export type SkillEvidenceSummary = {
  skillId: SkillId;
  entryCount: number;
};

export type GrowthEvidenceMap = {
  totalEntries: number;
  skills: SkillEvidenceSummary[];
};

export type SkillEvidenceEntry = {
  id: string;
  title: string;
  occurredAt: string;
  supportingText: string;
};
