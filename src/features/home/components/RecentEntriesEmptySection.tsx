import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';
import { DecorativeView } from '@/design-system/components/DecorativeView';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii } from '@/design-system/tokens/theme';
import { SectionHeading } from '@/features/home/components/SectionHeading';
import { useI18n } from '@/i18n/I18nProvider';

export function RecentEntriesEmptySection() {
  const { theme } = useTheme();
  const { t } = useI18n();

  return (
    <>
      <SectionHeading
        title={t('home.recent.title')}
        description={t('home.recent.description')}
      />
      <View
        style={[
          styles.emptyCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <DecorativeView
          style={[
            styles.emptyIcon,
            { backgroundColor: theme.colors.surfaceSubtle },
          ]}
        >
          <SymbolView
            name={{ ios: 'tray', android: 'inbox', web: 'inbox' }}
            size={24}
            tintColor={theme.colors.textMuted}
          />
        </DecorativeView>
        <Text variant="bodyStrong">{t('home.recent.emptyTitle')}</Text>
        <Text variant="caption" color="textMuted" style={styles.emptyCopy}>
          {t('home.recent.emptyDescription')}
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  emptyCard: {
    alignItems: 'flex-start',
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: 18,
  },
  emptyIcon: {
    alignItems: 'center',
    borderRadius: 14,
    height: 46,
    justifyContent: 'center',
    marginBottom: 14,
    width: 46,
  },
  emptyCopy: {
    marginTop: 5,
  },
});
