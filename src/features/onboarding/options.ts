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
};

export const workAreaOptions: ReadonlyArray<LocalizedOption<WorkArea>> = [
  {
    value: 'technology-product',
    titleKey: 'onboarding.workArea.technologyProduct.title',
    descriptionKey: 'onboarding.workArea.technologyProduct.description',
  },
  {
    value: 'operations-administration',
    titleKey: 'onboarding.workArea.operationsAdministration.title',
    descriptionKey: 'onboarding.workArea.operationsAdministration.description',
  },
  {
    value: 'finance-banking',
    titleKey: 'onboarding.workArea.financeBanking.title',
    descriptionKey: 'onboarding.workArea.financeBanking.description',
  },
  {
    value: 'sales-service',
    titleKey: 'onboarding.workArea.salesService.title',
    descriptionKey: 'onboarding.workArea.salesService.description',
  },
  {
    value: 'other',
    titleKey: 'onboarding.workArea.other.title',
    descriptionKey: 'onboarding.workArea.other.description',
  },
];

export const careerLevelOptions: ReadonlyArray<LocalizedOption<CareerLevel>> = [
  {
    value: 'new-to-working',
    titleKey: 'onboarding.careerLevel.newToWorking.title',
    descriptionKey: 'onboarding.careerLevel.newToWorking.description',
  },
  {
    value: 'junior-contributor',
    titleKey: 'onboarding.careerLevel.juniorContributor.title',
    descriptionKey: 'onboarding.careerLevel.juniorContributor.description',
  },
  {
    value: 'experienced-contributor',
    titleKey: 'onboarding.careerLevel.experiencedContributor.title',
    descriptionKey: 'onboarding.careerLevel.experiencedContributor.description',
  },
  {
    value: 'supervisor',
    titleKey: 'onboarding.careerLevel.supervisor.title',
    descriptionKey: 'onboarding.careerLevel.supervisor.description',
  },
];

export const goalOptions: ReadonlyArray<LocalizedOption<MainGoal>> = [
  {
    value: 'performance-review',
    titleKey: 'onboarding.goalOption.performanceReview.title',
    descriptionKey: 'onboarding.goalOption.performanceReview.description',
  },
  {
    value: 'remember-work',
    titleKey: 'onboarding.goalOption.rememberWork.title',
    descriptionKey: 'onboarding.goalOption.rememberWork.description',
  },
  {
    value: 'understand-growth',
    titleKey: 'onboarding.goalOption.understandGrowth.title',
    descriptionKey: 'onboarding.goalOption.understandGrowth.description',
  },
  {
    value: 'resume',
    titleKey: 'onboarding.goalOption.resume.title',
    descriptionKey: 'onboarding.goalOption.resume.description',
  },
  {
    value: 'interview',
    titleKey: 'onboarding.goalOption.interview.title',
    descriptionKey: 'onboarding.goalOption.interview.description',
  },
];

export const reviewScheduleOptions: ReadonlyArray<
  LocalizedOption<ReviewSchedule>
> = [
  {
    value: 'within-3-months',
    titleKey: 'onboarding.reviewSchedule.within3Months.title',
    descriptionKey: 'onboarding.reviewSchedule.within3Months.description',
  },
  {
    value: 'within-6-months',
    titleKey: 'onboarding.reviewSchedule.within6Months.title',
    descriptionKey: 'onboarding.reviewSchedule.within6Months.description',
  },
  {
    value: 'within-12-months',
    titleKey: 'onboarding.reviewSchedule.within12Months.title',
    descriptionKey: 'onboarding.reviewSchedule.within12Months.description',
  },
  {
    value: 'not-sure',
    titleKey: 'onboarding.reviewSchedule.notSure.title',
    descriptionKey: 'onboarding.reviewSchedule.notSure.description',
  },
];
