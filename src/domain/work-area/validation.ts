export const WORK_AREA_NAME_MAX_LENGTH = 80;

export function normalizeWorkAreaName(value: string): string {
  const normalized = value.normalize('NFKC').trim().replace(/\s+/gu, ' ');

  if (!normalized) {
    throw new Error('Work area name is required.');
  }

  if (normalized.length > WORK_AREA_NAME_MAX_LENGTH) {
    throw new Error(
      `Work area name must be at most ${WORK_AREA_NAME_MAX_LENGTH} characters.`,
    );
  }

  return normalized;
}

export function createWorkAreaNameKey(value: string): string {
  return normalizeWorkAreaName(value).toLocaleLowerCase('en-US');
}
