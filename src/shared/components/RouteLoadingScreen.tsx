import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { spacing } from '@/design-system/tokens/theme';

export function RouteLoadingScreen({ label }: Readonly<{ label: string }>) {
  const { theme } = useTheme();

  return (
    <View
      accessible
      accessibilityLabel={label}
      accessibilityRole="progressbar"
      accessibilityState={{ busy: true }}
      style={[styles.screen, { backgroundColor: theme.colors.surface }]}
    >
      <ActivityIndicator color={theme.colors.primary} size="small" />
      <Text variant="caption" color="textMuted">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: 'center',
    flex: 1,
    gap: spacing[3],
    justifyContent: 'center',
  },
});
