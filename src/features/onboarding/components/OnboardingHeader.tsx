import { Pressable, StyleSheet, View } from 'react-native';
import { DecorativeView } from '@/design-system/components/DecorativeView';
import { Text } from '@/design-system/components/Text';
import { AppIcon } from '@/design-system/icons/AppIcon';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing } from '@/design-system/tokens/theme';
import { ONBOARDING_STEP_ORDER } from '@/features/onboarding/model';
import { useI18n } from '@/i18n/I18nProvider';

export type OnboardingHeaderProps = {
  currentStepIndex: number;
  onBack: () => void;
};

export function OnboardingHeader({
  currentStepIndex,
  onBack,
}: Readonly<OnboardingHeaderProps>) {
  const { theme } = useTheme();
  const { t } = useI18n();
  const progressText = t('onboarding.progress', {
    current: currentStepIndex + 1,
    total: ONBOARDING_STEP_ORDER.length,
  });

  return (
    <View style={styles.topBar}>
      {currentStepIndex > 0 ? (
        <Pressable
          accessibilityLabel={t('onboarding.back')}
          accessibilityRole="button"
          hitSlop={spacing[1]}
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
            size={20}
            color={theme.colors.text}
          />
        </Pressable>
      ) : null}

      <View
        accessibilityLabel={progressText}
        accessibilityRole="progressbar"
        accessibilityValue={{
          min: 1,
          max: ONBOARDING_STEP_ORDER.length,
          now: currentStepIndex + 1,
          text: progressText,
        }}
        style={styles.progress}
      >
        {ONBOARDING_STEP_ORDER.map((step, index) => (
          <View
            key={step}
            style={[
              styles.progressSegment,
              {
                backgroundColor:
                  index <= currentStepIndex
                    ? theme.colors.primary
                    : theme.colors.border,
              },
              index === currentStepIndex && styles.progressSegmentActive,
            ]}
          />
        ))}
      </View>

      <DecorativeView>
        <Text variant="caption" color="textMuted" style={styles.stepCount}>
          {currentStepIndex + 1}/{ONBOARDING_STEP_ORDER.length}
        </Text>
      </DecorativeView>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[3],
    minHeight: 60,
    paddingHorizontal: spacing[5],
    paddingVertical: 6,
  },
  backButton: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    height: spacing[12],
    justifyContent: 'center',
    width: spacing[12],
  },
  pressed: {
    opacity: 0.72,
  },
  progress: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  progressSegment: {
    borderRadius: radii.full,
    flex: 1,
    height: spacing[1],
  },
  progressSegmentActive: {
    flexGrow: 1.6,
  },
  stepCount: {
    minWidth: 30,
    textAlign: 'right',
  },
});
