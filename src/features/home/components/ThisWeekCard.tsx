import { StyleSheet, View } from 'react-native';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing } from '@/design-system/tokens/theme';
import { useI18n } from '@/i18n/I18nProvider';

type ThisWeekCardProps = {
  entryCount: number | null;
};

export function ThisWeekCard({ entryCount }: Readonly<ThisWeekCardProps>) {
  const { theme } = useTheme();
  const { t } = useI18n();
  const countLabel =
    entryCount === null
      ? t('home.thisWeek.loading')
      : t('home.thisWeek.entryCount', { count: entryCount });

  return (
    <View
      style={[
        styles.weekCard,
        {
          backgroundColor: theme.colors.primarySoft,
          borderColor: theme.colors.primary,
        },
      ]}
    >
      <View style={styles.cardHeadingRow}>
        <View style={styles.cardHeadingCopy}>
          <Text variant="overline" color="primary">
            {t('home.thisWeek.eyebrow')}
          </Text>
          <Text variant="heading">{t('home.thisWeek.title')}</Text>
        </View>
        <View
          style={[styles.countPill, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="label" color="primary">
            {countLabel}
          </Text>
        </View>
      </View>
      <Text variant="body" color="textMuted">
        {t('home.thisWeek.description')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  weekCard: {
    borderRadius: 22,
    borderWidth: 1,
    gap: 14,
    padding: 18,
  },
  cardHeadingRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing[3],
  },
  cardHeadingCopy: {
    flex: 1,
    gap: spacing[1],
  },
  countPill: {
    borderRadius: radii.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
});
