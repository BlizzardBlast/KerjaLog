import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';
import { Button } from '@/design-system/components/Button';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { motion } from '@/design-system/tokens/motion';
import { radii, spacing } from '@/design-system/tokens/theme';
import { useI18n } from '@/i18n/I18nProvider';
import { openExactAlarmPermissionSettings } from '@/platform/notifications/exactAlarmAccess';
import { ignoreError } from '@/shared/utils/function';

export function InexactReminderNotice() {
  const { theme } = useTheme();
  const { t } = useI18n();
  const entering = FadeIn.duration(motion.duration.feedback).reduceMotion(
    ReduceMotion.System,
  );

  return (
    <Animated.View
      accessibilityRole="text"
      entering={entering}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.warningSoft,
          borderColor: theme.colors.warning,
        },
      ]}
    >
      <View style={styles.copy}>
        <Text variant="bodyStrong" color="warning">
          {t('reminder.inexact.title')}
        </Text>
        <Text variant="caption" color="textMuted">
          {t('reminder.inexact.description')}
        </Text>
      </View>
      <Button
        onPress={() => {
          openExactAlarmPermissionSettings().catch(ignoreError);
        }}
        size="sm"
        variant="secondary"
      >
        {t('reminder.inexact.useExact')}
      </Button>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing[3],
    padding: spacing[4],
  },
  copy: {
    gap: spacing[1],
  },
});
