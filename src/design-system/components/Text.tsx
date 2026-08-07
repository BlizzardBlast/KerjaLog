import type { PropsWithChildren } from 'react';
import {
  Text as NativeText,
  type TextProps as NativeTextProps,
  type TextStyle,
} from 'react-native';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import type {
  ThemeColors,
  TypographyVariant,
} from '@/design-system/tokens/theme';

export type TextProps = PropsWithChildren<
  Omit<NativeTextProps, 'style'> & {
    variant?: TypographyVariant;
    color?: keyof ThemeColors;
    style?: NativeTextProps['style'];
  }
>;

export function Text({
  variant = 'body',
  color = 'text',
  style,
  children,
  ...props
}: TextProps) {
  const { theme } = useTheme();
  const variantStyle = theme.typography[variant] as TextStyle;

  return (
    <NativeText
      {...props}
      style={[variantStyle, { color: theme.colors[color] }, style]}
    >
      {children}
    </NativeText>
  );
}
