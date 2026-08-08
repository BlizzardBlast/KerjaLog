import { Linking, StyleSheet, View } from 'react-native';
import { Button } from '@/design-system/components/Button';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing } from '@/design-system/tokens/theme';
import { useI18n } from '@/i18n/I18nProvider';

export function NotificationPermissionNotice() {
  const { theme } = useTheme();
  const { t } = useI18n();

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
          {t('onboarding.review.notificationPermissionTitle')}
        </Text>
        <Text variant="caption" color="textMuted">
          {t('onboarding.review.notificationPermissionDescription')}
        </Text>
      </View>
      <Button onPress={() => Linking.openSettings()} size="sm" variant="secondary">
        {t('common.action.openSettings')}
      </Button>
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
