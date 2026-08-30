import {
  createWorkAreaNameKey,
  normalizeWorkAreaName,
  WORK_AREA_NAME_MAX_LENGTH,
} from '@/domain/work-area/validation';

describe('work area validation', () => {
  test('normalizes Unicode, outer whitespace, and repeated spaces', () => {
    expect(normalizeWorkAreaName('  Mobile   App Ａ  ')).toBe('Mobile App A');
  });

  test('creates a stable case-insensitive active-name key', () => {
    expect(createWorkAreaNameKey('  Monthly   Reporting ')).toBe(
      'monthly reporting',
    );
    expect(createWorkAreaNameKey('MONTHLY REPORTING')).toBe(
      'monthly reporting',
    );
  });

  test('rejects blank and oversized names', () => {
    expect(() => normalizeWorkAreaName('   ')).toThrow(
      'Work area name is required.',
    );
    expect(() =>
      normalizeWorkAreaName('a'.repeat(WORK_AREA_NAME_MAX_LENGTH + 1)),
    ).toThrow(
      `Work area name must be at most ${WORK_AREA_NAME_MAX_LENGTH} characters.`,
    );
  });
});
