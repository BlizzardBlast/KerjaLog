import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { DecorativeView } from '@/design-system/components/DecorativeView';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { motion } from '@/design-system/tokens/motion';
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
  const selectionProgress = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    selectionProgress.value = withTiming(selected ? 1 : 0, {
      duration: motion.duration.state,
      easing: Easing.out(Easing.cubic),
      reduceMotion: ReduceMotion.System,
    });
  }, [selected, selectionProgress]);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      selectionProgress.value,
      [0, 1],
      [theme.colors.surface, theme.colors.primarySoft],
    ),
    borderColor: interpolateColor(
      selectionProgress.value,
      [0, 1],
      [theme.colors.controlBorder, theme.colors.controlBorderFocused],
    ),
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      selectionProgress.value,
      [0, 1],
      [theme.colors.surfaceSubtle, theme.colors.primary],
    ),
  }));

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled }}
      disabled={disabled}
      onPress={onPress}
    >
      {({ pressed }) => (
        <Animated.View
          style={[
            styles.container,
            cardAnimatedStyle,
            selected && styles.selected,
            pressed && !disabled && styles.pressed,
            disabled && styles.disabled,
          ]}
        >
          {icon ? (
            <DecorativeView>
              <Animated.View style={[styles.iconContainer, iconAnimatedStyle]}>
                <SymbolView
                  name={icon}
                  size={20}
                  tintColor={
                    selected ? theme.colors.onPrimary : theme.colors.textMuted
                  }
                />
              </Animated.View>
            </DecorativeView>
          ) : null}

          <View style={styles.copy}>
            <Text variant="bodyStrong">{title}</Text>
            {description ? (
              <Text
                variant="caption"
                color="textMuted"
                style={styles.description}
              >
                {description}
              </Text>
            ) : null}
          </View>
        </Animated.View>
      )}
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
