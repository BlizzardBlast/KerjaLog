import { Pressable, StyleSheet } from 'react-native';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing } from '@/design-system/tokens/theme';
import type { WorkEntry } from '@/domain/entry/model';

type RecentEntryCardProps = {
  entry: WorkEntry;
  onPress: () => void;
};

export function RecentEntryCard({ entry, onPress }: Readonly<RecentEntryCardProps>) {
  const { theme } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
        pressed && styles.pressed,
      ]}
    >
      <Text variant="bodyStrong">{entry.title}</Text>
      <Text variant="caption" color="textMuted" numberOfLines={2}>
        {entry.rawNote}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing[2],
    padding: spacing[4],
  },
  pressed: {
    opacity: 0.82,
  },
});
