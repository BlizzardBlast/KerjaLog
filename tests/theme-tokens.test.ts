import { themes } from '@/design-system/tokens/theme';

const MINIMUM_NORMAL_TEXT_CONTRAST = 4.5;

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
    ['light primary', themes.light.colors.onPrimary, themes.light.colors.primary],
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
});
