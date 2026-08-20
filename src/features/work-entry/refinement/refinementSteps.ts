import type { WorkEntryDetail } from '@/domain/entry/model';

export const REFINEMENT_STEPS = [
  'type',
  'event',
  'outcome',
  'evidence',
  'skills',
  'impact',
] as const;

export type RefinementStep = (typeof REFINEMENT_STEPS)[number];

export function getInitialRefinementStep(
  entry: WorkEntryDetail,
): RefinementStep {
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
