import { Linking, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';
import { Button } from '@/design-system/components/Button';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { motion } from '@/design-system/tokens/motion';
import { radii, spacing } from '@/design-system/tokens/theme';
import type { NotificationReminderIssue } from '@/features/onboarding/reminderFeedback';
import type { TranslationKey } from '@/i18n/catalog';
import { useI18n } from '@/i18n/I18nProvider';
import { openExactAlarmPermissionSettings } from '@/platform/notifications/weeklyReflection';
import { EMPTY_FUNCTION } from '@/shared/utils/function';

type IssueCopy = {
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  actionKey?: TranslationKey;
};

const issueCopy: Record<NotificationReminderIssue, IssueCopy> = {
  permission: {
    titleKey: 'onboarding.review.notificationPermissionTitle',
    descriptionKey: 'onboarding.review.notificationPermissionDescription',
  },
  'inexact-alarm': {
    titleKey: 'onboarding.review.inexactAlarmTitle',
    descriptionKey: 'onboarding.review.inexactAlarmDescription',
    actionKey: 'onboarding.review.inexactAlarmOpenSettings',
  },
  runtime: {
    titleKey: 'onboarding.review.notificationSetupTitle',
    descriptionKey: 'onboarding.review.notificationSetupDescription',
  },
  setup: {
    titleKey: 'onboarding.review.notificationSetupTitle',
    descriptionKey: 'onboarding.review.notificationSetupDescription',
  },
};

export function NotificationPermissionNotice({
  issue,
}: {
  issue: NotificationReminderIssue;
}) {
  const { theme } = useTheme();
  const { t } = useI18n();
  const copy = issueCopy[issue];
  const canOpenSettings = issue === 'permission' || issue === 'inexact-alarm';
  const entering = FadeIn.duration(motion.duration.feedback).reduceMotion(
    ReduceMotion.System,
  );

  const handleOpenSettings = () => {
    const settingsOperation =
      issue === 'inexact-alarm'
        ? openExactAlarmPermissionSettings()
        : Linking.openSettings();

    settingsOperation.catch(EMPTY_FUNCTION);
  };

  return (
    <Animated.View
      accessibilityRole={issue === 'inexact-alarm' ? 'text' : 'alert'}
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
          {t(copy.titleKey)}
        </Text>
        <Text variant="caption" color="textMuted">
          {t(copy.descriptionKey)}
        </Text>
      </View>

      {canOpenSettings ? (
        <Button onPress={handleOpenSettings} size="sm" variant="secondary">
          {t(copy.actionKey ?? 'common.action.openSettings')}
        </Button>
      ) : null}
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
