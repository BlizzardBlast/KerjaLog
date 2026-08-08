import type { OptionCardIcon } from '@/design-system/components/OptionCard';
import type {
  CareerLevel,
  MainGoal,
  ReviewSchedule,
  WorkArea,
} from '@/features/onboarding/model';
import type { TranslationKey } from '@/i18n/translations';

type LocalizedOption<T extends string> = {
  value: T;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  icon: OptionCardIcon;
};

export const workAreaOptions: ReadonlyArray<LocalizedOption<WorkArea>> = [
  {
    value: 'technology-product',
    titleKey: 'onboarding.workArea.technologyProduct.title',
    descriptionKey: 'onboarding.workArea.technologyProduct.description',
    icon: {
      ios: 'chevron.left.forwardslash.chevron.right',
      android: 'code',
      web: 'code',
    },
  },
  {
    value: 'operations-administration',
    titleKey: 'onboarding.workArea.operationsAdministration.title',
    descriptionKey: 'onboarding.workArea.operationsAdministration.description',
    icon: { ios: 'gearshape.2', android: 'settings', web: 'settings' },
  },
  {
    value: 'finance-banking',
    titleKey: 'onboarding.workArea.financeBanking.title',
    descriptionKey: 'onboarding.workArea.financeBanking.description',
    icon: {
      ios: 'banknote',
      android: 'account_balance',
      web: 'account_balance',
    },
  },
  {
    value: 'sales-service',
    titleKey: 'onboarding.workArea.salesService.title',
    descriptionKey: 'onboarding.workArea.salesService.description',
    icon: {
      ios: 'person.2',
      android: 'support_agent',
      web: 'support_agent',
    },
  },
  {
    value: 'other',
    titleKey: 'onboarding.workArea.other.title',
    descriptionKey: 'onboarding.workArea.other.description',
    icon: {
      ios: 'ellipsis.circle',
      android: 'more_horiz',
      web: 'more_horiz',
    },
  },
];

export const careerLevelOptions: ReadonlyArray<LocalizedOption<CareerLevel>> = [
  {
    value: 'new-to-working',
    titleKey: 'onboarding.careerLevel.newToWorking.title',
    descriptionKey: 'onboarding.careerLevel.newToWorking.description',
    icon: { ios: 'leaf', android: 'eco', web: 'eco' },
  },
  {
    value: 'junior-contributor',
    titleKey: 'onboarding.careerLevel.juniorContributor.title',
    descriptionKey: 'onboarding.careerLevel.juniorContributor.description',
    icon: { ios: 'person', android: 'person', web: 'person' },
  },
  {
    value: 'experienced-contributor',
    titleKey: 'onboarding.careerLevel.experiencedContributor.title',
    descriptionKey: 'onboarding.careerLevel.experiencedContributor.description',
    icon: { ios: 'star', android: 'star', web: 'star' },
  },
  {
    value: 'supervisor',
    titleKey: 'onboarding.careerLevel.supervisor.title',
    descriptionKey: 'onboarding.careerLevel.supervisor.description',
    icon: { ios: 'person.3', android: 'groups', web: 'groups' },
  },
];

export const goalOptions: ReadonlyArray<LocalizedOption<MainGoal>> = [
  {
    value: 'performance-review',
    titleKey: 'onboarding.goalOption.performanceReview.title',
    descriptionKey: 'onboarding.goalOption.performanceReview.description',
    icon: { ios: 'doc.text', android: 'description', web: 'description' },
  },
  {
    value: 'remember-work',
    titleKey: 'onboarding.goalOption.rememberWork.title',
    descriptionKey: 'onboarding.goalOption.rememberWork.description',
    icon: { ios: 'clock', android: 'history', web: 'history' },
  },
  {
    value: 'understand-growth',
    titleKey: 'onboarding.goalOption.understandGrowth.title',
    descriptionKey: 'onboarding.goalOption.understandGrowth.description',
    icon: {
      ios: 'chart.line.uptrend.xyaxis',
      android: 'trending_up',
      web: 'trending_up',
    },
  },
  {
    value: 'resume',
    titleKey: 'onboarding.goalOption.resume.title',
    descriptionKey: 'onboarding.goalOption.resume.description',
    icon: { ios: 'doc', android: 'article', web: 'article' },
  },
  {
    value: 'interview',
    titleKey: 'onboarding.goalOption.interview.title',
    descriptionKey: 'onboarding.goalOption.interview.description',
    icon: {
      ios: 'bubble.left.and.bubble.right',
      android: 'forum',
      web: 'forum',
    },
  },
];

export const reviewScheduleOptions: ReadonlyArray<
  LocalizedOption<ReviewSchedule>
> = [
  {
    value: 'within-3-months',
    titleKey: 'onboarding.reviewSchedule.within3Months.title',
    descriptionKey: 'onboarding.reviewSchedule.within3Months.description',
    icon: {
      ios: 'calendar',
      android: 'calendar_month',
      web: 'calendar_month',
    },
  },
  {
    value: 'within-6-months',
    titleKey: 'onboarding.reviewSchedule.within6Months.title',
    descriptionKey: 'onboarding.reviewSchedule.within6Months.description',
    icon: {
      ios: 'calendar',
      android: 'calendar_month',
      web: 'calendar_month',
    },
  },
  {
    value: 'within-12-months',
    titleKey: 'onboarding.reviewSchedule.within12Months.title',
    descriptionKey: 'onboarding.reviewSchedule.within12Months.description',
    icon: {
      ios: 'calendar',
      android: 'calendar_month',
      web: 'calendar_month',
    },
  },
  {
    value: 'not-sure',
    titleKey: 'onboarding.reviewSchedule.notSure.title',
    descriptionKey: 'onboarding.reviewSchedule.notSure.description',
    icon: {
      ios: 'questionmark.circle',
      android: 'help_outline',
      web: 'help_outline',
    },
  },
];
