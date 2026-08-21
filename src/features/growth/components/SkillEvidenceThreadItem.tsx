import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing } from '@/design-system/tokens/theme';
import type { SkillEvidenceEntry } from '@/domain/growth/model';

export type SkillEvidenceThreadItemProps = {
  entry: SkillEvidenceEntry;
  dateLabel: string;
  openHint: string;
  isLast: boolean;
  onPress: () => void;
};

export function SkillEvidenceThreadItem({
  entry,
  dateLabel,
  openHint,
  isLast,
  onPress,
}: SkillEvidenceThreadItemProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.row}>
      <View accessible={false} style={styles.railColumn}>
        <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />
        {!isLast ? (
          <View
            style={[styles.rail, { backgroundColor: theme.colors.border }]}
          />
        ) : null}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityHint={openHint}
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
          pressed && { backgroundColor: theme.colors.primarySoft },
        ]}
      >
        <Text variant="caption" color="textMuted">
          {dateLabel}
        </Text>
        <Text variant="subheading">{entry.title}</Text>
        <Text color="textMuted">{entry.supportingText}</Text>
        <Text variant="caption" color="primary">
          {openHint}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'stretch',
    flexDirection: 'row',
    gap: spacing[3],
  },
  railColumn: {
    alignItems: 'center',
    width: 18,
  },
  dot: {
    borderRadius: radii.full,
    height: 12,
    marginTop: spacing[5],
    width: 12,
  },
  rail: {
    flex: 1,
    marginTop: spacing[1],
    width: 2,
  },
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    flex: 1,
    gap: spacing[2],
    marginBottom: spacing[3],
    minHeight: 96,
    padding: spacing[4],
  },
});
