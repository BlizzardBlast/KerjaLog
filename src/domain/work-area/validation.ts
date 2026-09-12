import { z } from 'zod';

export const WORK_AREA_NAME_MAX_LENGTH = 80;

const WORK_AREA_NAME_REQUIRED = 'required';
const WORK_AREA_NAME_TOO_LONG = 'too_long';

const normalizedWorkAreaNameSchema = z
  .string()
  .transform((value) => value.normalize('NFKC').trim().replace(/\s+/gu, ' '));

export const workAreaNameSchema = normalizedWorkAreaNameSchema.pipe(
  z
    .string()
    .min(1, WORK_AREA_NAME_REQUIRED)
    .max(WORK_AREA_NAME_MAX_LENGTH, WORK_AREA_NAME_TOO_LONG),
);

export const workAreaNameFormSchema = z.object({
  name: workAreaNameSchema,
});

export type WorkAreaNameValidationIssue =
  | typeof WORK_AREA_NAME_REQUIRED
  | typeof WORK_AREA_NAME_TOO_LONG;

const validationMessageByIssue: Record<WorkAreaNameValidationIssue, string> = {
  [WORK_AREA_NAME_REQUIRED]: 'Work area name is required.',
  [WORK_AREA_NAME_TOO_LONG]: `Work area name must be at most ${WORK_AREA_NAME_MAX_LENGTH} characters.`,
};

export function normalizeWorkAreaName(value: string): string {
  const parsed = workAreaNameSchema.safeParse(value);
  if (parsed.success) {
    return parsed.data;
  }

  throw new Error(
    validationMessageByIssue[
      getWorkAreaNameValidationIssue(value) ?? WORK_AREA_NAME_REQUIRED
    ],
  );
}

export function createWorkAreaNameKey(value: string): string {
  return normalizeWorkAreaName(value).toLocaleLowerCase('en-US');
}

export function getWorkAreaNameValidationIssue(
  value: string,
): WorkAreaNameValidationIssue | null {
  const parsed = workAreaNameSchema.safeParse(value);
  if (parsed.success) {
    return null;
  }

  const issue = parsed.error.issues[0]?.message;
  return issue === WORK_AREA_NAME_TOO_LONG
    ? WORK_AREA_NAME_TOO_LONG
    : WORK_AREA_NAME_REQUIRED;
}
