import { StyleSheet, View } from 'react-native';
import { Button } from '@/design-system/components/Button';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing } from '@/design-system/tokens/theme';
import { SectionHeading } from '@/features/home/components/SectionHeading';
import { useI18n } from '@/i18n/I18nProvider';

type ReflectionSectionProps = {
  onLogSomething: () => void;
};

export function ReflectionSection({ onLogSomething }: ReflectionSectionProps) {
  const { theme } = useTheme();
  const { t } = useI18n();

  return (
    <>
      <SectionHeading
        title={t('home.reflection.title')}
        description={t('home.reflection.description')}
      />
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Text variant="bodyStrong">{t('home.reflection.prompt')}</Text>
        <Text
          variant="caption"
          color="textMuted"
          style={styles.cardDescription}
        >
          {t('home.reflection.note')}
        </Text>
        <Button
          onPress={onLogSomething}
          style={styles.inlineButton}
          variant="secondary"
        >
          {t('home.reflection.action')}
        </Button>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: 18,
  },
  cardDescription: {
    marginTop: 5,
  },
  inlineButton: {
    marginTop: spacing[4],
  },
});
