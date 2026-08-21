import type { AppIconName } from '@/design-system/icons/AppIcon';
import type { TranslationKey } from '@/i18n/catalog';

export type AppTabName = 'home' | 'history' | 'capture' | 'growth' | 'review';

export type TabDefinition = {
  name: AppTabName;
  labelKey: TranslationKey;
  shortLabelKey?: TranslationKey;
  icon: AppIconName;
  capture?: boolean;
};

export const tabs: readonly TabDefinition[] = [
  {
    name: 'home',
    labelKey: 'tabs.home',
    icon: { ios: 'house.fill', android: 'home' },
  },
  {
    name: 'history',
    labelKey: 'tabs.history',
    icon: { ios: 'clock.arrow.circlepath', android: 'history' },
  },
  {
    name: 'capture',
    labelKey: 'tabs.logWork',
    shortLabelKey: 'tabs.log',
    icon: { ios: 'plus', android: 'add' },
    capture: true,
  },
  {
    name: 'growth',
    labelKey: 'tabs.growth',
    icon: {
      ios: 'chart.line.uptrend.xyaxis',
      android: 'trending_up',
    },
  },
  {
    name: 'review',
    labelKey: 'tabs.review',
    icon: { ios: 'doc.text.fill', android: 'description' },
  },
];
