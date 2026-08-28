import { Text } from '@/design-system/components/Text';

export function InlineError({ children }: Readonly<{ children: string }>) {
  return (
    <Text
      role="alert"
      accessibilityLiveRegion="polite"
      variant="caption"
      color="danger"
    >
      {children}
    </Text>
  );
}
