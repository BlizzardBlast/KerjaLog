import { StyleSheet, View } from 'react-native';
import { Text } from '@/design-system/components/Text';

export type SectionHeadingProps = {
  title: string;
  description: string;
};

export function SectionHeading({
  title,
  description,
}: Readonly<SectionHeadingProps>) {
  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" variant="heading">\n        {title}\n      </Text>
      <Text variant="caption" color="textMuted">
        {description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 2,
    marginTop: 10,
  },
});
