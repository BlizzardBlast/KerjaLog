export const ONBOARDING_STATE_VERSION = 1 as const;

export const ONBOARDING_STEP_ORDER = [
  'welcome',
  'work-context',
  'goal',
  'review-rhythm',
] as const;

export type OnboardingStepId = (typeof ONBOARDING_STEP_ORDER)[number];

export const WORK_AREAS = [
  'technology-product',
  'operations-administration',
  'finance-banking',
  'sales-service',
  'other',
] as const;
export type WorkArea = (typeof WORK_AREAS)[number];

export const CAREER_LEVELS = [
  'new-to-working',
  'junior-contributor',
  'experienced-contributor',
  'supervisor',
] as const;
export type CareerLevel = (typeof CAREER_LEVELS)[number];

export const MAIN_GOALS = [
  'performance-review',
  'remember-work',
  'understand-growth',
  'resume',
  'interview',
] as const;
export type MainGoal = (typeof MAIN_GOALS)[number];

export const REVIEW_SCHEDULES = [
  'within-3-months',
  'within-6-months',
  'within-12-months',
  'not-sure',
] as const;
export type ReviewSchedule = (typeof REVIEW_SCHEDULES)[number];

export type OnboardingState = {
  version: typeof ONBOARDING_STATE_VERSION;
  currentStep: OnboardingStepId;
  completed: boolean;
  workArea?: WorkArea;
  careerLevel?: CareerLevel;
  mainGoal?: MainGoal;
  reviewSchedule?: ReviewSchedule;
  weeklyReminderEnabled: boolean;
  appLockPreferred: boolean;
};

export type OnboardingEditableState = Pick<
  OnboardingState,
  | 'workArea'
  | 'careerLevel'
  | 'mainGoal'
  | 'reviewSchedule'
  | 'weeklyReminderEnabled'
  | 'appLockPreferred'
>;

export type OnboardingPatch = Partial<OnboardingEditableState>;

export const REQUIRED_ONBOARDING_ANSWER_FIELDS = [
  'workArea',
  'careerLevel',
  'mainGoal',
  'reviewSchedule',
] as const satisfies ReadonlyArray<keyof OnboardingEditableState>;

export function hasRequiredOnboardingAnswers(state: OnboardingState): boolean {
  return REQUIRED_ONBOARDING_ANSWER_FIELDS.every(
    (key) => state[key] !== undefined,
  );
}

export const DEFAULT_ONBOARDING_STATE: OnboardingState = {
  version: ONBOARDING_STATE_VERSION,
  currentStep: 'welcome',
  completed: false,
  weeklyReminderEnabled: false,
  appLockPreferred: false,
};
