import type {
  GrowthEvidenceMap,
  SkillEvidenceEntry,
} from '@/domain/growth/model';
import type { SkillId } from '@/domain/skill/model';

export interface GrowthEvidenceReader {
  loadEvidenceMap(): Promise<GrowthEvidenceMap>;
  findSkillEvidence(skillId: SkillId): Promise<SkillEvidenceEntry[]>;
}
