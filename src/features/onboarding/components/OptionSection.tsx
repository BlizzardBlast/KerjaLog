import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/design-system/components/Text';

type OptionSectionProps = PropsWithChildren<{
  title: string;
}>;

export function OptionSection({ title, children }: OptionSectionProps) {
  return (
    <View style={styles.section} accessibilityRole="radiogroup">
      <Text variant="label" color="textMuted">
        {title}
      </Text>
      <View style={styles.list}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 10,
  },
  list: {
    gap: 10,
  },
});
