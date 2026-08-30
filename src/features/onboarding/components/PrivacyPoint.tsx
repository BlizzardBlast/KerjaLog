import { StyleSheet, View } from 'react-native';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';

export type PrivacyPointProps = {
  text: string;
};

export function PrivacyPoint({ text }: Readonly<PrivacyPointProps>) {
  const { theme } = useTheme();

  return (
    <View style={styles.point}>
      <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />
      <Text variant="body" style={styles.text}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  point: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
  },
  dot: {
    borderRadius: 999,
    height: 8,
    marginTop: 8,
    width: 8,
  },
  text: {
    flex: 1,
  },
});
