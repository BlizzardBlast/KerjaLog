import { StyleSheet, View } from 'react-native';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing } from '@/design-system/tokens/theme';
import { useI18n } from '@/i18n/I18nProvider';

export function HomeWorkDataError() {
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
      <Text variant="bodyStrong" color="warning">
        {t('home.workData.errorTitle')}
      </Text>
      <Text variant="caption" color="textMuted">
        {t('home.workData.errorDescription')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing[1],
    padding: spacing[4],
  },
});
