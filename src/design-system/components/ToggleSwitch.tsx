import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { motion } from '@/design-system/tokens/motion';
import { radii } from '@/design-system/tokens/theme';

const THUMB_TRAVEL = 20;

export type ToggleSwitchProps = {
  accessibilityLabel: string;
  accessibilityHint?: string;
  value: boolean;
  disabled?: boolean;
  onValueChange: (value: boolean) => void | Promise<void>;
};

export function ToggleSwitch({
  accessibilityLabel,
  accessibilityHint,
  value,
  disabled = false,
  onValueChange,
}: ToggleSwitchProps) {
  const { theme } = useTheme();
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, {
      duration: motion.duration.state,
      easing: Easing.out(Easing.cubic),
      reduceMotion: ReduceMotion.System,
    });
  }, [progress, value]);

  const trackAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [theme.colors.controlTrackOff, theme.colors.primary],
    ),
  }));

  const thumbAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * THUMB_TRAVEL }],
  }));

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      style={({ pressed }) => [
        styles.touchTarget,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Animated.View style={[styles.track, trackAnimatedStyle]}>
        <Animated.View
          style={[
            styles.thumb,
            { backgroundColor: theme.colors.controlThumb },
            thumbAnimatedStyle,
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  touchTarget: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    width: 52,
  },
  track: {
    borderRadius: radii.full,
    height: 28,
    padding: 3,
    width: 48,
  },
  thumb: {
    borderRadius: radii.full,
    height: 22,
    width: 22,
  },
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.5,
  },
});
