import type { EntryStatus, EntryType } from '@/domain/entry/model';
import type { SkillId } from '@/domain/skill/model';

export type SkillEvidenceSummary = {
  skillId: SkillId;
  entryCount: number;
  latestOccurredAt: string | null;
};

export type GrowthEvidenceMap = {
  totalEntries: number;
  skills: SkillEvidenceSummary[];
};

export type SkillEvidenceEntry = {
  id: string;
  title: string;
  type: EntryType;
  status: EntryStatus;
  occurredAt: string;
  supportingText: string;
};
