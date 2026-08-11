import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { spacing } from '@/design-system/tokens/theme';
import { SectionHeading } from '@/features/home/components/SectionHeading';
import { useI18n } from '@/i18n/I18nProvider';

export function RecentEntriesLoadingSection() {
  const { theme } = useTheme();
  const { t } = useI18n();

  return (
    <>
      <SectionHeading
        title={t('home.recent.title')}
        description={t('home.recent.description')}
      />
      <View style={styles.loadingRow} accessibilityLiveRegion="polite">
        <ActivityIndicator color={theme.colors.primary} size="small" />
        <Text variant="caption" color="textMuted">
          {t('home.recent.loading')}
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  loadingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[2],
    minHeight: 48,
  },
});
