import { useRouter } from 'expo-router';
import { useRef } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { workEntryDraftRepository } from '@/data/repositories/workEntryDraftRepository';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { spacing } from '@/design-system/tokens/theme';
import type { WorkEntryDraft } from '@/domain/entry/draft';
import { CaptureTypeStep } from '@/features/work-entry/components/CaptureTypeStep';
import { EventStep } from '@/features/work-entry/components/EventStep';
import { EvidenceStep } from '@/features/work-entry/components/EvidenceStep';
import { ImpactStep } from '@/features/work-entry/components/ImpactStep';
import { InlineError } from '@/features/work-entry/components/InlineError';
import { LogSaveCompletionErrorScreen } from '@/features/work-entry/components/LogSaveCompletionErrorScreen';
import { OutcomeStep } from '@/features/work-entry/components/OutcomeStep';
import { createImpactBuilderCopy } from '@/features/work-entry/impactBuilderCopy';
import { useLogDraftNavigationGuard } from '@/features/work-entry/useLogDraftNavigationGuard';
import { useLogFlow } from '@/features/work-entry/useLogFlow';
import { usePersistedLogDraft } from '@/features/work-entry/usePersistedLogDraft';
import { useI18n } from '@/i18n/I18nProvider';

type LogFlowScreenProps = {
  initialDraft: WorkEntryDraft | null;
};

export function LogFlowScreen({ initialDraft }: LogFlowScreenProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useI18n();
  const scrollRef = useRef<ScrollView>(null);
  const allowNextRemovalRef = useRef(false);
  const impactCopy = createImpactBuilderCopy(t);
  const flow = useLogFlow({
    impactCopy,
    initialDraft,
    onExit: () => router.replace('/home'),
    onSaved: async (entry) => {
      await workEntryDraftRepository.clearActive();
      allowNextRemovalRef.current = true;

      try {
        router.replace({ pathname: '/entry/[id]', params: { id: entry.id } });
      } catch (error) {
        allowNextRemovalRef.current = false;
        throw error;
      }
    },
    onStepChanged: () => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    },
  });
  const draftPersistenceError = usePersistedLogDraft({
    draft: flow.draft,
    enabled: !flow.hasCommittedEntry,
  });

  useLogDraftNavigationGuard({
    hasUnsavedDraft: flow.hasUnsavedDraft,
    currentStep: flow.currentStep,
    onInternalBack: flow.goBack,
    onDiscard: async () => {
      try {
        await workEntryDraftRepository.clearActive();
        return true;
      } catch {
        Alert.alert(
          t('log.discard.clearErrorTitle'),
          t('log.discard.clearErrorDescription'),
        );
        return false;
      }
    },
    allowNextRemovalRef,
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
    onBack: flow.goBack,
  };

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.screen, { backgroundColor: theme.colors.surface }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.screen}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
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
              noteError={flow.noteError}
              onContinue={flow.continueFromEvent}
              onRawNoteChange={flow.updateRawNote}
              onSaveQuick={flow.saveQuick}
              rawNote={flow.rawNote}
              saveError={flow.saveError}
              saving={flow.saving}
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
              t={t}
            />
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    gap: spacing[5],
    paddingBottom: spacing[8],
    paddingHorizontal: 22,
    paddingTop: spacing[4],
  },
});
