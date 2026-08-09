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

export const REMINDER_WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const;
export type ReminderWeekday = (typeof REMINDER_WEEKDAYS)[number];

export type WeeklyReminderSchedule = {
  weekday: ReminderWeekday;
  hour: number;
  minute: number;
};

export const DEFAULT_WEEKLY_REMINDER_SCHEDULE: WeeklyReminderSchedule = {
  weekday: 6,
  hour: 16,
  minute: 30,
};

export function isReminderWeekday(value: unknown): value is ReminderWeekday {
  return (
    typeof value === 'number' &&
    REMINDER_WEEKDAYS.includes(value as ReminderWeekday)
  );
}

export function isReminderHour(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 23;
}

export function isReminderMinute(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 59;
}

export function isValidWeeklyReminderSchedule(
  value: unknown,
): value is WeeklyReminderSchedule {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    isReminderWeekday(candidate.weekday) &&
    isReminderHour(candidate.hour) &&
    isReminderMinute(candidate.minute)
  );
}

export type OnboardingState = {
  version: typeof ONBOARDING_STATE_VERSION;
  currentStep: OnboardingStepId;
  completed: boolean;
  workArea?: WorkArea;
  careerLevel?: CareerLevel;
  mainGoal?: MainGoal;
  reviewSchedule?: ReviewSchedule;
  weeklyReminderEnabled: boolean;
  weeklyReminderSchedule: WeeklyReminderSchedule;
  appLockPreferred: boolean;
};

export type OnboardingEditableState = Pick<
  OnboardingState,
  | 'workArea'
  | 'careerLevel'
  | 'mainGoal'
  | 'reviewSchedule'
  | 'weeklyReminderEnabled'
  | 'weeklyReminderSchedule'
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
  weeklyReminderSchedule: DEFAULT_WEEKLY_REMINDER_SCHEDULE,
  appLockPreferred: false,
};
