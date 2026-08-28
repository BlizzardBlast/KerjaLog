import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/design-system/components/Text';
import { AppIcon } from '@/design-system/icons/AppIcon';
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
  progressLabel: string;
};

export function LogHeader({
  eyebrow,
  title,
  description,
  backLabel,
  onBack,
  currentStep,
  totalSteps,
  progressLabel,
}: Readonly<LogHeaderProps>) {
  const { theme } = useTheme();
  const progressSegments = Array.from(
    { length: totalSteps },
    (_, index) => `progress-${index + 1}`,
  );

  return (
    <View style={styles.container}>
      <View
        accessibilityLabel={progressLabel}
        accessibilityRole="progressbar"
        accessibilityValue={{
          min: 1,
          max: totalSteps,
          now: currentStep,
          text: progressLabel,
        }}
        style={styles.progress}
      >
        {progressSegments.map((segment, index) => (
          <View
            key={segment}
            importantForAccessibility="no-hide-descendants"
            testID="work-entry-progress-segment"
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
          <AppIcon
            name={{ ios: 'chevron.left', android: 'arrow_back' }}
            size={22}
            color={theme.colors.text}
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
