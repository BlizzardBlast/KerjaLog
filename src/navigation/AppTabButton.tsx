import { SymbolView } from 'expo-symbols';
import type { Ref } from 'react';
import { Pressable, type PressableProps, StyleSheet, View } from 'react-native';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing } from '@/design-system/tokens/theme';
import { useI18n } from '@/i18n/I18nProvider';
import type { TabDefinition } from '@/navigation/tabs';

export type AppTabButtonProps = PressableProps & {
  tab: TabDefinition;
  isFocused?: boolean;
  ref?: Ref<View>;
};

export function AppTabButton({
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
  tabItem: {
    alignItems: 'center',
    flex: 1,
    gap: 3,
    justifyContent: 'center',
    minHeight: 52,
    minWidth: spacing[12],
  },
  captureItem: {
    justifyContent: 'flex-end',
  },
  captureButton: {
    alignItems: 'center',
    borderRadius: radii.full,
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
    lineHeight: spacing[4],
  },
  pressed: {
    opacity: 0.7,
  },
});
