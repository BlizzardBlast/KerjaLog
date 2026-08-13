import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing } from '@/design-system/tokens/theme';

type LogHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  backLabel: string;
  onBack: () => void;
  currentStep: number;
  totalSteps: number;
};

export function LogHeader({
  eyebrow,
  title,
  description,
  backLabel,
  onBack,
  currentStep,
  totalSteps,
}: LogHeaderProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <View
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 1, max: totalSteps, now: currentStep }}
        style={styles.progress}
      >
        {Array.from({ length: totalSteps }, (_, index) => (
          <View
            key={`step-${index + 1}`}
            importantForAccessibility="no-hide-descendants"
            style={[
              styles.progressSegment,
              {
                backgroundColor:
                  index < currentStep
                    ? theme.colors.primary
                    : theme.colors.border,
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.headingRow}>
        <Pressable
          accessibilityLabel={backLabel}
          accessibilityRole="button"
          hitSlop={4}
          onPress={onBack}
          style={({ pressed }) => [
            styles.backButton,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
            pressed && styles.pressed,
          ]}
        >
          <SymbolView
            name={{
              ios: 'chevron.left',
              android: 'arrow_back',
              web: 'arrow_back',
            }}
            size={22}
            tintColor={theme.colors.text}
          />
        </Pressable>

        <View style={styles.headingCopy}>
          <Text variant="overline" color="primary">
            {eyebrow}
          </Text>
          <Text accessibilityRole="header" variant="title">
            {title}
          </Text>
        </View>
      </View>

      {description ? (
        <Text variant="body" color="textMuted">
          {description}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[4],
  },
  progress: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  progressSegment: {
    borderRadius: radii.full,
    flex: 1,
    height: 4,
  },
  headingRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing[3],
  },
  backButton: {
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    height: spacing[12],
    justifyContent: 'center',
    width: spacing[12],
  },
  pressed: {
    opacity: 0.72,
  },
  headingCopy: {
    flex: 1,
    gap: spacing[1],
    minWidth: 0,
  },
});
