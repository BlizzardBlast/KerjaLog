import { z } from 'zod';
import { WORK_ENTRY_TEXT_LIMITS } from '@/domain/entry/limits';
import {
  ENTRY_TYPES,
  EVIDENCE_TYPES,
  IMPACT_STATEMENT_SOURCES,
  OUTCOME_TYPES,
} from '@/domain/entry/model';
import { ENTRY_SKILL_SOURCES, SKILL_IDS } from '@/domain/skill/model';

const nonBlankString = (maxLength: number) =>
  z
    .string()
    .max(maxLength)
    .refine((value) => value.trim().length > 0, 'Required');

export const entryRefinementSchema = z
  .object({
    type: z.enum(ENTRY_TYPES),
    rawNote: nonBlankString(WORK_ENTRY_TEXT_LIMITS.rawNote),
    outcomeType: z.enum(OUTCOME_TYPES).nullable(),
    evidenceTypes: z.array(z.enum(EVIDENCE_TYPES)),
    evidenceDetail: z.string().max(WORK_ENTRY_TEXT_LIMITS.evidenceDetail),
    impactStatement: z.string().max(WORK_ENTRY_TEXT_LIMITS.impactStatement),
    impactStatementSource: z.enum(IMPACT_STATEMENT_SOURCES).nullable(),
    skills: z.array(
      z.object({
        id: z.enum(SKILL_IDS),
        source: z.enum(ENTRY_SKILL_SOURCES),
      }),
    ),
  })
  .superRefine((value, context) => {
    const hasEvidenceTypes = value.evidenceTypes.length > 0;
    const hasEvidenceDetail = value.evidenceDetail.trim().length > 0;

    if (hasEvidenceTypes !== hasEvidenceDetail) {
      context.addIssue({
        code: 'custom',
        message: 'Evidence requires both a type and a supporting detail.',
        path: ['evidenceDetail'],
      });
    }

    const hasImpactStatement = value.impactStatement.trim().length > 0;
    const hasImpactSource = value.impactStatementSource !== null;

    if (hasImpactStatement !== hasImpactSource) {
      context.addIssue({
        code: 'custom',
        message: 'Impact statement provenance is inconsistent.',
        path: ['impactStatement'],
      });
    }
  });

export type EntryRefinementValues = z.infer<typeof entryRefinementSchema>;
