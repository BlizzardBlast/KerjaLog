import type { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import type { TranslationKey } from '@/i18n/catalog';

type SymbolName = ComponentProps<typeof SymbolView>['name'];

export type AppTabName = 'home' | 'history' | 'capture' | 'growth' | 'review';

export type TabDefinition = {
  name: AppTabName;
  labelKey: TranslationKey;
  shortLabelKey?: TranslationKey;
  icon: SymbolName;
  capture?: boolean;
};

export const tabs: readonly TabDefinition[] = [
  {
    name: 'home',
    labelKey: 'tabs.home',
    icon: { ios: 'house.fill', android: 'home', web: 'home' },
  },
  {
    name: 'history',
    labelKey: 'tabs.history',
    icon: { ios: 'clock.arrow.circlepath', android: 'history', web: 'history' },
  },
  {
    name: 'capture',
    labelKey: 'tabs.logWork',
    shortLabelKey: 'tabs.log',
    icon: { ios: 'plus', android: 'add', web: 'add' },
    capture: true,
  },
  {
    name: 'growth',
    labelKey: 'tabs.growth',
    icon: {
      ios: 'chart.line.uptrend.xyaxis',
      android: 'trending_up',
      web: 'trending_up',
    },
  },
  {
    name: 'review',
    labelKey: 'tabs.review',
    icon: { ios: 'doc.text.fill', android: 'description', web: 'description' },
  },
];
