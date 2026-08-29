import { StyleSheet, View } from 'react-native';
import { Text } from '@/design-system/components/Text';

export type StepHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function StepHeading({
  eyebrow,
  title,
  description,
}: Readonly<StepHeadingProps>) {
  return (
    <View style={styles.container}>
      <Text variant="overline" color="primary">
        {eyebrow}
      </Text>
      <Text accessibilityRole="header" variant="title">\n        {title}\n      </Text>
      <Text variant="body" color="textMuted">
        {description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
});
