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
  version: 1;
  currentStep: OnboardingStepId;
  completed: boolean;
  workArea?: WorkArea;
  careerLevel?: CareerLevel;
  mainGoal?: MainGoal;
  reviewSchedule?: ReviewSchedule;
  weeklyReminderEnabled: boolean;
  appLockPreferred: boolean;
};

export const DEFAULT_ONBOARDING_STATE: OnboardingState = {
  version: 1,
  currentStep: 'welcome',
  completed: false,
  weeklyReminderEnabled: true,
  appLockPreferred: true,
};
