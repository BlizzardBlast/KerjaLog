import { useForm, useSelector } from '@tanstack/react-form';
import { useRef, useState } from 'react';
import {
  buildRefinementImpactStatement,
  hasIncompleteEvidence,
} from '@/domain/entry/impact';
import type { EvidenceType, WorkEntryDetail } from '@/domain/entry/model';
import type {
  EntrySkillSource,
  SkillId,
  WorkEntrySkill,
} from '@/domain/skill/model';
import { suggestSkillIds } from '@/domain/skill/suggestions';
import type { Translate } from '@/features/work-entry/components/logStepTypes';
import { createImpactBuilderCopy } from '@/features/work-entry/impactBuilderCopy';
import { mapEntryToRefinementValues } from '@/features/work-entry/refinement/refinementMapper';
import { entryRefinementSchema } from '@/features/work-entry/refinement/refinementSchema';
import {
  getInitialRefinementStep,
  REFINEMENT_STEPS,
  type RefinementStep,
} from '@/features/work-entry/refinement/refinementSteps';
import { updateWorkEntry } from '@/features/work-entry/refinement/updateWorkEntry';

type UseEntryRefinementOptions = {
  entry: WorkEntryDetail;
  t: Translate;
  onSaved: (entry: WorkEntryDetail) => void;
  onStepChanged?: () => void;
};

export function useEntryRefinement({
  entry,
  t,
  onSaved,
  onStepChanged,
}: UseEntryRefinementOptions) {
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

      let updatedEntry: WorkEntryDetail;
      try {
        updatedEntry = await updateWorkEntry(entry, value);
      } catch {
        setSaveError(true);
        return;
      }

      onSaved(updatedEntry);
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

  const setCurrentStep = (nextStep: RefinementStep) => {
    setStep(nextStep);
    onStepChanged?.();
  };

  const goBack = (): boolean => {
    if (stepIndex <= 0) {
      return false;
    }

    setCurrentStep(REFINEMENT_STEPS[stepIndex - 1]);
    return true;
  };

  const invalidateGeneratedImpact = () => {
    if (!impactEditedRef.current) {
      form.setFieldValue('impactStatement', '');
    }
  };

  const selectEntryType = (nextType: WorkEntryDetail['type']) => {
    form.setFieldValue('type', nextType);
    invalidateGeneratedImpact();
  };

  const updateRawNote = (value: string) => {
    form.setFieldValue('rawNote', value);
    setNoteError(false);
    invalidateGeneratedImpact();
  };

  const continueFromEvent = () => {
    if (!rawNote.trim()) {
      setNoteError(true);
      return;
    }

    setNoteError(false);
    setCurrentStep('outcome');
  };

  const selectOutcome = (
    nextOutcome: NonNullable<WorkEntryDetail['outcomeType']>,
  ) => {
    form.setFieldValue('outcomeType', nextOutcome);
    invalidateGeneratedImpact();
  };

  const updateEvidenceDetail = (value: string) => {
    form.setFieldValue('evidenceDetail', value);
    setEvidenceError(false);
    invalidateGeneratedImpact();
  };

  const toggleEvidenceType = (type: EvidenceType) => {
    const nextEvidenceTypes = evidenceTypes.includes(type)
      ? evidenceTypes.filter((value) => value !== type)
      : [...evidenceTypes, type];
    form.setFieldValue('evidenceTypes', nextEvidenceTypes);
    setEvidenceError(false);
    invalidateGeneratedImpact();
  };

  const continueFromEvidence = () => {
    const incomplete = hasIncompleteEvidence(evidenceTypes, evidenceDetail);
    setEvidenceError(incomplete);

    if (!incomplete) {
      setCurrentStep('skills');
    }
  };

  const skipEvidence = () => {
    form.setFieldValue('evidenceTypes', []);
    form.setFieldValue('evidenceDetail', '');
    setEvidenceError(false);
    invalidateGeneratedImpact();
    setCurrentStep('skills');
  };

  const toggleSkill = (skillId: SkillId, source: EntrySkillSource) => {
    const existing = selectedSkills.find((skill) => skill.id === skillId);
    const nextSkills: WorkEntrySkill[] = existing
      ? selectedSkills.filter((skill) => skill.id !== skillId)
      : [...selectedSkills, { id: skillId, source }];

    form.setFieldValue('skills', nextSkills);
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

  const skipSkills = () => {
    form.setFieldValue('skills', []);
    continueToImpact();
  };

  const updateImpactStatement = (value: string) => {
    impactEditedRef.current = true;
    form.setFieldValue('impactStatement', value);
  };

  return {
    step,
    currentStep,
    totalSteps: REFINEMENT_STEPS.length,
    entryType,
    rawNote,
    outcomeType,
    evidenceTypes,
    evidenceDetail,
    impactStatement,
    selectedSkills,
    suggestedSkillIds,
    isDirty,
    isSubmitting,
    noteError,
    evidenceError,
    saveError,
    goBack,
    setCurrentStep,
    selectEntryType,
    updateRawNote,
    continueFromEvent,
    selectOutcome,
    updateEvidenceDetail,
    toggleEvidenceType,
    continueFromEvidence,
    skipEvidence,
    toggleSkill,
    continueToImpact,
    skipSkills,
    updateImpactStatement,
    submit: () => form.handleSubmit(),
  };
}
