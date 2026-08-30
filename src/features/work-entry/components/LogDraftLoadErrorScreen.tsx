import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/design-system/components/Button';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { spacing } from '@/design-system/tokens/theme';
import { useI18n } from '@/i18n/I18nProvider';

type LogDraftLoadErrorScreenProps = {
  onRetry: () => void;
  onBackHome: () => void;
};

export function LogDraftLoadErrorScreen({
  onRetry,
  onBackHome,
}: Readonly<LogDraftLoadErrorScreenProps>) {
  const { theme } = useTheme();
  const { t } = useI18n();

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.screen, { backgroundColor: theme.colors.surface }]}
    >
      <Text
        accessibilityRole="header"
        variant="title"
        style={styles.centeredText}
      >
        {t('log.draft.loadErrorTitle')}
      </Text>
      <Text
        role="alert"
        accessibilityLiveRegion="polite"
        variant="body"
        color="textMuted"
        style={styles.centeredText}
      >
        {t('log.draft.loadErrorDescription')}
      </Text>
      <Button fullWidth onPress={onRetry}>
        {t('log.saved.retry')}
      </Button>
      <Button fullWidth onPress={onBackHome} variant="secondary">
        {t('log.saved.backHome')}
      </Button>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: 'center',
    flex: 1,
    gap: spacing[4],
    justifyContent: 'center',
    padding: spacing[6],
  },
  centeredText: {
    textAlign: 'center',
  },
});
