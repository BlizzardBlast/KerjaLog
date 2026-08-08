import {
  CAREER_LEVELS,
  DEFAULT_ONBOARDING_STATE,
  hasRequiredOnboardingAnswers,
  MAIN_GOALS,
  ONBOARDING_STEP_ORDER,
  REVIEW_SCHEDULES,
  WORK_AREAS,
} from '@/features/onboarding/model';
import {
  careerLevelOptions,
  goalOptions,
  reviewScheduleOptions,
  workAreaOptions,
} from '@/features/onboarding/options';
import { ONBOARDING_STEP_CONFIG } from '@/features/onboarding/stepConfig';
import { en, id } from '@/i18n/translations';

function expectUnique(values: readonly string[], label: string) {
  expect(new Set(values).size).toBe(values.length);

  if (new Set(values).size !== values.length) {
    throw new Error(`${label} must be unique`);
  }
}

function placeholders(value: string) {
  return [...value.matchAll(/{{(\w+)}}/g)].map((match) => match[1]).sort();
}

describe('onboarding foundation', () => {
  test('domain values are unique and the default step is valid', () => {
    expectUnique(ONBOARDING_STEP_ORDER, 'onboarding steps');
    expectUnique(WORK_AREAS, 'work areas');
    expectUnique(CAREER_LEVELS, 'career levels');
    expectUnique(MAIN_GOALS, 'main goals');
    expectUnique(REVIEW_SCHEDULES, 'review schedules');

    expect(DEFAULT_ONBOARDING_STATE.version).toBe(1);
    expect(DEFAULT_ONBOARDING_STATE.completed).toBe(false);
    expect(DEFAULT_ONBOARDING_STATE.weeklyReminderEnabled).toBe(false);
    expect(DEFAULT_ONBOARDING_STATE.appLockPreferred).toBe(false);
    expect(ONBOARDING_STEP_ORDER).toContain(
      DEFAULT_ONBOARDING_STATE.currentStep,
    );
  });

  test('localized option arrays exhaustively follow domain values', () => {
    expect(workAreaOptions.map((option) => option.value)).toEqual(WORK_AREAS);
    expect(careerLevelOptions.map((option) => option.value)).toEqual(
      CAREER_LEVELS,
    );
    expect(goalOptions.map((option) => option.value)).toEqual(MAIN_GOALS);
    expect(reviewScheduleOptions.map((option) => option.value)).toEqual(
      REVIEW_SCHEDULES,
    );
  });

  test('required-answer validation covers all completion fields', () => {
    expect(hasRequiredOnboardingAnswers(DEFAULT_ONBOARDING_STATE)).toBe(false);
    expect(
      hasRequiredOnboardingAnswers({
        ...DEFAULT_ONBOARDING_STATE,
        workArea: 'technology-product',
        careerLevel: 'junior-contributor',
        mainGoal: 'performance-review',
        reviewSchedule: 'within-3-months',
      }),
    ).toBe(true);
  });

  test('step configuration covers every step and validates progression', () => {
    expect(Object.keys(ONBOARDING_STEP_CONFIG)).toEqual([
      ...ONBOARDING_STEP_ORDER,
    ]);

    expect(
      ONBOARDING_STEP_CONFIG.welcome.canContinue(DEFAULT_ONBOARDING_STATE),
    ).toBe(true);
    expect(
      ONBOARDING_STEP_CONFIG['work-context'].canContinue(
        DEFAULT_ONBOARDING_STATE,
      ),
    ).toBe(false);
    expect(
      ONBOARDING_STEP_CONFIG['work-context'].canContinue({
        ...DEFAULT_ONBOARDING_STATE,
        workArea: 'technology-product',
        careerLevel: 'junior-contributor',
      }),
    ).toBe(true);
    expect(
      ONBOARDING_STEP_CONFIG.goal.canContinue({
        ...DEFAULT_ONBOARDING_STATE,
        mainGoal: 'performance-review',
      }),
    ).toBe(true);
    expect(
      ONBOARDING_STEP_CONFIG['review-rhythm'].canContinue({
        ...DEFAULT_ONBOARDING_STATE,
        reviewSchedule: 'within-3-months',
      }),
    ).toBe(false);
    expect(
      ONBOARDING_STEP_CONFIG['review-rhythm'].canContinue({
        ...DEFAULT_ONBOARDING_STATE,
        workArea: 'technology-product',
        careerLevel: 'junior-contributor',
        mainGoal: 'performance-review',
        reviewSchedule: 'within-3-months',
      }),
    ).toBe(true);
  });

  test('English and Indonesian translations expose the same keys', () => {
    expect(Object.keys(id).sort()).toEqual(Object.keys(en).sort());
  });

  test('translated strings preserve interpolation placeholders', () => {
    for (const key of Object.keys(en) as Array<keyof typeof en>) {
      expect(placeholders(id[key])).toEqual(placeholders(en[key]));
    }
  });
});
