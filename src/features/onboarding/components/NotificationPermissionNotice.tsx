import { Linking, StyleSheet, View } from 'react-native';
import { Button } from '@/design-system/components/Button';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing } from '@/design-system/tokens/theme';
import { useI18n } from '@/i18n/I18nProvider';
import type { TranslationKey } from '@/i18n/translations';

export type NotificationReminderIssue = 'permission' | 'runtime' | 'setup';

const issueCopy: Record<
  NotificationReminderIssue,
  { titleKey: TranslationKey; descriptionKey: TranslationKey }
> = {
  permission: {
    titleKey: 'onboarding.review.notificationPermissionTitle',
    descriptionKey: 'onboarding.review.notificationPermissionDescription',
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

  return (
    <View
      accessibilityRole="alert"
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

      {issue === 'permission' ? (
        <Button
          onPress={() => Linking.openSettings()}
          size="sm"
          variant="secondary"
        >
          {t('common.action.openSettings')}
        </Button>
      ) : null}
    </View>
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
