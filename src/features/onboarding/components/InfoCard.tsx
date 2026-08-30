import { StyleSheet, View } from 'react-native';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { spacing } from '@/design-system/tokens/theme';

export type InfoCardProps = {
  title: string;
  body: string;
};

export function InfoCard({ title, body }: Readonly<InfoCardProps>) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surfaceSubtle,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Text variant="bodyStrong">{title}</Text>
      <Text variant="caption" color="textMuted" style={styles.body}>
        {body}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: spacing[4],
  },
  body: {
    marginTop: 5,
  },
});
