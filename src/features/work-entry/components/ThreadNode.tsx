import { StyleSheet, View } from 'react-native';
import { Text } from '@/design-system/components/Text';
import { spacing } from '@/design-system/tokens/theme';

type ThreadNodeProps = {
  label: string;
  value: string;
};

export function ThreadNode({ label, value }: Readonly<ThreadNodeProps>) {
  return (
    <View style={styles.threadNode}>
      <Text variant="overline" color="primary">
        {label}
      </Text>
      <Text variant="bodyStrong">{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  threadNode: {
    gap: spacing[1],
  },
});
