import type { WorkEntryDetail } from '@/domain/entry/model';
import type { EntryRefinementValues } from '@/features/work-entry/refinement/refinementSchema';

export function mapEntryToRefinementValues(
  entry: WorkEntryDetail,
): EntryRefinementValues {
  return {
    type: entry.type,
    rawNote: entry.rawNote,
    outcomeType: entry.outcomeType,
    evidenceTypes: entry.evidence?.types ?? [],
    evidenceDetail: entry.evidence?.detail ?? '',
    impactStatement: entry.impactStatement ?? '',
    impactStatementSource: entry.impactStatementSource,
    skills: entry.skills,
  };
}
