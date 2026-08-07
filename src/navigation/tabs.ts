import type { Href } from 'expo-router';
import type { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import type { TranslationKey } from '@/i18n/translations';

type SymbolName = ComponentProps<typeof SymbolView>['name'];

export type TabDefinition = {
  name: string;
  href: Href;
  labelKey: TranslationKey;
  shortLabelKey?: TranslationKey;
  icon: SymbolName;
  capture?: boolean;
};

export const tabs = [
  {
    name: 'home',
    href: '/home',
    labelKey: 'tabs.home',
    icon: { ios: 'house.fill', android: 'home', web: 'home' },
  },
  {
    name: 'history',
    href: '/history',
    labelKey: 'tabs.history',
    icon: { ios: 'clock.arrow.circlepath', android: 'history', web: 'history' },
  },
  {
    name: 'capture',
    href: '/capture',
    labelKey: 'tabs.logWork',
    shortLabelKey: 'tabs.log',
    icon: { ios: 'plus', android: 'add', web: 'add' },
    capture: true,
  },
  {
    name: 'growth',
    href: '/growth',
    labelKey: 'tabs.growth',
    icon: {
      ios: 'chart.line.uptrend.xyaxis',
      android: 'trending_up',
      web: 'trending_up',
    },
  },
  {
    name: 'review',
    href: '/review',
    labelKey: 'tabs.review',
    icon: { ios: 'doc.text.fill', android: 'description', web: 'description' },
  },
] satisfies ReadonlyArray<TabDefinition>;
