import { StyleSheet, View } from 'react-native';
import { Text } from '@/design-system/components/Text';
import { ThemeToggleButton } from '@/design-system/components/ThemeToggleButton';
import { spacing } from '@/design-system/tokens/theme';
import { useI18n } from '@/i18n/I18nProvider';

export function HomeHeader() {
  const { t } = useI18n();

  return (
    <View style={styles.headingRow}>
      <View style={styles.headingBlock}>
        <Text variant="overline" color="primary">
          {t('home.eyebrow')}
        </Text>
        <Text variant="title">{t('home.title')}</Text>
        <Text variant="body" color="textMuted">
          {t('home.description')}
        </Text>
      </View>
      <ThemeToggleButton />
    </View>
  );
}

const styles = StyleSheet.create({
  headingRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing[3],
  },
  headingBlock: {
    flex: 1,
    gap: spacing[2],
    marginBottom: spacing[1],
    minWidth: 0,
  },
});
