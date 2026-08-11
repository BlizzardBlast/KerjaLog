import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { spacing } from '@/design-system/tokens/theme';
import type { WorkEntry } from '@/domain/entry/model';
import { CaptureTypeStep } from '@/features/work-entry/components/CaptureTypeStep';
import { EventStep } from '@/features/work-entry/components/EventStep';
import { EvidenceStep } from '@/features/work-entry/components/EvidenceStep';
import { ImpactStep } from '@/features/work-entry/components/ImpactStep';
import { OutcomeStep } from '@/features/work-entry/components/OutcomeStep';
import { createImpactBuilderCopy } from '@/features/work-entry/impactBuilderCopy';
import { useLogFlow } from '@/features/work-entry/useLogFlow';
import { useI18n } from '@/i18n/I18nProvider';

export function LogScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useI18n();
  const scrollRef = useRef<ScrollView>(null);
  const impactCopy = useMemo(() => createImpactBuilderCopy(t), [t]);
  const handleExit = useCallback(() => router.replace('/home'), [router]);
  const handleSaved = useCallback(
    (entry: WorkEntry) => {
      router.replace({ pathname: '/entry/[id]', params: { id: entry.id } });
    },
    [router],
  );
  const flow = useLogFlow({
    impactCopy,
    onExit: handleExit,
    onSaved: handleSaved,
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [flow.step]);

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
