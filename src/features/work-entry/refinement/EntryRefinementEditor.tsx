import * as Sentry from '@sentry/react-native';
import { useRouter } from 'expo-router';
import type { WorkEntryDetail } from '@/domain/entry/model';
import { skillDefinitionById } from '@/domain/skill/catalog';
import { EventStep } from '@/features/work-entry/components/EventStep';
import { EvidenceStep } from '@/features/work-entry/components/EvidenceStep';
import { ImpactStep } from '@/features/work-entry/components/ImpactStep';
import { LogSaveCompletionErrorScreen } from '@/features/work-entry/components/LogSaveCompletionErrorScreen';
import { OutcomeStep } from '@/features/work-entry/components/OutcomeStep';
import { SkillStep } from '@/features/work-entry/components/SkillStep';
import { WorkEntryWizardLayout } from '@/features/work-entry/components/WorkEntryWizardLayout';
import { EntryTypeStep } from '@/features/work-entry/refinement/components/EntryTypeStep';
import { useEntryRefinement } from '@/features/work-entry/refinement/useEntryRefinement';
import { useWizardNavigationGuard } from '@/features/work-entry/useWizardNavigationGuard';
import { useI18n } from '@/i18n/I18nProvider';

type EntryRefinementEditorProps = {
  entry: WorkEntryDetail;
};

export function EntryRefinementEditor({ entry }: Readonly<EntryRefinementEditorProps>) {
  const router = Sentry.wrapExpoRouter(useRouter());
  const { t } = useI18n();
  const refinement = useEntryRefinement({
    entry,
    t,
    onSaved: (updatedEntry) => {
      allowNextRemoval();
      router.replace({
        pathname: '/entry/[id]',
        params: { id: updatedEntry.id },
      });
    },
  });

  const handleBack = () => {
    if (!refinement.goBack()) {
      router.back();
    }
  };

  const allowNextRemoval = useWizardNavigationGuard({
    hasUnsavedChanges: refinement.isDirty,
    currentStep: refinement.currentStep,
    isComplete: refinement.hasCommittedEntry,
    onInternalBack: handleBack,
    onDiscard: async () => true,
    copy: {
      title: t('entry.refine.discardTitle'),
      description: t('entry.refine.discardDescription'),
      keepEditing: t('entry.refine.keepEditing'),
      discard: t('entry.refine.discard'),
    },
  });

  if (refinement.completionError) {
    return (
      <LogSaveCompletionErrorScreen onRetry={refinement.retryCompletion} />
    );
  }

  const frame = {
    backLabel: t('entry.refine.back'),
    currentStep: refinement.currentStep,
    totalSteps: refinement.totalSteps,
    progressLabel: t('log.step', {
      current: refinement.currentStep,
      total: refinement.totalSteps,
    }),
    onBack: handleBack,
  };
  const skillsSummary =
    refinement.selectedSkills.length > 0
      ? refinement.selectedSkills
          .map((skill) => t(skillDefinitionById[skill.id].nameKey))
          .join(' · ')
      : t('entry.skills.none');

  return (
    <WorkEntryWizardLayout stepKey={refinement.step}>
      {refinement.step === 'type' ? (
        <EntryTypeStep
          {...frame}
          entryType={refinement.entryType}
          onContinue={() => refinement.setCurrentStep('event')}
          onSelect={refinement.selectEntryType}
          t={t}
        />
      ) : null}
      {refinement.step === 'event' ? (
        <EventStep
          {...frame}
          busy={refinement.isSubmitting}
          noteError={refinement.noteError}
          onContinue={refinement.continueFromEvent}
          onRawNoteChange={refinement.updateRawNote}
          rawNote={refinement.rawNote}
          t={t}
        />
      ) : null}
      {refinement.step === 'outcome' ? (
        <OutcomeStep
          {...frame}
          onContinue={() => refinement.setCurrentStep('evidence')}
          onSelect={refinement.selectOutcome}
          outcomeType={refinement.outcomeType}
          t={t}
        />
      ) : null}
      {refinement.step === 'evidence' ? (
        <EvidenceStep
          {...frame}
          evidenceDetail={refinement.evidenceDetail}
          evidenceError={refinement.evidenceError}
          evidenceTypes={refinement.evidenceTypes}
          onContinue={refinement.continueFromEvidence}
          onDetailChange={refinement.updateEvidenceDetail}
          onToggleType={refinement.toggleEvidenceType}
          t={t}
        />
      ) : null}
      {refinement.step === 'skills' ? (
        <SkillStep
          {...frame}
          onContinue={refinement.continueToImpact}
          onToggle={refinement.toggleSkill}
          selectedSkills={refinement.selectedSkills}
          suggestedSkillIds={refinement.suggestedSkillIds}
          t={t}
        />
      ) : null}
      {refinement.step === 'impact' && refinement.outcomeType ? (
        <ImpactStep
          {...frame}
          evidenceDetail={refinement.evidenceDetail}
          impactStatement={refinement.impactStatement}
          onImpactStatementChange={refinement.updateImpactStatement}
          onSave={() => {
            void refinement.submit();
          }}
          outcomeType={refinement.outcomeType}
          rawNote={refinement.rawNote}
          saveError={refinement.saveError}
          saveErrorMessage={t('entry.refine.saveError')}
          saving={refinement.isSubmitting}
          skillsSummary={skillsSummary}
          t={t}
        />
      ) : null}
    </WorkEntryWizardLayout>
  );
}
