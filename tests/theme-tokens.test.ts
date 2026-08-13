import {
  fontFamilies,
  themes,
  typography,
} from '@/design-system/tokens/theme';

const MINIMUM_NORMAL_TEXT_CONTRAST = 4.5;
const MINIMUM_NON_TEXT_CONTRAST = 3;

function channelToLinear(value: number): number {
  const normalized = value / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number {
  const value = hex.replace('#', '');
  const red = channelToLinear(Number.parseInt(value.slice(0, 2), 16));
  const green = channelToLinear(Number.parseInt(value.slice(2, 4), 16));
  const blue = channelToLinear(Number.parseInt(value.slice(4, 6), 16));

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(foreground: string, background: string): number {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

describe('theme token contrast', () => {
  test.each([
    [
      'light primary',
      themes.light.colors.onPrimary,
      themes.light.colors.primary,
    ],
    [
      'light primary pressed',
      themes.light.colors.onPrimary,
      themes.light.colors.primaryPressed,
    ],
    [
      'light warning',
      themes.light.colors.warning,
      themes.light.colors.warningSoft,
    ],
    ['light danger', themes.light.colors.onDanger, themes.light.colors.danger],
    ['dark primary', themes.dark.colors.onPrimary, themes.dark.colors.primary],
    [
      'dark primary pressed',
      themes.dark.colors.onPrimary,
      themes.dark.colors.primaryPressed,
    ],
    [
      'dark warning',
      themes.dark.colors.warning,
      themes.dark.colors.warningSoft,
    ],
    ['dark danger', themes.dark.colors.onDanger, themes.dark.colors.danger],
  ])('%s meets WCAG AA normal-text contrast', (_, foreground, background) => {
    expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(
      MINIMUM_NORMAL_TEXT_CONTRAST,
    );
  });

  test.each([
    [
      'light switch off track',
      themes.light.colors.controlTrackOff,
      themes.light.colors.surface,
    ],
    [
      'dark switch off track',
      themes.dark.colors.controlTrackOff,
      themes.dark.colors.surface,
    ],
    [
      'light control border',
      themes.light.colors.controlBorder,
      themes.light.colors.surface,
    ],
    [
      'light focused control border',
      themes.light.colors.controlBorderFocused,
      themes.light.colors.surface,
    ],
    [
      'dark control border',
      themes.dark.colors.controlBorder,
      themes.dark.colors.surface,
    ],
    [
      'dark focused control border',
      themes.dark.colors.controlBorderFocused,
      themes.dark.colors.surface,
    ],
  ])('%s remains distinct from its surface', (_, foreground, background) => {
    expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(
      MINIMUM_NON_TEXT_CONTRAST,
    );
  });
});

describe('typography hierarchy', () => {
  test('keeps subheading between heading and body emphasis', () => {
    expect(typography.subheading).toMatchObject({
      fontFamily: fontFamilies.semiBold,
      fontSize: 18,
      lineHeight: 24,
      letterSpacing: -0.1,
    });
    expect(typography.heading.fontSize).toBeGreaterThan(
      typography.subheading.fontSize,
    );
    expect(typography.subheading.fontSize).toBeGreaterThan(
      typography.body.fontSize,
    );
  });
});
