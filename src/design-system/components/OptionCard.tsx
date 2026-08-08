import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { DecorativeView } from '@/design-system/components/DecorativeView';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing } from '@/design-system/tokens/theme';

export type OptionCardIcon = ComponentProps<typeof SymbolView>['name'];

export type OptionCardProps = {
  title: string;
  description?: string;
  icon?: OptionCardIcon;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
};

export function OptionCard({
  title,
  description,
  icon,
  selected,
  onPress,
  disabled = false,
}: OptionCardProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: selected
            ? theme.colors.primarySoft
            : theme.colors.surface,
          borderColor: selected ? theme.colors.primary : theme.colors.border,
        },
        selected && styles.selected,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {icon ? (
        <DecorativeView
          style={[
            styles.iconContainer,
            {
              backgroundColor: selected
                ? theme.colors.primary
                : theme.colors.surfaceSubtle,
            },
          ]}
        >
          <SymbolView
            name={icon}
            size={20}
            tintColor={
              selected ? theme.colors.onPrimary : theme.colors.textMuted
            }
          />
        </DecorativeView>
      ) : null}

      <View style={styles.copy}>
        <Text variant="bodyStrong">{title}</Text>
        {description ? (
          <Text variant="caption" color="textMuted" style={styles.description}>
            {description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing[3],
    minHeight: 68,
    padding: 14,
  },
  selected: {
    borderWidth: 2,
    padding: 13,
  },
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.5,
  },
  iconContainer: {
    alignItems: 'center',
    borderRadius: radii.sm,
    height: spacing[10],
    justifyContent: 'center',
    width: spacing[10],
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  description: {
    marginTop: 3,
  },
});
