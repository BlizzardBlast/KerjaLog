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

const dynamicTypeRampByVariant = {
  display: 'largeTitle',
  title: 'title1',
  heading: 'title2',
  subheading: 'title3',
  body: 'body',
  bodyStrong: 'body',
  label: 'callout',
  caption: 'caption1',
  overline: 'caption2',
} as const satisfies Record<
  TypographyVariant,
  NonNullable<NativeTextProps['dynamicTypeRamp']>
>;

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
  dynamicTypeRamp = dynamicTypeRampByVariant[variant],
  style,
  children,
  ...props
}: TextProps) {
  const { theme } = useTheme();
  const variantStyle = theme.typography[variant] as TextStyle;

  return (
    <NativeText
      {...props}
      dynamicTypeRamp={dynamicTypeRamp}
      style={[variantStyle, { color: theme.colors[color] }, style]}
    >
      {children}
    </NativeText>
  );
}
