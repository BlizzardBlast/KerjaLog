import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CAREER_LEVELS,
  DEFAULT_ONBOARDING_STATE,
  MAIN_GOALS,
  ONBOARDING_STEP_ORDER,
  REVIEW_SCHEDULES,
  WORK_AREAS,
} from '../src/features/onboarding/model.ts';
import { en, id } from '../src/i18n/translations.ts';

function assertUnique(values, label) {
  assert.equal(new Set(values).size, values.length, `${label} must be unique`);
}

function placeholders(value) {
  return [...value.matchAll(/{{(\w+)}}/g)].map((match) => match[1]).sort();
}

test('onboarding domain values are unique and the default step is valid', () => {
  assertUnique(ONBOARDING_STEP_ORDER, 'onboarding steps');
  assertUnique(WORK_AREAS, 'work areas');
  assertUnique(CAREER_LEVELS, 'career levels');
  assertUnique(MAIN_GOALS, 'main goals');
  assertUnique(REVIEW_SCHEDULES, 'review schedules');

  assert.equal(DEFAULT_ONBOARDING_STATE.version, 1);
  assert.equal(DEFAULT_ONBOARDING_STATE.completed, false);
  assert.ok(ONBOARDING_STEP_ORDER.includes(DEFAULT_ONBOARDING_STATE.currentStep));
});

test('English and Indonesian translations expose the same keys', () => {
  assert.deepEqual(Object.keys(id).sort(), Object.keys(en).sort());
});

test('translated strings preserve interpolation placeholders', () => {
  for (const key of Object.keys(en)) {
    assert.deepEqual(
      placeholders(id[key]),
      placeholders(en[key]),
      `placeholder mismatch for ${key}`,
    );
  }
});
