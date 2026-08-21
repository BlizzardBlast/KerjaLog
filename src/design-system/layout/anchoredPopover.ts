export type AnchorFrame = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type AnchoredPopoverLayout = {
  left: number;
  top: number;
  width: number;
};

type AnchoredPopoverLayoutOptions = {
  anchor: AnchorFrame;
  windowWidth: number;
  horizontalInset: number;
  preferredWidth: number;
  gap: number;
};

/**
 * Right-aligns a popover to its trigger while keeping it inside the usable
 * horizontal viewport. Vertical placement intentionally stays immediately
 * below the trigger so the control and menu remain visually connected.
 */
export function getAnchoredPopoverLayout({
  anchor,
  windowWidth,
  horizontalInset,
  preferredWidth,
  gap,
}: AnchoredPopoverLayoutOptions): AnchoredPopoverLayout {
  const availableWidth = Math.max(0, windowWidth - horizontalInset * 2);
  const width = Math.min(preferredWidth, availableWidth);
  const minimumLeft = horizontalInset;
  const maximumLeft = Math.max(
    minimumLeft,
    windowWidth - width - horizontalInset,
  );
  const preferredLeft = anchor.x + anchor.width - width;

  return {
    left: Math.min(Math.max(preferredLeft, minimumLeft), maximumLeft),
    top: anchor.y + anchor.height + gap,
    width,
  };
}
