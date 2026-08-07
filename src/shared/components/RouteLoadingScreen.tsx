import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';

export function RouteLoadingScreen({ label }: { label: string }) {
  const { theme } = useTheme();

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.canvas }]}>
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
    gap: 12,
    justifyContent: 'center',
  },
});
