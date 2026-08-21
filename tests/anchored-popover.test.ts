import { getAnchoredPopoverLayout } from '@/design-system/layout/anchoredPopover';

describe('getAnchoredPopoverLayout', () => {
  test('keeps the menu directly below and right-aligned to its trigger', () => {
    expect(
      getAnchoredPopoverLayout({
        anchor: { x: 280, y: 72, width: 82, height: 48 },
        windowWidth: 390,
        horizontalInset: 16,
        preferredWidth: 220,
        gap: 8,
      }),
    ).toEqual({
      left: 142,
      top: 128,
      width: 220,
    });
  });

  test('clamps the menu to the safe horizontal viewport', () => {
    expect(
      getAnchoredPopoverLayout({
        anchor: { x: 8, y: 40, width: 82, height: 48 },
        windowWidth: 390,
        horizontalInset: 24,
        preferredWidth: 220,
        gap: 8,
      }),
    ).toEqual({
      left: 24,
      top: 96,
      width: 220,
    });
  });

  test('shrinks gracefully when the viewport is narrower than the preferred menu', () => {
    expect(
      getAnchoredPopoverLayout({
        anchor: { x: 120, y: 20, width: 82, height: 48 },
        windowWidth: 240,
        horizontalInset: 16,
        preferredWidth: 220,
        gap: 8,
      }),
    ).toEqual({
      left: 16,
      top: 76,
      width: 208,
    });
  });
});
