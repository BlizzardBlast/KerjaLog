import * as Sentry from '@sentry/react-native';
import { useRouter } from 'expo-router';
import { useRef } from 'react';
import { Alert } from 'react-native';
import { workEntryDraftRepository } from '@/data/repositories/workEntryDraftRepository';
import type { WorkEntryDraft } from '@/domain/entry/draft';
import { skillDefinitionById } from '@/domain/skill/catalog';
import { CaptureTypeStep } from '@/features/work-entry/components/CaptureTypeStep';
import { EventStep } from '@/features/work-entry/components/EventStep';
import { EvidenceStep } from '@/features/work-entry/components/EvidenceStep';
import { ImpactStep } from '@/features/work-entry/components/ImpactStep';
import { InlineError } from '@/features/work-entry/components/InlineError';
import { LogSaveCompletionErrorScreen } from '@/features/work-entry/components/LogSaveCompletionErrorScreen';
import { OutcomeStep } from '@/features/work-entry/components/OutcomeStep';
import { SkillStep } from '@/features/work-entry/components/SkillStep';
import { WorkEntryWizardLayout } from '@/features/work-entry/components/WorkEntryWizardLayout';
import { createImpactBuilderCopy } from '@/features/work-entry/impactBuilderCopy';
import { useLogFlow } from '@/features/work-entry/useLogFlow';
import { usePersistedLogDraft } from '@/features/work-entry/usePersistedLogDraft';
import { useWizardNavigationGuard } from '@/features/work-entry/useWizardNavigationGuard';
import { useI18n } from '@/i18n/I18nProvider';

type LogFlowScreenProps = {
  initialDraft: WorkEntryDraft | null;
};

export function LogFlowScreen({ initialDraft }: LogFlowScreenProps) {
  const router = Sentry.wrapExpoRouter(useRouter());
  const { t } = useI18n();
  const draftPersistenceSuspendedRef = useRef(false);
  const impactCopy = createImpactBuilderCopy(t);
  const flow = useLogFlow({
    impactCopy,
    initialDraft,
    onExit: () => router.replace('/home'),
    prepareForCommit: async (draft) => {
      draftPersistenceSuspendedRef.current = true;

      try {
        await workEntryDraftRepository.saveActive(draft);
      } catch (error) {
        draftPersistenceSuspendedRef.current = false;
        throw error;
      }
    },
    onCommitFailed: () => {
      draftPersistenceSuspendedRef.current = false;
    },
    onSaved: (entry) => {
      allowNextRemoval();
      router.replace({ pathname: '/entry/[id]', params: { id: entry.id } });
    },
  });
  const draftPersistenceError = usePersistedLogDraft({
    draft: flow.draft,
    enabled: !flow.hasCommittedEntry,
    suspendedRef: draftPersistenceSuspendedRef,
  });

  const allowNextRemoval = useWizardNavigationGuard({
    hasUnsavedChanges: flow.hasUnsavedDraft,
    currentStep: flow.currentStep,
    isComplete: flow.hasCommittedEntry,
    onInternalBack: flow.goBack,
    onDiscard: async () => {
      draftPersistenceSuspendedRef.current = true;

      try {
        await workEntryDraftRepository.clearActive();
        return true;
      } catch {
        draftPersistenceSuspendedRef.current = false;
        Alert.alert(
          t('log.discard.clearErrorTitle'),
          t('log.discard.clearErrorDescription'),
        );
        return false;
      }
    },
    copy: {
      title: t('log.discard.title'),
      description: t('log.discard.description'),
      keepEditing: t('log.discard.keepEditing'),
      discard: t('log.discard.confirm'),
    },
  });

  if (flow.completionError) {
    return <LogSaveCompletionErrorScreen onRetry={flow.retryCompletion} />;
  }

  const frame = {
    backLabel: t('log.back'),
    currentStep: flow.currentStep,
    totalSteps: flow.totalSteps,
    progressLabel: t('log.step', {
      current: flow.currentStep,
      total: flow.totalSteps,
    }),
    onBack: flow.goBack,
  };
  const skillsSummary =
    flow.selectedSkills.length > 0
      ? flow.selectedSkills
          .map((skill) => t(skillDefinitionById[skill.id].nameKey))
          .join(' · ')
      : t('entry.skills.none');

  return (
    <WorkEntryWizardLayout stepKey={flow.step}>
      {draftPersistenceError ? (
        <InlineError>{t('log.draft.persistenceError')}</InlineError>
      ) : null}
      {flow.step === 'type' ? (
        <CaptureTypeStep
          {...frame}
          intent={flow.intent}
          onContinue={flow.continueFromType}
          onSelect={flow.selectIntent}
          t={t}
        />
      ) : null}
      {flow.step === 'event' ? (
        <EventStep
          {...frame}
          busy={flow.saving}
          noteError={flow.noteError}
          onContinue={flow.continueFromEvent}
          onRawNoteChange={flow.updateRawNote}
          quickSave={{ onPress: flow.saveQuick, hasError: flow.saveError }}
          rawNote={flow.rawNote}
          t={t}
        />
      ) : null}
      {flow.step === 'outcome' ? (
        <OutcomeStep
          {...frame}
          onContinue={flow.continueFromOutcome}
          onSelect={flow.selectOutcome}
          outcomeType={flow.outcomeType}
          t={t}
        />
      ) : null}
      {flow.step === 'evidence' ? (
        <EvidenceStep
          {...frame}
          evidenceDetail={flow.evidenceDetail}
          evidenceError={flow.evidenceError}
          evidenceTypes={flow.evidenceTypes}
          onContinue={flow.continueFromEvidence}
          onDetailChange={flow.updateEvidenceDetail}
          onSkip={flow.skipEvidence}
          onToggleType={flow.toggleEvidenceType}
          t={t}
        />
      ) : null}
      {flow.step === 'skills' ? (
        <SkillStep
          {...frame}
          onContinue={flow.continueToImpact}
          onToggle={flow.toggleSkill}
          selectedSkills={flow.selectedSkills}
          suggestedSkillIds={flow.suggestedSkillIds}
          t={t}
        />
      ) : null}
      {flow.step === 'impact' && flow.outcomeType ? (
        <ImpactStep
          {...frame}
          evidenceDetail={flow.evidenceDetail}
          impactStatement={flow.impactStatement}
          onImpactStatementChange={flow.updateImpactStatement}
          onSave={flow.saveDeveloped}
          outcomeType={flow.outcomeType}
          rawNote={flow.rawNote}
          saveError={flow.saveError}
          saving={flow.saving}
          skillsSummary={skillsSummary}
          t={t}
        />
      ) : null}
    </WorkEntryWizardLayout>
  );
}
