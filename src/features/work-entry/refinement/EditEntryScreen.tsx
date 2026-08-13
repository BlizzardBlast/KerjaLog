import { useForm, useSelector } from '@tanstack/react-form';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/design-system/components/Button';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { layout, spacing } from '@/design-system/tokens/theme';
import {
  buildRefinementImpactStatement,
  hasIncompleteEvidence,
} from '@/domain/entry/impact';
import type { WorkEntryDetail } from '@/domain/entry/model';
import type {
  EntrySkillSource,
  SkillId,
  WorkEntrySkill,
} from '@/domain/skill/model';
import { skillDefinitionById } from '@/domain/skill/catalog';
import { suggestSkillIds } from '@/domain/skill/suggestions';
import { EventStep } from '@/features/work-entry/components/EventStep';
import { EvidenceStep } from '@/features/work-entry/components/EvidenceStep';
import { ImpactStep } from '@/features/work-entry/components/ImpactStep';
import { OutcomeStep } from '@/features/work-entry/components/OutcomeStep';
import { createImpactBuilderCopy } from '@/features/work-entry/impactBuilderCopy';
import { EntryTypeStep } from '@/features/work-entry/refinement/components/EntryTypeStep';
import { SkillStep } from '@/features/work-entry/refinement/components/SkillStep';
import { mapEntryToRefinementValues } from '@/features/work-entry/refinement/refinementMapper';
import { entryRefinementSchema } from '@/features/work-entry/refinement/refinementSchema';
import { updateWorkEntry } from '@/features/work-entry/refinement/updateWorkEntry';
import { useLogDraftNavigationGuard } from '@/features/work-entry/useLogDraftNavigationGuard';
import { useWorkEntry } from '@/features/work-entry/useWorkEntry';
import { useI18n } from '@/i18n/I18nProvider';

const SAFE_AREA_EDGES = ['top', 'bottom', 'left', 'right'] as const;
const REFINEMENT_STEPS = [
  'type',
  'event',
  'outcome',
  'evidence',
  'skills',
  'impact',
] as const;

type RefinementStep = (typeof REFINEMENT_STEPS)[number];

type EditEntryScreenProps = {
  id: string;
};

export function EditEntryScreen({ id }: EditEntryScreenProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useI18n();
  const { state, retry } = useWorkEntry(id);

  if (state.status === 'loading') {
    const loadingLabel = t('entry.refine.loading');

    return (
      <SafeAreaView
        accessible
        accessibilityLabel={loadingLabel}
        accessibilityRole="progressbar"
        accessibilityState={{ busy: true }}
        edges={SAFE_AREA_EDGES}
        style={[styles.centered, { backgroundColor: theme.colors.surface }]}
      >
        <ActivityIndicator color={theme.colors.primary} size="small" />
        <Text variant="body" color="textMuted">
          {loadingLabel}
        </Text>
      </SafeAreaView>
    );
  }

  if (state.status === 'not-found') {
    return (
      <SafeAreaView
        edges={SAFE_AREA_EDGES}
        style={[styles.centered, { backgroundColor: theme.colors.surface }]}
      >
        <Text variant="title" style={styles.centeredText}>
          {t('entry.refine.notFoundTitle')}
        </Text>
        <Text variant="body" color="textMuted" style={styles.centeredText}>
          {t('entry.refine.notFoundDescription')}
        </Text>
        <Button onPress={() => router.replace('/history')}>
          {t('entry.refine.back')}
        </Button>
      </SafeAreaView>
    );
  }

  if (state.status === 'error') {
    return (
      <SafeAreaView
        edges={SAFE_AREA_EDGES}
        style={[styles.centered, { backgroundColor: theme.colors.surface }]}
      >
        <Text variant="title" style={styles.centeredText}>
          {t('entry.refine.errorTitle')}
        </Text>
        <Text
          accessibilityLiveRegion="polite"
          color="textMuted"
          role="alert"
          style={styles.centeredText}
          variant="body"
        >
          {t('entry.refine.errorDescription')}
        </Text>
        <View style={styles.errorActions}>
          <Button fullWidth onPress={retry}>
            {t('entry.refine.retry')}
          </Button>
          <Button
            fullWidth
            onPress={() => router.replace('/history')}
            variant="secondary"
          >
            {t('entry.refine.back')}
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <EntryRefinementEditor
      key={`${state.entry.id}:${state.entry.updatedAt}`}
      entry={state.entry}
    />
  );
}

function EntryRefinementEditor({ entry }: { entry: WorkEntryDetail }) {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useI18n();
  const scrollRef = useRef<ScrollView>(null);
  const allowNextRemovalRef = useRef(false);
  const impactEditedRef = useRef(false);
  const [step, setStep] = useState<RefinementStep>(() =>
    getInitialRefinementStep(entry),
  );
  const [noteError, setNoteError] = useState(false);
  const [evidenceError, setEvidenceError] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const impactCopy = createImpactBuilderCopy(t);

  const form = useForm({
    defaultValues: mapEntryToRefinementValues(entry),
    validators: {
      onSubmit: entryRefinementSchema,
    },
    onSubmit: async ({ value }) => {
      setSaveError(false);

      try {
        const updatedEntry = await updateWorkEntry(entry, value);
        allowNextRemovalRef.current = true;
        router.replace({
          pathname: '/entry/[id]',
          params: { id: updatedEntry.id },
        });
      } catch {
        allowNextRemovalRef.current = false;
        setSaveError(true);
      }
    },
  });

  const entryType = useSelector(form.store, (state) => state.values.type);
  const rawNote = useSelector(form.store, (state) => state.values.rawNote);
  const outcomeType = useSelector(
    form.store,
    (state) => state.values.outcomeType,
  );
  const evidenceTypes = useSelector(
    form.store,
    (state) => state.values.evidenceTypes,
  );
  const evidenceDetail = useSelector(
    form.store,
    (state) => state.values.evidenceDetail,
  );
  const impactStatement = useSelector(
    form.store,
    (state) => state.values.impactStatement,
  );
  const selectedSkills = useSelector(
    form.store,
    (state) => state.values.skills,
  );
  const isDirty = useSelector(form.store, (state) => state.isDirty);
  const isSubmitting = useSelector(form.store, (state) => state.isSubmitting);

  const stepIndex = REFINEMENT_STEPS.indexOf(step);
  const currentStep = stepIndex + 1;
  const suggestedSkillIds = suggestSkillIds({ entryType, outcomeType });
  const skillsSummary =
    selectedSkills.length > 0
      ? selectedSkills
          .map((skill) => t(skillDefinitionById[skill.id].nameKey))
          .join(' · ')
      : t('entry.refine.skills.none');

  const setCurrentStep = (nextStep: RefinementStep) => {
    setStep(nextStep);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const goBack = () => {
    if (stepIndex > 0) {
      setCurrentStep(REFINEMENT_STEPS[stepIndex - 1]);
      return;
    }

    router.back();
  };

  const invalidateGeneratedImpact = () => {
    if (!impactEditedRef.current) {
      form.setFieldValue('impactStatement', '');
    }
  };

  const continueFromEvent = () => {
    if (!rawNote.trim()) {
      setNoteError(true);
      return;
    }

    setNoteError(false);
    setCurrentStep('outcome');
  };

  const continueFromEvidence = () => {
    const incomplete = hasIncompleteEvidence(evidenceTypes, evidenceDetail);
    setEvidenceError(incomplete);

    if (!incomplete) {
      setCurrentStep('skills');
    }
  };

  const continueToImpact = () => {
    if (!outcomeType) {
      setCurrentStep('outcome');
      return;
    }

    if (!impactStatement.trim() && !impactEditedRef.current) {
      form.setFieldValue(
        'impactStatement',
        buildRefinementImpactStatement(
          {
            rawNote,
            outcomeType,
            evidenceDetail: evidenceDetail.trim() || undefined,
          },
          impactCopy,
        ),
      );
    }

    setCurrentStep('impact');
  };

  const toggleSkill = (skillId: SkillId, source: EntrySkillSource) => {
    const existing = selectedSkills.find((skill) => skill.id === skillId);
    const nextSkills: WorkEntrySkill[] = existing
      ? selectedSkills.filter((skill) => skill.id !== skillId)
      : [...selectedSkills, { id: skillId, source }];

    form.setFieldValue('skills', nextSkills);
  };

  useLogDraftNavigationGuard({
    hasUnsavedDraft: isDirty,
    currentStep,
    onInternalBack: goBack,
    onDiscard: async () => true,
    allowNextRemovalRef,
    copy: {
      title: t('entry.refine.discardTitle'),
      description: t('entry.refine.discardDescription'),
      keepEditing: t('entry.refine.keepEditing'),
      discard: t('entry.refine.discard'),
    },
  });

  const frame = {
    backLabel: t('entry.refine.back'),
    currentStep,
    totalSteps: REFINEMENT_STEPS.length,
    onBack: goBack,
  };

  return (
    <SafeAreaView
      edges={SAFE_AREA_EDGES}
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
            <EntryTypeStep
              {...frame}
              entryType={entryType}
              onContinue={() => setCurrentStep('event')}
              onSelect={(nextType) => {
                form.setFieldValue('type', nextType);
                invalidateGeneratedImpact();
              }}
              t={t}
            />
          ) : null}
          {step === 'event' ? (
            <EventStep
              {...frame}
              noteError={noteError}
              onContinue={continueFromEvent}
              onRawNoteChange={(value) => {
                form.setFieldValue('rawNote', value);
                setNoteError(false);
                invalidateGeneratedImpact();
              }}
              onSaveQuick={() => undefined}
              rawNote={rawNote}
              saveError={false}
              saving={isSubmitting}
              showSaveQuick={false}
              t={t}
            />
          ) : null}
          {step === 'outcome' ? (
            <OutcomeStep
              {...frame}
              onContinue={() => setCurrentStep('evidence')}
              onSelect={(nextOutcome) => {
                form.setFieldValue('outcomeType', nextOutcome);
                invalidateGeneratedImpact();
              }}
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
              onContinue={continueFromEvidence}
              onDetailChange={(value) => {
                form.setFieldValue('evidenceDetail', value);
                setEvidenceError(false);
                invalidateGeneratedImpact();
              }}
              onSkip={() => {
                form.setFieldValue('evidenceTypes', []);
                form.setFieldValue('evidenceDetail', '');
                setEvidenceError(false);
                invalidateGeneratedImpact();
                setCurrentStep('skills');
              }}
              onToggleType={(type) => {
                const nextEvidenceTypes = evidenceTypes.includes(type)
                  ? evidenceTypes.filter((value) => value !== type)
                  : [...evidenceTypes, type];
                form.setFieldValue('evidenceTypes', nextEvidenceTypes);
                setEvidenceError(false);
                invalidateGeneratedImpact();
              }}
              t={t}
            />
          ) : null}
          {step === 'skills' ? (
            <SkillStep
              {...frame}
              onContinue={continueToImpact}
              onSkip={() => {
                form.setFieldValue('skills', []);
                continueToImpact();
              }}
              onToggle={toggleSkill}
              selectedSkills={selectedSkills}
              suggestedSkillIds={suggestedSkillIds}
              t={t}
            />
          ) : null}
          {step === 'impact' && outcomeType ? (
            <ImpactStep
              {...frame}
              evidenceDetail={evidenceDetail}
              impactStatement={impactStatement}
              onImpactStatementChange={(value) => {
                impactEditedRef.current = true;
                form.setFieldValue('impactStatement', value);
              }}
              onSave={() => {
                void form.handleSubmit();
              }}
              outcomeType={outcomeType}
              rawNote={rawNote}
              saveError={saveError}
              saveErrorMessage={t('entry.refine.saveError')}
              saving={isSubmitting}
              skillsSummary={skillsSummary}
              t={t}
            />
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function getInitialRefinementStep(entry: WorkEntryDetail): RefinementStep {
  if (!entry.outcomeType || entry.outcomeType === 'unsure') {
    return 'outcome';
  }

  if (!entry.evidence) {
    return 'evidence';
  }

  if (entry.skills.length === 0) {
    return 'skills';
  }

  return 'impact';
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    gap: spacing[4],
    justifyContent: 'center',
    padding: spacing[6],
  },
  centeredText: {
    textAlign: 'center',
  },
  errorActions: {
    alignSelf: 'stretch',
    gap: spacing[2],
    maxWidth: 360,
    width: '100%',
  },
  content: {
    gap: spacing[5],
    paddingBottom: spacing[8],
    paddingHorizontal: layout.screenHorizontalPadding,
    paddingTop: spacing[4],
  },
});
