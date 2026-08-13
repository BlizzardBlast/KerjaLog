import { z } from 'zod';
import {
  ENTRY_TYPES,
  EVIDENCE_TYPES,
  OUTCOME_TYPES,
} from '@/domain/entry/model';
import {
  ENTRY_SKILL_SOURCES,
  SKILL_IDS,
} from '@/domain/skill/model';

const nonBlankString = (maxLength: number) =>
  z
    .string()
    .max(maxLength)
    .refine((value) => value.trim().length > 0, 'Required');

export const entryRefinementSchema = z
  .object({
    type: z.enum(ENTRY_TYPES),
    rawNote: nonBlankString(2000),
    outcomeType: z.enum(OUTCOME_TYPES).nullable(),
    evidenceTypes: z.array(z.enum(EVIDENCE_TYPES)),
    evidenceDetail: z.string().max(1000),
    impactStatement: z.string().max(2500),
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
  });

export type EntryRefinementValues = z.infer<typeof entryRefinementSchema>;
