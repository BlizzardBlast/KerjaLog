import { z } from 'zod';
import {
  isLogEventIntent,
  WORK_ENTRY_DRAFT_STEPS,
  type WorkEntryDraft,
} from '@/domain/entry/draft';
import {
  ENTRY_STATUSES,
  ENTRY_TYPES,
  EVIDENCE_TYPES,
  IMPACT_STATEMENT_SOURCES,
  OUTCOME_TYPES,
  type WorkEntryDetail,
} from '@/domain/entry/model';
import { isCanonicalIsoTimestamp } from '@/domain/entry/timestamp';
import {
  REVIEW_PURPOSES,
  type ReviewDraft,
  type ReviewPeriod,
} from '@/domain/review/model';
import { assertReviewPeriod } from '@/domain/review/period';
import { ENTRY_SKILL_SOURCES, SKILL_IDS } from '@/domain/skill/model';
import type { WorkArea } from '@/domain/work-area/model';
import { createWorkAreaNameKey } from '@/domain/work-area/validation';

export const PORTABLE_BACKUP_VERSION = 1 as const;

const PORTABLE_ONBOARDING_STATE_VERSION = 1 as const;
const PORTABLE_ONBOARDING_STEPS = [
  'welcome',
  'work-context',
  'goal',
  'review-rhythm',
] as const;
const PORTABLE_WORK_AREAS = [
  'technology-product',
  'operations-administration',
  'finance-banking',
  'sales-service',
  'other',
] as const;
const PORTABLE_CAREER_LEVELS = [
  'new-to-working',
  'junior-contributor',
  'experienced-contributor',
  'supervisor',
] as const;
const PORTABLE_MAIN_GOALS = [
  'performance-review',
  'remember-work',
  'understand-growth',
  'resume',
  'interview',
] as const;
const PORTABLE_REVIEW_SCHEDULES = [
  'within-3-months',
  'within-6-months',
  'within-12-months',
  'not-sure',
] as const;
const PORTABLE_REMINDER_WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const;

const MAX_BACKUP_WORK_AREAS = 500;
const MAX_BACKUP_ENTRIES = 10_000;
const MAX_BACKUP_REVIEW_DRAFTS = 1_000;
const MAX_BACKUP_SECTIONS = 100;
const MAX_BACKUP_BULLETS = 1_000;

const nonEmptyText = z.string().trim().min(1);
const timestamp = z
  .string()
  .refine(isCanonicalIsoTimestamp, 'Expected a canonical ISO timestamp.');
const nullableText = z.string().nullable();

const workAreaSchema = z
  .object({
    id: nonEmptyText,
    name: z.string().trim().min(1).max(80),
    archivedAt: timestamp.nullable(),
    createdAt: timestamp,
    updatedAt: timestamp,
  })
  .strict();

const evidenceSchema = z
  .object({
    types: z.array(z.enum(EVIDENCE_TYPES)).min(1),
    detail: nonEmptyText,
  })
  .strict();

const workEntrySkillSchema = z
  .object({
    id: z.enum(SKILL_IDS),
    source: z.enum(ENTRY_SKILL_SOURCES),
  })
  .strict();

const workEntrySchema = z
  .object({
    id: nonEmptyText,
    type: z.enum(ENTRY_TYPES),
    title: nonEmptyText,
    rawNote: nonEmptyText,
    impactStatement: nullableText,
    impactStatementSource: z.enum(IMPACT_STATEMENT_SOURCES).nullable(),
    occurredAt: timestamp,
    outcomeType: z.enum(OUTCOME_TYPES).nullable(),
    status: z.enum(ENTRY_STATUSES),
    workAreaId: nonEmptyText.nullable(),
    evidence: evidenceSchema.nullable(),
    excludedFromExports: z.boolean(),
    createdAt: timestamp,
    updatedAt: timestamp,
    skills: z.array(workEntrySkillSchema),
  })
  .strict()
  .superRefine((entry, context) => {
    const hasImpact = entry.impactStatement !== null;
    const hasSource = entry.impactStatementSource !== null;
    if (hasImpact !== hasSource) {
      context.addIssue({
        code: 'custom',
        message: 'Impact statement and source must be present together.',
      });
    }
  });

const workEntryDraftSchema = z
  .object({
    step: z.enum(['type', 'event', 'outcome', 'evidence', 'skills', 'impact']),
    intent: z
      .string()
      .nullable()
      .refine((value) => value === null || isLogEventIntent(value), {
        message: 'Draft intent is invalid.',
      }),
    rawNote: z.string(),
    workAreaId: nonEmptyText.nullable(),
    outcomeType: z.enum(OUTCOME_TYPES).nullable(),
    evidenceTypes: z.array(z.enum(EVIDENCE_TYPES)),
    evidenceDetail: z.string(),
    skills: z.array(workEntrySkillSchema),
    impactStatement: z.string(),
    impactStatementSource: z.enum(IMPACT_STATEMENT_SOURCES).nullable(),
  })
  .strict();

const reviewPeriodSchema = z
  .object({ startDate: nonEmptyText, endDate: nonEmptyText })
  .strict();

const reviewDocumentSchema = z
  .object({
    sections: z
      .array(
        z
          .object({
            id: nonEmptyText,
            title: nonEmptyText,
            bullets: z.array(z.string().trim().min(1)).max(MAX_BACKUP_BULLETS),
          })
          .strict(),
      )
      .max(MAX_BACKUP_SECTIONS),
  })
  .strict();

const reviewDraftSchema = z
  .object({
    id: nonEmptyText,
    title: nonEmptyText,
    purpose: z.enum(REVIEW_PURPOSES),
    period: reviewPeriodSchema,
    document: reviewDocumentSchema,
    entries: z.array(
      z
        .object({
          sourceEntryId: nonEmptyText,
          title: nonEmptyText,
          statement: nonEmptyText,
          evidenceDetail: nullableText,
          occurredAt: timestamp,
          sortOrder: z.number().int().nonnegative(),
        })
        .strict(),
    ),
    createdAt: timestamp,
    updatedAt: timestamp,
  })
  .strict();

const onboardingSchema = z
  .object({
    version: z.literal(PORTABLE_ONBOARDING_STATE_VERSION),
    currentStep: z.enum(PORTABLE_ONBOARDING_STEPS),
    completed: z.boolean(),
    workArea: z.enum(PORTABLE_WORK_AREAS).optional(),
    careerLevel: z.enum(PORTABLE_CAREER_LEVELS).optional(),
    mainGoal: z.enum(PORTABLE_MAIN_GOALS).optional(),
    reviewSchedule: z.enum(PORTABLE_REVIEW_SCHEDULES).optional(),
    weeklyReminderEnabled: z.boolean(),
    weeklyReminderSchedule: z
      .object({
        weekday: z
          .number()
          .int()
          .refine((value) =>
            PORTABLE_REMINDER_WEEKDAYS.includes(
              value as 1 | 2 | 3 | 4 | 5 | 6 | 7,
            ),
          ),
        hour: z.number().int().min(0).max(23),
        minute: z.number().int().min(0).max(59),
      })
      .strict(),
  })
  .strict();

const portableBackupSchema = z
  .object({
    version: z.literal(PORTABLE_BACKUP_VERSION),
    exportedAt: timestamp,
    data: z
      .object({
        workAreas: z.array(workAreaSchema).max(MAX_BACKUP_WORK_AREAS),
        entries: z.array(workEntrySchema).max(MAX_BACKUP_ENTRIES),
        activeDraft: z
          .object({ draft: workEntryDraftSchema, updatedAt: timestamp })
          .strict()
          .nullable(),
        reviewDrafts: z.array(reviewDraftSchema).max(MAX_BACKUP_REVIEW_DRAFTS),
        preferences: z
          .object({
            themeMode: z.enum(['system', 'light', 'dark']),
            language: z.enum(['en', 'id']),
            onboarding: onboardingSchema,
          })
          .strict(),
      })
      .strict(),
  })
  .strict();

export type PortableActiveDraft = {
  draft: WorkEntryDraft;
  updatedAt: string;
};

export type PortablePreferences = {
  themeMode: 'system' | 'light' | 'dark';
  language: 'en' | 'id';
  onboarding: {
    version: typeof PORTABLE_ONBOARDING_STATE_VERSION;
    currentStep: (typeof PORTABLE_ONBOARDING_STEPS)[number];
    completed: boolean;
    workArea?: (typeof PORTABLE_WORK_AREAS)[number];
    careerLevel?: (typeof PORTABLE_CAREER_LEVELS)[number];
    mainGoal?: (typeof PORTABLE_MAIN_GOALS)[number];
    reviewSchedule?: (typeof PORTABLE_REVIEW_SCHEDULES)[number];
    weeklyReminderEnabled: boolean;
    weeklyReminderSchedule: {
      weekday: (typeof PORTABLE_REMINDER_WEEKDAYS)[number];
      hour: number;
      minute: number;
    };
  };
};

export type PortableBackup = {
  version: typeof PORTABLE_BACKUP_VERSION;
  exportedAt: string;
  data: {
    workAreas: WorkArea[];
    entries: WorkEntryDetail[];
    activeDraft: PortableActiveDraft | null;
    reviewDrafts: ReviewDraft[];
    preferences: PortablePreferences;
  };
};

export type PortableBackupSummary = {
  entries: number;
  reviewDrafts: number;
  workAreas: number;
};

export function parsePortableBackup(value: unknown): PortableBackup {
  const parsed = portableBackupSchema.safeParse(value);
  if (!parsed.success) {
    throw new Error('Portable backup is invalid or unsupported.');
  }
  const backup = parsed.data as PortableBackup;
  assertPortableBackupRelations(backup);
  return backup;
}

export function parsePortableBackupJson(json: string): PortableBackup {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('Portable backup is invalid or unsupported.');
  }
  return parsePortableBackup(parsed);
}

export function getPortableBackupSummary(
  backup: PortableBackup,
): PortableBackupSummary {
  return {
    workAreas: backup.data.workAreas.length,
    entries: backup.data.entries.length,
    reviewDrafts: backup.data.reviewDrafts.length,
  };
}

function assertPortableBackupRelations(backup: PortableBackup): void {
  const { activeDraft, entries, preferences, reviewDrafts, workAreas } =
    backup.data;
  assertUnique(workAreas, (area) => area.id, 'work area IDs');
  assertUnique(entries, (entry) => entry.id, 'entry IDs');
  assertUnique(reviewDrafts, (draft) => draft.id, 'review draft IDs');

  const workAreaIds = new Set(workAreas.map((area) => area.id));
  assertActiveWorkAreaNames(workAreas);
  assertPortableEntries(entries, workAreaIds);
  assertPortableActiveDraft(activeDraft, workAreaIds);
  assertPortableOnboarding(preferences.onboarding);
  assertPortableReviewDrafts(reviewDrafts);
}

function assertActiveWorkAreaNames(workAreas: readonly WorkArea[]): void {
  const activeWorkAreaKeys = new Set<string>();
  for (const area of workAreas) {
    if (area.archivedAt === null) {
      const key = createWorkAreaNameKey(area.name);
      if (activeWorkAreaKeys.has(key)) {
        throw new Error(
          'Portable backup contains duplicate active work areas.',
        );
      }
      activeWorkAreaKeys.add(key);
    }
  }
}

function assertPortableEntries(
  entries: readonly WorkEntryDetail[],
  workAreaIds: ReadonlySet<string>,
): void {
  for (const entry of entries) {
    if (entry.workAreaId !== null && !workAreaIds.has(entry.workAreaId)) {
      throw new Error('Portable backup entry references an unknown work area.');
    }
    assertUnique(entry.skills, (skill) => skill.id, 'entry skills');
    if (entry.evidence) {
      assertUnique(entry.evidence.types, (type) => type, 'evidence types');
    }
  }
}

function assertPortableActiveDraft(
  activeDraft: PortableActiveDraft | null,
  workAreaIds: ReadonlySet<string>,
): void {
  if (!activeDraft) {
    return;
  }

  const workAreaId = activeDraft.draft.workAreaId;
  if (workAreaId !== null && !workAreaIds.has(workAreaId)) {
    throw new Error('Portable active draft references an unknown work area.');
  }
  assertUnique(activeDraft.draft.skills, (skill) => skill.id, 'draft skills');
  assertUnique(
    activeDraft.draft.evidenceTypes,
    (type) => type,
    'draft evidence types',
  );
  assertPortableDraftProgression(activeDraft.draft);
}

function assertPortableOnboarding(
  onboarding: PortablePreferences['onboarding'],
): void {
  if (
    onboarding.completed &&
    (!onboarding.workArea ||
      !onboarding.careerLevel ||
      !onboarding.mainGoal ||
      !onboarding.reviewSchedule)
  ) {
    throw new Error('Portable onboarding state is incomplete.');
  }
}

function assertPortableReviewDrafts(
  reviewDrafts: readonly ReviewDraft[],
): void {
  for (const reviewDraft of reviewDrafts) {
    assertReviewPeriod(reviewDraft.period as ReviewPeriod);
    assertUnique(
      reviewDraft.document.sections,
      (section) => section.id,
      'review section IDs',
    );
    assertUnique(
      reviewDraft.entries,
      (entry) => entry.sourceEntryId,
      'review draft source entries',
    );
    assertUnique(
      reviewDraft.entries,
      (entry) => entry.sortOrder,
      'review draft entry order',
    );
  }
}

function assertPortableDraftProgression(draft: WorkEntryDraft): void {
  const stepIndex = WORK_ENTRY_DRAFT_STEPS.indexOf(draft.step);
  if (stepIndex >= 1 && draft.intent === null) {
    throw new Error('Portable active draft is missing its event type.');
  }
  if (stepIndex >= 2 && !draft.rawNote.trim()) {
    throw new Error('Portable active draft is missing its note.');
  }
  if (stepIndex >= 3 && draft.outcomeType === null) {
    throw new Error('Portable active draft is missing its outcome.');
  }
}

function assertUnique<T>(
  values: readonly T[],
  getKey: (value: T) => string | number,
  label: string,
): void {
  const keys = new Set<string | number>();
  for (const value of values) {
    const key = getKey(value);
    if (keys.has(key)) {
      throw new Error(`Portable backup contains duplicate ${label}.`);
    }
    keys.add(key);
  }
}
