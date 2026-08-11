import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { spacing } from '@/design-system/tokens/theme';
import {
  buildImpactStatement,
  hasIncompleteEvidence,
  type ImpactBuilderCopy,
  type LogEventIntent,
} from '@/domain/entry/impact';
import type { EvidenceType, OutcomeType } from '@/domain/entry/model';
import {
  CaptureTypeStep,
  EventStep,
  EvidenceStep,
  ImpactStep,
  OutcomeStep,
} from '@/features/work-entry/components/LogSteps';
import { saveWorkEntry } from '@/features/work-entry/saveWorkEntry';
import type { TranslationKey } from '@/i18n/catalog';
import { useI18n } from '@/i18n/I18nProvider';

const STEPS = ['type', 'event', 'outcome', 'evidence', 'impact'] as const;
type LogStep = (typeof STEPS)[number];

type Translate = (
  key: TranslationKey,
  params?: Record<string, string | number>,
) => string;

export function LogScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useI18n();
  const scrollRef = useRef<ScrollView>(null);
  const [step, setStep] = useState<LogStep>('type');
  const [intent, setIntent] = useState<LogEventIntent | null>(null);
  const [rawNote, setRawNote] = useState('');
  const [outcomeType, setOutcomeType] = useState<OutcomeType | null>(null);
  const [evidenceTypes, setEvidenceTypes] = useState<EvidenceType[]>([]);
  const [evidenceDetail, setEvidenceDetail] = useState('');
  const [impactStatement, setImpactStatement] = useState('');
  const [noteError, setNoteError] = useState(false);
  const [evidenceError, setEvidenceError] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [saving, setSaving] = useState(false);
  const currentStep = STEPS.indexOf(step) + 1;
  const frame = {
    backLabel: t('log.back'),
    currentStep,
    totalSteps: STEPS.length,
    onBack: goBack,
  };

  function moveToStep(nextStep: LogStep) {
    setStep(nextStep);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }

  function goBack() {
    const currentIndex = STEPS.indexOf(step);
    if (currentIndex <= 0) {
      router.replace('/home');
      return;
    }

    moveToStep(STEPS[currentIndex - 1]);
  }

  function updateRawNote(value: string) {
    setRawNote(value);
    if (value.trim()) {
      setNoteError(false);
    }
  }

  function goToOutcome() {
    if (!rawNote.trim()) {
      setNoteError(true);
      return;
    }

    setNoteError(false);
    moveToStep('outcome');
  }

  function toggleEvidenceType(type: EvidenceType) {
    setEvidenceTypes((current) =>
      current.includes(type)
        ? current.filter((candidate) => candidate !== type)
        : [...current, type],
    );
    setEvidenceError(false);
  }

  function updateEvidenceDetail(value: string) {
    setEvidenceDetail(value);
    if (!hasIncompleteEvidence(evidenceTypes, value)) {
      setEvidenceError(false);
    }
  }

  function goToImpact(skipEvidence = false) {
    if (!intent || !outcomeType) {
      return;
    }

    const nextEvidenceTypes = skipEvidence ? [] : evidenceTypes;
    const nextEvidenceDetail = skipEvidence ? '' : evidenceDetail;

    if (hasIncompleteEvidence(nextEvidenceTypes, nextEvidenceDetail)) {
      setEvidenceError(true);
      return;
    }

    if (skipEvidence) {
      setEvidenceTypes([]);
      setEvidenceDetail('');
    }

    setEvidenceError(false);
    setImpactStatement(
      buildImpactStatement(
        {
          intent,
          rawNote,
          outcomeType,
          evidenceDetail: nextEvidenceDetail,
        },
        createImpactBuilderCopy(t),
      ),
    );
    moveToStep('impact');
  }

  async function save(quickNote: boolean) {
    if (!intent || !rawNote.trim()) {
      setNoteError(true);
      return;
    }

    if (!quickNote && !outcomeType) {
      return;
    }

    setSaving(true);
    setSaveError(false);

    try {
      const entry = await saveWorkEntry({
        intent,
        rawNote,
        outcomeType: quickNote ? null : outcomeType,
        evidenceTypes: quickNote ? [] : evidenceTypes,
        evidenceDetail: quickNote ? '' : evidenceDetail,
        impactStatement: quickNote ? null : impactStatement,
      });

      router.replace({ pathname: '/entry/[id]', params: { id: entry.id } });
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }

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
          {step === 'type' ? (
            <CaptureTypeStep
              {...frame}
              intent={intent}
              onContinue={() => moveToStep('event')}
              onSelect={setIntent}
              t={t}
            />
          ) : null}
          {step === 'event' ? (
            <EventStep
              {...frame}
              noteError={noteError}
              onContinue={goToOutcome}
              onRawNoteChange={updateRawNote}
              onSaveQuick={() => save(true)}
              rawNote={rawNote}
              saveError={saveError}
              saving={saving}
              t={t}
            />
          ) : null}
          {step === 'outcome' ? (
            <OutcomeStep
              {...frame}
              onContinue={() => moveToStep('evidence')}
              onSelect={setOutcomeType}
              outcomeType={outcomeType}
              t={t}
            />
          ) : null}
          {step === 'evidence' ? (
            <EvidenceStep
              {...frame}
              evidenceDetail={evidenceDetail}
              evidenceError={evidenceError}
              evidenceTypes={evidenceTypes}
              onContinue={() => goToImpact(false)}
              onDetailChange={updateEvidenceDetail}
              onSkip={() => goToImpact(true)}
              onToggleType={toggleEvidenceType}
              t={t}
            />
          ) : null}
          {step === 'impact' && outcomeType ? (
            <ImpactStep
              {...frame}
              evidenceDetail={evidenceDetail}
              impactStatement={impactStatement}
              onImpactStatementChange={setImpactStatement}
              onSave={() => save(false)}
              outcomeType={outcomeType}
              rawNote={rawNote}
              saveError={saveError}
              saving={saving}
              t={t}
            />
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createImpactBuilderCopy(t: Translate): ImpactBuilderCopy {
  return {
    intentLead: {
      completed: t('log.intent.completed.title'),
      solved: t('log.intent.solved.title'),
      helped: t('log.intent.helped.title'),
      feedback: t('log.intent.feedback.title'),
      learned: t('log.intent.learned.title'),
      ownership: t('log.intent.ownership.title'),
      challenge: t('log.intent.challenge.title'),
    },
    outcomeLabel: {
      deadline_met: t('log.outcome.deadlineMet.title'),
      error_fixed_or_prevented: t('log.outcome.errorFixed.title'),
      work_faster: t('log.outcome.workFaster.title'),
      work_clearer: t('log.outcome.workClearer.title'),
      person_helped: t('log.outcome.personHelped.title'),
      risk_reduced: t('log.outcome.riskReduced.title'),
      decision_enabled: t('log.outcome.decisionEnabled.title'),
      skill_gained: t('log.outcome.skillGained.title'),
    },
    outcomePrefix: t('log.impact.outcomePrefix'),
    evidencePrefix: t('log.impact.evidencePrefix'),
  };
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
