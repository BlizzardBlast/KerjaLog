import type { TranslationKey } from '@/i18n/catalog';

export type Translate = (
  key: TranslationKey,
  params?: Record<string, string | number>,
) => string;

export type LogStepFrameProps = {
  backLabel: string;
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
};
