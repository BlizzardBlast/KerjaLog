import { useForm, useSelector } from '@tanstack/react-form';
import type { WorkEntryDraft } from '@/domain/entry/draft';

export function useLogForm(startingDraft: WorkEntryDraft) {
  const form = useForm({
    defaultValues: {
      intent: startingDraft.intent,
      rawNote: startingDraft.rawNote,
      outcomeType: startingDraft.outcomeType,
      evidenceTypes: startingDraft.evidenceTypes,
      evidenceDetail: startingDraft.evidenceDetail,
      skills: startingDraft.skills,
      impactStatement: startingDraft.impactStatement,
      impactStatementSource: startingDraft.impactStatementSource,
    },
  });

  const intent = useSelector(form.store, (state) => state.values.intent);
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
  const selectedSkills = useSelector(
    form.store,
    (state) => state.values.skills,
  );
  const impactStatement = useSelector(
    form.store,
    (state) => state.values.impactStatement,
  );
  const impactStatementSource = useSelector(
    form.store,
    (state) => state.values.impactStatementSource,
  );

  return {
    form,
    intent,
    rawNote,
    outcomeType,
    evidenceTypes,
    evidenceDetail,
    selectedSkills,
    impactStatement,
    impactStatementSource,
  };
}
