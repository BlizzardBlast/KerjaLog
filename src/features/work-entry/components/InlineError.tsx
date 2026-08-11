import { Text } from '@/design-system/components/Text';

export function InlineError({ children }: { children: string }) {
  return (
    <Text accessibilityLiveRegion="polite" variant="caption" color="danger">
      {children}
    </Text>
  );
}
