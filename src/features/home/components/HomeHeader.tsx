import { StyleSheet, View } from 'react-native';
import { Text } from '@/design-system/components/Text';
import { ThemeToggleButton } from '@/design-system/components/ThemeToggleButton';
import { spacing } from '@/design-system/tokens/theme';
import { LanguageSelector } from '@/i18n/components/LanguageSelector';
import { useI18n } from '@/i18n/I18nProvider';

export function HomeHeader() {
  const { t } = useI18n();

  return (
    <View style={styles.header}>
      <View style={styles.utilityRow}>
        <Text variant="overline" color="primary">
          {t('home.eyebrow')}
        </Text>
        <View style={styles.controls}>
          <LanguageSelector />
          <ThemeToggleButton />
        </View>
      </View>

      <Text accessibilityRole="header" variant="title">
        {t('home.title')}
      </Text>
      <Text variant="body" color="textMuted">
        {t('home.description')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing[2],
    marginBottom: spacing[1],
  },
  utilityRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[3],
    justifyContent: 'space-between',
  },
  controls: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[2],
  },
});
