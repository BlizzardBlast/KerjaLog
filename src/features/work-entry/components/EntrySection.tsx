import { StyleSheet, View } from 'react-native';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing } from '@/design-system/tokens/theme';

type EntrySectionProps = {
  title: string;
  value: string;
  emphasized?: boolean;
};

export function EntrySection({
  title,
  value,
  emphasized = false,
}: EntrySectionProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: emphasized
            ? theme.colors.primarySoft
            : theme.colors.surface,
          borderColor: emphasized ? theme.colors.primary : theme.colors.border,
        },
      ]}
    >
      <Text variant="overline" color={emphasized ? 'primary' : 'textMuted'}>
        {title}
      </Text>
      <Text variant={emphasized ? 'bodyStrong' : 'body'}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing[2],
    padding: spacing[4],
  },
});
