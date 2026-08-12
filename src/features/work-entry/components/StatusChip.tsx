import { StyleSheet, View } from 'react-native';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing, type ThemeColors } from '@/design-system/tokens/theme';

type StatusChipProps = {
  label: string;
  tone: 'success' | 'warning' | 'neutral';
};

export function StatusChip({ label, tone }: StatusChipProps) {
  const { theme } = useTheme();
  let backgroundColor = theme.colors.surfaceSubtle;
  let textColor: keyof ThemeColors = 'textMuted';

  if (tone === 'success') {
    backgroundColor = theme.colors.successSoft;
    textColor = 'success';
  } else if (tone === 'warning') {
    backgroundColor = theme.colors.warningSoft;
    textColor = 'warning';
  }

  return (
    <View style={[styles.chip, { backgroundColor }]}>
      <Text variant="caption" color={textColor}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: radii.full,
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
  },
});
