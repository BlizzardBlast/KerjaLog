import type { ComponentProps } from 'react';
import { usePathname, type Href } from 'expo-router';
import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';

type SymbolName = ComponentProps<typeof SymbolView>['name'];

type TabDefinition = {
  name: string;
  href: Href;
  label: string;
  icon: SymbolName;
  capture?: boolean;
};

const tabs = [
  {
    name: 'home',
    href: '/home',
    label: 'Home',
    icon: { ios: 'house.fill', android: 'home', web: 'home' },
  },
  {
    name: 'history',
    href: '/history',
    label: 'History',
    icon: { ios: 'clock.arrow.circlepath', android: 'history', web: 'history' },
  },
  {
    name: 'capture',
    href: '/capture',
    label: 'Log work',
    icon: { ios: 'plus', android: 'add', web: 'add' },
    capture: true,
  },
  {
    name: 'growth',
    href: '/growth',
    label: 'Growth',
    icon: {
      ios: 'chart.line.uptrend.xyaxis',
      android: 'trending_up',
      web: 'trending_up',
    },
  },
  {
    name: 'review',
    href: '/review',
    label: 'Review',
    icon: { ios: 'doc.text.fill', android: 'description', web: 'description' },
  },
] satisfies ReadonlyArray<TabDefinition>;

export function AppTabs() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

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
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const tintColor = isActive
            ? theme.colors.primary
            : theme.colors.textMuted;

          return (
            <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
              <Pressable
                accessibilityLabel={tab.label}
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
                  color={isActive ? 'primary' : 'textMuted'}
                  style={tab.capture ? styles.captureLabel : styles.tabLabel}
                >
                  {tab.capture ? 'Log' : tab.label}
                </Text>
              </Pressable>
            </TabTrigger>
          );
        })}
      </TabList>
    </Tabs>
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
