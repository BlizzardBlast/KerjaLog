import {
  CAREER_LEVELS,
  DEFAULT_ONBOARDING_STATE,
  MAIN_GOALS,
  ONBOARDING_STEP_ORDER,
  REVIEW_SCHEDULES,
  WORK_AREAS,
} from '@/features/onboarding/model';
import { en, id } from '@/i18n/translations';

function expectUnique(values: readonly string[], label: string) {
  expect(new Set(values).size).toBe(values.length);

  if (new Set(values).size !== values.length) {
    throw new Error(`${label} must be unique`);
  }
}

function placeholders(value: string) {
  return [...value.matchAll(/{{(\w+)}}/g)]
    .map((match) => match[1])
    .sort();
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
    expect(ONBOARDING_STEP_ORDER).toContain(
      DEFAULT_ONBOARDING_STATE.currentStep,
    );
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
