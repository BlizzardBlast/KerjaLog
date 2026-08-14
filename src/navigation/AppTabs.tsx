import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing } from '@/design-system/tokens/theme';
import { useI18n } from '@/i18n/I18nProvider';
import { tabs } from '@/navigation/tabs';

export function AppTabs() {
  const { theme } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, spacing[2]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: theme.colors.surface },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarHideOnKeyboard: true,
        tabBarLabelPosition: 'below-icon',
        tabBarItemStyle: styles.tabItem,
        tabBarLabelStyle: theme.typography.caption,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
            height: 64 + bottomPadding,
            paddingBottom: bottomPadding,
          },
        ],
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: t(tab.labelKey),
            tabBarAccessibilityLabel: t(tab.labelKey),
            tabBarLabel: t(tab.shortLabelKey ?? tab.labelKey),
            tabBarIcon: ({ color }) =>
              tab.capture ? (
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
                <SymbolView name={tab.icon} size={22} tintColor={color} />
              ),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing[2],
  },
  tabItem: {
    minHeight: 52,
    overflow: 'visible',
  },
  captureButton: {
    alignItems: 'center',
    borderRadius: radii.full,
    borderWidth: 5,
    height: 58,
    justifyContent: 'center',
    marginTop: -20,
    width: 58,
  },
});
