import type { Href } from 'expo-router';
import { TabList, TabSlot, Tabs, TabTrigger } from 'expo-router/ui';
import { SymbolView } from 'expo-symbols';
import type { ComponentProps, Ref } from 'react';
import { Pressable, type PressableProps, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { useI18n } from '@/i18n/I18nProvider';
import type { TranslationKey } from '@/i18n/translations';

type SymbolName = ComponentProps<typeof SymbolView>['name'];

type TabDefinition = {
  name: string;
  href: Href;
  labelKey: TranslationKey;
  shortLabelKey?: TranslationKey;
  icon: SymbolName;
  capture?: boolean;
};

const tabs = [
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

export function AppTabs() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs>
      <View style={styles.content}>
        <TabSlot />
      </View>

      <TabList
        style={[
          styles.tabBar,
          {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
            paddingBottom: Math.max(insets.bottom, 8),
          },
        ]}
      >
        {tabs.map((tab) => (
          <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
            <AppTabButton tab={tab} />
          </TabTrigger>
        ))}
      </TabList>
    </Tabs>
  );
}

type AppTabButtonProps = PressableProps & {
  tab: TabDefinition;
  isFocused?: boolean;
  ref?: Ref<View>;
};

function AppTabButton({
  tab,
  isFocused = false,
  ref,
  accessibilityState,
  ...props
}: AppTabButtonProps) {
  const { theme } = useTheme();
  const { t } = useI18n();
  const tintColor = isFocused ? theme.colors.primary : theme.colors.textMuted;
  const visibleLabelKey = tab.shortLabelKey ?? tab.labelKey;

  return (
    <Pressable
      {...props}
      ref={ref}
      accessibilityLabel={t(tab.labelKey)}
      accessibilityState={{ ...accessibilityState, selected: isFocused }}
      style={({ pressed }) => [
        styles.tabItem,
        tab.capture && styles.captureItem,
        pressed && styles.pressed,
      ]}
    >
      {tab.capture ? (
        <View
          style={[
            styles.captureButton,
            {
              backgroundColor: theme.colors.primary,
              borderColor: theme.colors.surface,
            },
          ]}
        >
          <SymbolView
            name={tab.icon}
            size={26}
            tintColor={theme.colors.onPrimary}
          />
        </View>
      ) : (
        <SymbolView name={tab.icon} size={22} tintColor={tintColor} />
      )}

      <Text
        variant="caption"
        color={isFocused ? 'primary' : 'textMuted'}
        style={tab.capture ? styles.captureLabel : styles.tabLabel}
      >
        {t(visibleLabelKey)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  tabBar: {
    alignItems: 'flex-end',
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    minHeight: 72,
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  tabItem: {
    alignItems: 'center',
    flex: 1,
    gap: 3,
    justifyContent: 'center',
    minHeight: 52,
    minWidth: 48,
  },
  captureItem: {
    justifyContent: 'flex-end',
  },
  captureButton: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 5,
    height: 58,
    justifyContent: 'center',
    marginTop: -27,
    width: 58,
  },
  captureLabel: {
    marginTop: -1,
  },
  tabLabel: {
    lineHeight: 16,
  },
  pressed: {
    opacity: 0.7,
  },
});
