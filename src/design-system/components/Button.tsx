import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { DecorativeView } from '@/design-system/components/DecorativeView';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import {
  type AppTheme,
  radii,
  spacing,
  type ThemeColors,
} from '@/design-system/tokens/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = Omit<
  PressableProps,
  'children' | 'disabled' | 'style'
> & {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

type ButtonVariantConfig = {
  containerStyle: ViewStyle;
  pressedStyle: ViewStyle;
  labelColor: keyof ThemeColors;
};

const sizeStyles: Record<ButtonSize, ViewStyle> = {
  sm: {
    minHeight: spacing[12],
    paddingHorizontal: spacing[4],
    paddingVertical: 10,
  },
  md: {
    minHeight: 52,
    paddingHorizontal: 18,
    paddingVertical: spacing[3],
  },
  lg: {
    minHeight: 56,
    paddingHorizontal: spacing[5],
    paddingVertical: 14,
  },
};

function getVariantConfigs(
  theme: AppTheme,
): Record<ButtonVariant, ButtonVariantConfig> {
  return {
    primary: {
      containerStyle: { backgroundColor: theme.colors.primary },
      pressedStyle: { backgroundColor: theme.colors.primaryPressed },
      labelColor: 'onPrimary',
    },
    secondary: {
      containerStyle: {
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.controlBorder,
        borderWidth: 1,
      },
      pressedStyle: { backgroundColor: theme.colors.primarySoft },
      labelColor: 'text',
    },
    ghost: {
      containerStyle: { backgroundColor: 'transparent' },
      pressedStyle: { backgroundColor: theme.colors.surfaceSubtle },
      labelColor: 'primary',
    },
    destructive: {
      containerStyle: { backgroundColor: theme.colors.danger },
      pressedStyle: styles.pressed,
      labelColor: 'onDanger',
    },
  };
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  leadingIcon,
  trailingIcon,
  style,
  accessibilityState,
  accessibilityRole = 'button',
  ...props
}: Readonly<ButtonProps>) {
  const { theme } = useTheme();
  const isDisabled = disabled || loading;
  const variantConfig = getVariantConfigs(theme)[variant];

  return (
    <Pressable
      {...props}
      accessibilityRole={accessibilityRole}
      accessibilityState={{
        ...accessibilityState,
        disabled: isDisabled,
        busy: loading,
      }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        sizeStyles[size],
        variantConfig.containerStyle,
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && variantConfig.pressedStyle,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <DecorativeView>
            <ActivityIndicator
              color={theme.colors[variantConfig.labelColor]}
              size="small"
            />
          </DecorativeView>
        ) : (
          leadingIcon
        )}
        {typeof children === 'string' || typeof children === 'number' ? (
          <Text
            variant="label"
            color={variantConfig.labelColor}
            style={styles.label}
          >
            {children}
          </Text>
        ) : (
          children
        )}
        {!loading && trailingIcon}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 1,
    gap: spacing[2],
    justifyContent: 'center',
  },
  label: {
    flexShrink: 1,
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.82,
  },
});
