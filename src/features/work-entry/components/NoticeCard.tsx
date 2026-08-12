import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/design-system/components/Text';
import { radii, spacing } from '@/design-system/tokens/theme';

type NoticeCardProps = {
  backgroundColor: string;
  borderColor: string;
  title: string;
  description: string;
  style?: StyleProp<ViewStyle>;
};

export function NoticeCard({
  backgroundColor,
  borderColor,
  title,
  description,
  style,
}: NoticeCardProps) {
  return (
    <View style={[styles.notice, { backgroundColor, borderColor }, style]}>
      <Text variant="bodyStrong">{title}</Text>
      <Text variant="caption" color="textMuted">
        {description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing[1],
    padding: spacing[4],
  },
});
