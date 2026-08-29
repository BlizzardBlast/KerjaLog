import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { layout, spacing } from '@/design-system/tokens/theme';

export function PlaceholderTabScreen({
  eyebrow,
  title,
  description,
}: Readonly<{
  eyebrow: string;
  title: string;
  description: string;
}>) {
  const { theme } = useTheme();

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.screen, { backgroundColor: theme.colors.surface }]}
    >
      <View style={styles.content}>
        <Text variant="overline" color="primary">
          {eyebrow}
        </Text>
        <Text accessibilityRole="header" variant="title">
          {title}
        </Text>
        <Text variant="body" color="textMuted">
          {description}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    gap: spacing[3],
    paddingHorizontal: layout.screenHorizontalPadding,
    paddingTop: spacing[6],
  },
});
