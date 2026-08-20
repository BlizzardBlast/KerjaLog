import { View } from 'react-native';
import { Button } from '@/design-system/components/Button';
import { SKILL_CATALOG } from '@/domain/skill/catalog';
import type {
  EntrySkillSource,
  SkillId,
  WorkEntrySkill,
} from '@/domain/skill/model';
import { LogChoiceCard } from '@/features/work-entry/components/LogChoiceCard';
import { LogHeader } from '@/features/work-entry/components/LogHeader';
import type {
  LogStepFrameProps,
  Translate,
} from '@/features/work-entry/components/logStepTypes';
import { logStepStyles } from '@/features/work-entry/components/logStepStyles';

const skillById = new Map(SKILL_CATALOG.map((skill) => [skill.id, skill]));

type SkillStepProps = LogStepFrameProps & {
  selectedSkills: WorkEntrySkill[];
  suggestedSkillIds: SkillId[];
  onToggle: (skillId: SkillId, source: EntrySkillSource) => void;
  onContinue: () => void;
  t: Translate;
};

export function SkillStep({
  selectedSkills,
  suggestedSkillIds,
  onToggle,
  onContinue,
  t,
  ...frame
}: SkillStepProps) {
  const selectedIds = new Set(selectedSkills.map((skill) => skill.id));
  const suggestedIds = new Set(suggestedSkillIds);
  const orderedSkills = [
    ...suggestedSkillIds
      .map((id) => skillById.get(id))
      .filter((skill) => skill !== undefined),
    ...SKILL_CATALOG.filter((skill) => !suggestedIds.has(skill.id)),
  ];

  return (
    <>
      <LogHeader
        {...frame}
        eyebrow={t('entry.skills.eyebrow')}
        title={t('entry.skills.title')}
        description={t('entry.skills.description')}
      />
      <View style={logStepStyles.choiceList}>
        {orderedSkills.map((skill) => {
          const suggested = suggestedIds.has(skill.id);

          return (
            <LogChoiceCard
              key={skill.id}
              title={t(skill.nameKey)}
              description={
                suggested ? t('entry.skills.suggested') : undefined
              }
              selected={selectedIds.has(skill.id)}
              onPress={() => onToggle(skill.id, suggested ? 'rules' : 'user')}
              mode="multiple"
            />
          );
        })}
      </View>
      <Button fullWidth onPress={onContinue} size="lg">
        {t('entry.skills.continue')}
      </Button>
    </>
  );
}
