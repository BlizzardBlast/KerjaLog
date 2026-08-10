import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/design-system/components/Button';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing } from '@/design-system/tokens/theme';
import {
  buildImpactStatement,
  type ImpactBuilderCopy,
  type LogEventIntent,
} from '@/domain/entry/impact';
import type { EvidenceType, OutcomeType } from '@/domain/entry/model';
import { LogChoiceCard } from '@/features/work-entry/components/LogChoiceCard';
import { LogHeader } from '@/features/work-entry/components/LogHeader';
import {
  evidenceOptions,
  logEventOptions,
  outcomeOptions,
} from '@/features/work-entry/model';
import { saveWorkEntry } from '@/features/work-entry/saveWorkEntry';
import { useI18n } from '@/i18n/I18nProvider';
import type { TranslationKey } from '@/i18n/catalog';

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

  const moveToStep = (nextStep: LogStep) => {
    setStep(nextStep);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const goBack = () => {
    const currentIndex = STEPS.indexOf(step);
    if (currentIndex <= 0) {
      router.replace('/home');
      return;
    }

    moveToStep(STEPS[currentIndex - 1]);
  };

  const goToOutcome = () => {
    if (!rawNote.trim()) {
      setNoteError(true);
      return;
    }

    setNoteError(false);
    moveToStep('outcome');
  };

  const goToImpact = () => {
    if (!intent || !outcomeType) {
      return;
    }

    if (evidenceDetail.trim() && evidenceTypes.length === 0) {
      setEvidenceError(true);
      return;
    }

    setEvidenceError(false);
    setImpactStatement(
      buildImpactStatement(
        {
          intent,
          rawNote,
          outcomeType,
          evidenceDetail,
        },
        createImpactBuilderCopy(t),
      ),
    );
    moveToStep('impact');
  };

  const toggleEvidenceType = (type: EvidenceType) => {
    setEvidenceTypes((current) =>
      current.includes(type)
        ? current.filter((candidate) => candidate !== type)
        : [...current, type],
    );
    setEvidenceError(false);
  };

  const save = async (quickNote: boolean) => {
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
  };

  const renderTypeStep = () => (
    <>
      <LogHeader
        eyebrow={t('log.capture.eyebrow')}
        title={t('log.capture.title')}
        description={t('log.capture.description')}
        backLabel={t('log.back')}
        onBack={goBack}
        currentStep={currentStep}
        totalSteps={STEPS.length}
      />
      <View style={styles.choiceList}>
        {logEventOptions.map((option) => (
          <LogChoiceCard
            key={option.value}
            title={t(option.titleKey)}
            description={
              option.descriptionKey ? t(option.descriptionKey) : undefined
            }
            icon={option.icon}
            selected={intent === option.value}
            onPress={() => setIntent(option.value)}
          />
        ))}
      </View>
      <Button
        fullWidth
        disabled={!intent}
        onPress={() => moveToStep('event')}
        size="lg"
      >
        {t('log.capture.continue')}
      </Button>
    </>
  );

  const renderEventStep = () => (
    <>
      <LogHeader
        eyebrow={t('log.event.eyebrow')}
        title={t('log.event.title')}
        backLabel={t('log.back')}
        onBack={goBack}
        currentStep={currentStep}
        totalSteps={STEPS.length}
      />
      <View style={styles.field}>
        <Text variant="label">{t('log.event.label')}</Text>
        <TextInput
          accessibilityLabel={t('log.event.label')}
          maxLength={2000}
          multiline
          onChangeText={(value) => {
            setRawNote(value);
            if (value.trim()) {
              setNoteError(false);
            }
          }}
          placeholder={t('log.event.placeholder')}
          placeholderTextColor={theme.colors.textMuted}
          style={[
            styles.textarea,
            theme.typography.body,
            {
              backgroundColor: theme.colors.surface,
              borderColor: noteError ? theme.colors.danger : theme.colors.border,
              color: theme.colors.text,
            },
          ]}
          textAlignVertical="top"
          value={rawNote}
        />
        <Text variant="caption" color="textMuted">
          {t('log.event.help')}
        </Text>
        {noteError ? (
          <Text
            accessibilityLiveRegion="polite"
            variant="caption"
            color="danger"
          >
            {t('log.event.required')}
          </Text>
        ) : null}
      </View>
      <View
        style={[
          styles.notice,
          {
            backgroundColor: theme.colors.warningSoft,
            borderColor: theme.colors.warning,
          },
        ]}
      >
        <Text variant="bodyStrong">{t('log.event.privacyTitle')}</Text>
        <Text variant="caption" color="textMuted">
          {t('log.event.privacyDescription')}
        </Text>
      </View>
      <View style={styles.buttonRow}>
        <Button
          disabled={!rawNote.trim()}
          loading={saving}
          onPress={() => save(true)}
          style={styles.flexButton}
          variant="secondary"
        >
          {t('log.event.saveQuick')}
        </Button>
        <Button
          disabled={!rawNote.trim() || saving}
          onPress={goToOutcome}
          style={styles.flexButton}
        >
          {t('log.event.continue')}
        </Button>
      </View>
      {saveError ? <SaveErrorMessage t={t} /> : null}
    </>
  );

  const renderOutcomeStep = () => (
    <>
      <LogHeader
        eyebrow={t('log.outcome.eyebrow')}
        title={t('log.outcome.title')}
        description={t('log.outcome.description')}
        backLabel={t('log.back')}
        onBack={goBack}
        currentStep={currentStep}
        totalSteps={STEPS.length}
      />
      <View style={styles.choiceList}>
        {outcomeOptions.map((option) => (
          <LogChoiceCard
            key={option.value}
            title={t(option.titleKey)}
            description={
              option.descriptionKey ? t(option.descriptionKey) : undefined
            }
            selected={outcomeType === option.value}
            onPress={() => setOutcomeType(option.value)}
          />
        ))}
      </View>
      <Button
        fullWidth
        disabled={!outcomeType}
        onPress={() => moveToStep('evidence')}
        size="lg"
      >
        {t('log.outcome.continue')}
      </Button>
    </>
  );

  const renderEvidenceStep = () => (
    <>
      <LogHeader
        eyebrow={t('log.evidence.eyebrow')}
        title={t('log.evidence.title')}
        description={t('log.evidence.description')}
        backLabel={t('log.back')}
        onBack={goBack}
        currentStep={currentStep}
        totalSteps={STEPS.length}
      />
      <View style={styles.choiceList}>
        {evidenceOptions.map((option) => (
          <LogChoiceCard
            key={option.value}
            title={t(option.titleKey)}
            selected={evidenceTypes.includes(option.value)}
            onPress={() => toggleEvidenceType(option.value)}
            mode="multiple"
          />
        ))}
      </View>
      <View style={styles.field}>
        <Text variant="label">{t('log.evidence.detailLabel')}</Text>
        <TextInput
          accessibilityLabel={t('log.evidence.detailLabel')}
          maxLength={1000}
          multiline
          onChangeText={(value) => {
            setEvidenceDetail(value);
            if (!value.trim() || evidenceTypes.length > 0) {
              setEvidenceError(false);
            }
          }}
          placeholder={t('log.evidence.detailPlaceholder')}
          placeholderTextColor={theme.colors.textMuted}
          style={[
            styles.evidenceInput,
            theme.typography.body,
            {
              backgroundColor: theme.colors.surface,
              borderColor: evidenceError
                ? theme.colors.danger
                : theme.colors.border,
              color: theme.colors.text,
            },
          ]}
          textAlignVertical="top"
          value={evidenceDetail}
        />
        {evidenceError ? (
          <Text
            accessibilityLiveRegion="polite"
            variant="caption"
            color="danger"
          >
            {t('log.evidence.detailHelp')}
          </Text>
        ) : null}
      </View>
      <View style={styles.buttonRow}>
        <Button
          onPress={() => {
            setEvidenceTypes([]);
            setEvidenceDetail('');
            setEvidenceError(false);
            goToImpact();
          }}
          style={styles.flexButton}
          variant="secondary"
        >
          {t('log.evidence.skip')}
        </Button>
        <Button onPress={goToImpact} style={styles.flexButton}>
          {t('log.evidence.continue')}
        </Button>
      </View>
    </>
  );

  const renderImpactStep = () => {
    if (!intent || !outcomeType) {
      return null;
    }

    return (
      <>
        <LogHeader
          eyebrow={t('log.impact.eyebrow')}
          title={t('log.impact.title')}
          description={t('log.impact.description')}
          backLabel={t('log.back')}
          onBack={goBack}
          currentStep={currentStep}
          totalSteps={STEPS.length}
        />
        <View
          style={[
            styles.threadCard,
            {
              backgroundColor: theme.colors.primarySoft,
              borderColor: theme.colors.primary,
            },
          ]}
        >
          <ThreadNode label={t('log.impact.whatHappened')} value={rawNote} />
          <ThreadNode
            label={t('log.impact.whatChanged')}
            value={getOutcomeLabel(outcomeType, t)}
          />
          <ThreadNode
            label={t('log.impact.whatSupports')}
            value={
              evidenceDetail.trim() || t('log.impact.noEvidence')
            }
          />
        </View>
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surfaceSubtle,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text variant="overline" color="primary">
            {t('log.impact.originalNote')}
          </Text>
          <Text variant="body">{rawNote.trim()}</Text>
        </View>
        <View style={styles.field}>
          <Text variant="label">{t('log.impact.editLabel')}</Text>
          <TextInput
            accessibilityLabel={t('log.impact.editLabel')}
            maxLength={2500}
            multiline
            onChangeText={setImpactStatement}
            style={[
              styles.impactInput,
              theme.typography.bodyStrong,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              },
            ]}
            textAlignVertical="top"
            value={impactStatement}
          />
        </View>
        <View
          style={[
            styles.notice,
            {
              backgroundColor: theme.colors.warningSoft,
              borderColor: theme.colors.warning,
            },
          ]}
        >
          <Text variant="bodyStrong">{t('log.impact.groundedTitle')}</Text>
          <Text variant="caption" color="textMuted">
            {t('log.impact.groundedDescription')}
          </Text>
        </View>
        <Button
          fullWidth
          disabled={!impactStatement.trim()}
          loading={saving}
          onPress={() => save(false)}
          size="lg"
        >
          {t('log.impact.confirm')}
        </Button>
        {saveError ? <SaveErrorMessage t={t} /> : null}
      </>
    );
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
          {step === 'type' ? renderTypeStep() : null}
          {step === 'event' ? renderEventStep() : null}
          {step === 'outcome' ? renderOutcomeStep() : null}
          {step === 'evidence' ? renderEvidenceStep() : null}
          {step === 'impact' ? renderImpactStep() : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ThreadNode({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.threadNode}>
      <Text variant="overline" color="primary">
        {label}
      </Text>
      <Text variant="bodyStrong">{value}</Text>
    </View>
  );
}

function SaveErrorMessage({ t }: { t: Translate }) {
  return (
    <Text accessibilityLiveRegion="polite" variant="caption" color="danger">
      {t('log.impact.saveError')}
    </Text>
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

function getOutcomeLabel(outcomeType: OutcomeType, t: Translate): string {
  if (outcomeType === 'unsure') {
    return t('log.impact.notKnown');
  }

  const option = outcomeOptions.find((candidate) => candidate.value === outcomeType);
  return option ? t(option.titleKey) : t('log.impact.notKnown');
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
  choiceList: {
    gap: spacing[2],
  },
  field: {
    gap: spacing[2],
  },
  textarea: {
    borderRadius: radii.lg,
    borderWidth: 1,
    minHeight: 156,
    padding: spacing[4],
  },
  evidenceInput: {
    borderRadius: radii.lg,
    borderWidth: 1,
    minHeight: 112,
    padding: spacing[4],
  },
  impactInput: {
    borderRadius: radii.lg,
    borderWidth: 1,
    minHeight: 164,
    padding: spacing[4],
  },
  notice: {
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing[1],
    padding: spacing[4],
  },
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing[2],
    padding: spacing[4],
  },
  threadCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    gap: spacing[3],
    padding: spacing[4],
  },
  threadNode: {
    gap: spacing[1],
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  flexButton: {
    flex: 1,
  },
});
