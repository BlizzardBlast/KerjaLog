import { useLocalSearchParams } from 'expo-router';
import { isSkillId } from '@/domain/skill/model';
import { InvalidSkillEvidenceScreen } from '@/features/growth/InvalidSkillEvidenceScreen';
import { SkillEvidenceScreen } from '@/features/growth/SkillEvidenceScreen';

export default function SkillEvidenceRoute() {
  const { skillId } = useLocalSearchParams<{ skillId: string }>();

  if (!isSkillId(skillId)) {
    return <InvalidSkillEvidenceScreen />;
  }

  return <SkillEvidenceScreen skillId={skillId} />;
}
