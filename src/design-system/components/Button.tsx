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
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';

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

const sizeStyles: Record<ButtonSize, ViewStyle> = {
  sm: {
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  md: {
    minHeight: 52,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  lg: {
    minHeight: 56,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
};

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
}: ButtonProps) {
  const { theme } = useTheme();
  const isDisabled = disabled || loading;

  const variantStyle: ViewStyle = (() => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderWidth: 1,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
        };
      case 'destructive':
        return {
          backgroundColor: theme.colors.danger,
        };
      default:
        return {
          backgroundColor: theme.colors.primary,
        };
    }
  })();

  const labelColor =
    variant === 'primary' || variant === 'destructive'
      ? 'onPrimary'
      : variant === 'secondary'
        ? 'text'
        : 'primary';

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
        variantStyle,
        fullWidth && styles.fullWidth,
        pressed && !isDisabled
          ? variant === 'primary'
            ? { backgroundColor: theme.colors.primaryPressed }
            : variant === 'ghost'
              ? { backgroundColor: theme.colors.surfaceSubtle }
              : variant === 'secondary'
                ? { backgroundColor: theme.colors.primarySoft }
                : styles.pressed
          : null,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator
            accessibilityElementsHidden
            color={theme.colors[labelColor]}
            size="small"
          />
        ) : (
          leadingIcon
        )}
        {typeof children === 'string' || typeof children === 'number' ? (
          <Text variant="label" color={labelColor} style={styles.label}>
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
    borderRadius: 16,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  label: {
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.82,
  },
});
