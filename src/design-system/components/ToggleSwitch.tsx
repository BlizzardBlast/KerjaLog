import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii } from '@/design-system/tokens/theme';

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
      <View
        style={[
          styles.track,
          {
            backgroundColor: value
              ? theme.colors.primary
              : theme.colors.controlTrackOff,
          },
        ]}
      >
        <View
          style={[
            styles.thumb,
            {
              backgroundColor: theme.colors.controlThumb,
              transform: [{ translateX: value ? 20 : 0 }],
            },
          ]}
        />
      </View>
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
