import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/design-system/components/Button';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { spacing } from '@/design-system/tokens/theme';
import { useI18n } from '@/i18n/I18nProvider';

type LogSaveCompletionErrorScreenProps = {
  onRetry: () => Promise<void> | void;
};

export function LogSaveCompletionErrorScreen({
  onRetry,
}: Readonly<LogSaveCompletionErrorScreenProps>) {
  const { theme } = useTheme();
  const { t } = useI18n();
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  };

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
        {t('log.completion.title')}
      </Text>
      <Text
        role="alert"
        accessibilityLiveRegion="polite"
        variant="body"
        color="textMuted"
        style={styles.centeredText}
      >
        {t('log.completion.description')}
      </Text>
      <Button fullWidth loading={retrying} onPress={handleRetry}>
        {t('log.completion.retry')}
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
