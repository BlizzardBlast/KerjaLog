import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing } from '@/design-system/tokens/theme';

const TOAST_DURATION_MS = 2_300;

type ReviewSaveToastProps = {
  message: string;
  onDismiss: () => void;
};

export function ReviewSaveToast({
  message,
  onDismiss,
}: Readonly<ReviewSaveToastProps>) {
  const { theme } = useTheme();

  useEffect(() => {
    const timeoutId = setTimeout(onDismiss, TOAST_DURATION_MS);
    return () => clearTimeout(timeoutId);
  }, [onDismiss]);

  return (
    <View
      accessible
      accessibilityLabel={message}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={[styles.toast, { backgroundColor: theme.colors.text }]}
    >
      <Text color="surface" variant="label">
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    borderRadius: radii.md,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
});
