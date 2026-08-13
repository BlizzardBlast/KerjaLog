import { useRouter } from 'expo-router';
import { useRef } from 'react';
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
import type { WorkEntryDetail } from '@/domain/entry/model';
import { skillDefinitionById } from '@/domain/skill/catalog';
import { EventStep } from '@/features/work-entry/components/EventStep';
import { EvidenceStep } from '@/features/work-entry/components/EvidenceStep';
import { ImpactStep } from '@/features/work-entry/components/ImpactStep';
import { OutcomeStep } from '@/features/work-entry/components/OutcomeStep';
import { EntryTypeStep } from '@/features/work-entry/refinement/components/EntryTypeStep';
import { SkillStep } from '@/features/work-entry/refinement/components/SkillStep';
import { useEntryRefinement } from '@/features/work-entry/refinement/useEntryRefinement';
import { useLogDraftNavigationGuard } from '@/features/work-entry/useLogDraftNavigationGuard';
import { useWorkEntry } from '@/features/work-entry/useWorkEntry';
import { useI18n } from '@/i18n/I18nProvider';

const SAFE_AREA_EDGES = ['top', 'bottom', 'left', 'right'] as const;

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

  const refinement = useEntryRefinement({
    entry,
    t,
    onStepChanged: () => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    },
    onSaved: (updatedEntry) => {
      allowNextRemovalRef.current = true;
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

  useLogDraftNavigationGuard({
    hasUnsavedDraft: refinement.isDirty || refinement.currentStep > 1,
    currentStep: refinement.currentStep,
    onInternalBack: handleBack,
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
    currentStep: refinement.currentStep,
    totalSteps: refinement.totalSteps,
    onBack: handleBack,
  };
  const skillsSummary =
    refinement.selectedSkills.length > 0
      ? refinement.selectedSkills
          .map((skill) => t(skillDefinitionById[skill.id].nameKey))
          .join(' · ')
      : t('entry.refine.skills.none');

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
              noteError={refinement.noteError}
              onContinue={refinement.continueFromEvent}
              onRawNoteChange={refinement.updateRawNote}
              onSaveQuick={() => undefined}
              rawNote={refinement.rawNote}
              saveError={false}
              saving={refinement.isSubmitting}
              showSaveQuick={false}
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
              onSkip={refinement.skipEvidence}
              onToggleType={refinement.toggleEvidenceType}
              t={t}
            />
          ) : null}
          {refinement.step === 'skills' ? (
            <SkillStep
              {...frame}
              onContinue={refinement.continueToImpact}
              onSkip={refinement.skipSkills}
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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
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
