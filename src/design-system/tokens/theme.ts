import type { TextStyle } from 'react-native';

export type ThemeMode = 'system' | 'light' | 'dark';
export type ResolvedTheme = Exclude<ThemeMode, 'system'>;

export type ThemeColors = {
  canvas: string;
  surface: string;
  surfaceSubtle: string;
  surfaceMuted: string;
  text: string;
  textMuted: string;
  border: string;
  controlBorder: string;
  controlBorderFocused: string;
  primary: string;
  primaryPressed: string;
  primarySoft: string;
  onPrimary: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  onDanger: string;
  controlTrackOff: string;
  controlThumb: string;
};

export type AppTheme = {
  colors: ThemeColors;
  spacing: typeof spacing;
  layout: typeof layout;
  radii: typeof radii;
  typography: typeof typography;
};

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
} as const;

export const layout = {
  screenHorizontalPadding: spacing[6],
} as const;

export const radii = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  full: 999,
} as const;

export const fontFamilies = {
  medium: 'Manrope_500Medium',
  semiBold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extraBold: 'Manrope_800ExtraBold',
} as const;

export type TypographyVariant =
  | 'display'
  | 'title'
  | 'heading'
  | 'subheading'
  | 'body'
  | 'bodyStrong'
  | 'label'
  | 'caption'
  | 'overline';

export const typography = {
  display: {
    fontFamily: fontFamilies.bold,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.8,
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.55,
  },
  heading: {
    fontFamily: fontFamilies.bold,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  subheading: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.1,
  },
  body: {
    fontFamily: fontFamilies.medium,
    fontSize: 16,
    lineHeight: 25,
  },
  bodyStrong: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 16,
    lineHeight: 24,
  },
  label: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontFamily: fontFamilies.medium,
    fontSize: 13,
    lineHeight: 19,
  },
  overline: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
} satisfies Record<TypographyVariant, TextStyle>;

const lightColors: ThemeColors = {
  canvas: '#F7F3EE',
  surface: '#FFFDFC',
  surfaceSubtle: '#F2EDE7',
  surfaceMuted: '#EBE4DC',
  text: '#211B2A',
  textMuted: '#6F6675',
  border: '#DED6DF',
  controlBorder: '#9A8E9D',
  controlBorderFocused: '#7138F2',
  primary: '#7138F2',
  primaryPressed: '#5121A8',
  primarySoft: '#EEE7FF',
  onPrimary: '#FFFFFF',
  success: '#167A4D',
  successSoft: '#E1F5EA',
  warning: '#A5570D',
  warningSoft: '#FFF0D9',
  danger: '#B42318',
  dangerSoft: '#FEECEB',
  onDanger: '#FFFFFF',
  controlTrackOff: '#9A8E9D',
  controlThumb: '#FFFDFC',
};

const darkColors: ThemeColors = {
  canvas: '#151218',
  surface: '#211C25',
  surfaceSubtle: '#2A242E',
  surfaceMuted: '#342D38',
  text: '#F8F3FB',
  textMuted: '#BCB2C1',
  border: '#453D49',
  controlBorder: '#756A7D',
  controlBorderFocused: '#A78BFA',
  primary: '#A78BFA',
  primaryPressed: '#916BF7',
  primarySoft: '#39265E',
  onPrimary: '#151218',
  success: '#5BCB91',
  successSoft: '#173D2D',
  warning: '#F2A45D',
  warningSoft: '#4B3019',
  danger: '#FF8177',
  dangerSoft: '#4A2425',
  onDanger: '#151218',
  controlTrackOff: '#756A7D',
  controlThumb: '#FFFDFC',
};

export const themes: Record<ResolvedTheme, AppTheme> = {
  light: {
    colors: lightColors,
    spacing,
    layout,
    radii,
    typography,
  },
  dark: {
    colors: darkColors,
    spacing,
    layout,
    radii,
    typography,
  },
};
