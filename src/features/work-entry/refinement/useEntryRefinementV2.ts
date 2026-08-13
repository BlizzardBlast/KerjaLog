import { useForm, useSelector } from '@tanstack/react-form';
import { useState } from 'react';
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

type Options = {
  entry: WorkEntryDetail;
  t: Translate;
  onSaved: (entry: WorkEntryDetail) => void;
};

export function useEntryRefinementV2({ entry, t, onSaved }: Options) {
  const [step, setStep] = useState<RefinementStep>(() => getInitialRefinementStep(entry));
  const [noteError, setNoteError] = useState(false);
  const [evidenceError, setEvidenceError] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const impactCopy = createImpactBuilderCopy(t);
  const form = useForm({
    defaultValues: mapEntryToRefinementValues(entry),
    validators: { onSubmit: entryRefinementSchema },
    onSubmit: async ({ value }) => {
      setSaveError(false);
      try {
        onSaved(await updateWorkEntry(entry, value));
      } catch {
        setSaveError(true);
      }
    },
  });

  const entryType = useSelector(form.store, (state) => state.values.type);
  const rawNote = useSelector(form.store, (state) => state.values.rawNote);
  const outcomeType = useSelector(form.store, (state) => state.values.outcomeType);
  const evidenceTypes = useSelector(form.store, (state) => state.values.evidenceTypes);
  const evidenceDetail = useSelector(form.store, (state) => state.values.evidenceDetail);
  const impactStatement = useSelector(form.store, (state) => state.values.impactStatement);
  const impactStatementSource = useSelector(form.store, (state) => state.values.impactStatementSource);
  const selectedSkills = useSelector(form.store, (state) => state.values.skills);
  const isDirty = useSelector(form.store, (state) => state.isDirty);
  const isSubmitting = useSelector(form.store, (state) => state.isSubmitting);
  const stepIndex = REFINEMENT_STEPS.indexOf(step);
  const suggestedSkillIds = suggestSkillIds({ entryType, outcomeType });

  const setCurrentStep = (nextStep: RefinementStep) => setStep(nextStep);
  const invalidateGeneratedImpact = () => {
    if (impactStatementSource === 'generated') {
      form.setFieldValue('impactStatement', '');
      form.setFieldValue('impactStatementSource', null);
    }
  };
  const goBack = () => {
    if (stepIndex <= 0) return false;
    setCurrentStep(REFINEMENT_STEPS[stepIndex - 1]);
    return true;
  };
  const selectEntryType = (nextType: WorkEntryDetail['type']) => {
    form.setFieldValue('type', nextType);
    setSaveError(false);
  };
  const updateRawNote = (value: string) => {
    form.setFieldValue('rawNote', value);
    setNoteError(false);
    setSaveError(false);
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
  const selectOutcome = (nextOutcome: NonNullable<WorkEntryDetail['outcomeType']>) => {
    form.setFieldValue('outcomeType', nextOutcome);
    setSaveError(false);
    invalidateGeneratedImpact();
  };
  const updateEvidenceDetail = (value: string) => {
    form.setFieldValue('evidenceDetail', value);
    setEvidenceError(false);
    setSaveError(false);
    invalidateGeneratedImpact();
  };
  const toggleEvidenceType = (type: EvidenceType) => {
    form.setFieldValue('evidenceTypes', evidenceTypes.includes(type) ? evidenceTypes.filter((value) => value !== type) : [...evidenceTypes, type]);
    setEvidenceError(false);
    setSaveError(false);
    invalidateGeneratedImpact();
  };
  const continueFromEvidence = () => {
    const incomplete = hasIncompleteEvidence(evidenceTypes, evidenceDetail);
    setEvidenceError(incomplete);
    if (!incomplete) setCurrentStep('skills');
  };
  const toggleSkill = (skillId: SkillId, source: EntrySkillSource) => {
    const existing = selectedSkills.find((skill) => skill.id === skillId);
    const nextSkills: WorkEntrySkill[] = existing ? selectedSkills.filter((skill) => skill.id !== skillId) : [...selectedSkills, { id: skillId, source }];
    form.setFieldValue('skills', nextSkills);
    setSaveError(false);
  };
  const continueToImpact = () => {
    if (!outcomeType) {
      setCurrentStep('outcome');
      return;
    }
    if (!impactStatement.trim()) {
      form.setFieldValue('impactStatement', buildRefinementImpactStatement({ rawNote, outcomeType, evidenceDetail: evidenceDetail.trim() || undefined }, impactCopy));
      form.setFieldValue('impactStatementSource', 'generated');
    }
    setCurrentStep('impact');
  };
  const updateImpactStatement = (value: string) => {
    form.setFieldValue('impactStatement', value);
    form.setFieldValue('impactStatementSource', value.trim() ? 'user' : null);
    setSaveError(false);
  };

  return {
    step,
    currentStep: stepIndex + 1,
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
    toggleSkill,
    continueToImpact,
    updateImpactStatement,
    submit: () => form.handleSubmit(),
  };
}
