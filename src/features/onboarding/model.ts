export const ONBOARDING_STEP_ORDER = [
  'welcome',
  'work-context',
  'goal',
  'review-rhythm',
] as const;

export type OnboardingStepId = (typeof ONBOARDING_STEP_ORDER)[number];

export type WorkArea =
  | 'technology-product'
  | 'operations-administration'
  | 'finance-banking'
  | 'sales-service'
  | 'other';

export type CareerLevel =
  | 'new-to-working'
  | 'junior-contributor'
  | 'experienced-contributor'
  | 'supervisor';

export type MainGoal =
  | 'performance-review'
  | 'remember-work'
  | 'understand-growth'
  | 'resume'
  | 'interview';

export type ReviewSchedule =
  | 'within-3-months'
  | 'within-6-months'
  | 'within-12-months'
  | 'not-sure';

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

export const workAreaOptions: ReadonlyArray<{
  value: WorkArea;
  title: string;
  description: string;
}> = [
  {
    value: 'technology-product',
    title: 'Technology & Product',
    description: 'Software, data, design, product, and technical delivery',
  },
  {
    value: 'operations-administration',
    title: 'Operations & Administration',
    description: 'Processes, coordination, reporting, and office operations',
  },
  {
    value: 'finance-banking',
    title: 'Finance & Banking',
    description: 'Finance operations, accounting, banking, risk, and controls',
  },
  {
    value: 'sales-service',
    title: 'Sales & Service',
    description: 'Sales, customer service, account support, and relationships',
  },
  {
    value: 'other',
    title: 'Something else',
    description: 'KerjaLog can still use general work prompts',
  },
];

export const careerLevelOptions: ReadonlyArray<{
  value: CareerLevel;
  title: string;
  description: string;
}> = [
  {
    value: 'new-to-working',
    title: 'New to working',
    description: 'Starting your first professional role',
  },
  {
    value: 'junior-contributor',
    title: 'Junior individual contributor',
    description: 'Roughly 1–4 years of experience',
  },
  {
    value: 'experienced-contributor',
    title: 'Experienced individual contributor',
    description: 'Working independently with deeper ownership',
  },
  {
    value: 'supervisor',
    title: 'Supervisor or team lead',
    description: 'Responsible for coordinating or guiding other people',
  },
];

export const goalOptions: ReadonlyArray<{
  value: MainGoal;
  title: string;
  description: string;
}> = [
  {
    value: 'performance-review',
    title: 'Prepare for performance reviews',
    description: 'Turn real work into a clearer self-review',
  },
  {
    value: 'remember-work',
    title: 'Remember what I worked on',
    description: 'Keep routine work from disappearing over time',
  },
  {
    value: 'understand-growth',
    title: 'Understand my growth',
    description: 'See which skills have real supporting evidence',
  },
  {
    value: 'resume',
    title: 'Strengthen my résumé',
    description: 'Turn contributions into useful achievement statements',
  },
  {
    value: 'interview',
    title: 'Prepare interview examples',
    description: 'Build evidence-backed stories from work you already did',
  },
];

export const reviewScheduleOptions: ReadonlyArray<{
  value: ReviewSchedule;
  title: string;
  description: string;
}> = [
  {
    value: 'within-3-months',
    title: 'Within the next 3 months',
    description: 'Keep recent examples easy to find',
  },
  {
    value: 'within-6-months',
    title: 'Within the next 6 months',
    description: 'Build a useful evidence base gradually',
  },
  {
    value: 'within-12-months',
    title: 'Within the next 12 months',
    description: 'Capture work throughout the year',
  },
  {
    value: 'not-sure',
    title: 'I am not sure yet',
    description: 'You can set or change this later',
  },
];
