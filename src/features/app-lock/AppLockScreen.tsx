import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/design-system/components/Button';
import { DecorativeView } from '@/design-system/components/DecorativeView';
import { Text } from '@/design-system/components/Text';
import { AppIcon } from '@/design-system/icons/AppIcon';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing } from '@/design-system/tokens/theme';
import { useAppLock } from '@/features/app-lock/AppLockProvider';
import { useI18n } from '@/i18n/I18nProvider';

export function AppLockScreen() {
  const { theme } = useTheme();
  const { t } = useI18n();
  const { error, isAuthenticating, unlock } = useAppLock();

  let errorMessage: string | null = null;
  if (error === 'unavailable') {
    errorMessage = t('appLock.setting.unavailable');
  } else if (error === 'cancelled') {
    errorMessage = t('appLock.screen.cancelled');
  } else if (
    error === 'authentication-failed' ||
    error === 'storage-failed' ||
    error === 'privacy-failed'
  ) {
    errorMessage = t('appLock.screen.failed');
  }

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.screen, { backgroundColor: theme.colors.surface }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <DecorativeView
          style={[styles.icon, { backgroundColor: theme.colors.primarySoft }]}
        >
          <AppIcon
            name={{ ios: 'lock.fill', android: 'lock' }}
            size={32}
            color={theme.colors.primary}
          />
        </DecorativeView>

        <View style={styles.copy}>
          <Text variant="overline" color="primary" style={styles.centeredText}>
            {t('appLock.screen.eyebrow')}
          </Text>
          <Text
            accessibilityRole="header"
            variant="title"
            style={styles.centeredText}
          >
            {t('appLock.screen.title')}
          </Text>
          <Text variant="body" color="textMuted" style={styles.centeredText}>
            {t('appLock.screen.description')}
          </Text>
        </View>

        <Button fullWidth loading={isAuthenticating} onPress={unlock} size="lg">
          {t('appLock.screen.unlock')}
        </Button>

        {errorMessage ? (
          <Text
            role="alert"
            accessibilityLiveRegion="polite"
            variant="caption"
            color="danger"
            style={styles.centeredText}
          >
            {errorMessage}
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    flexGrow: 1,
    gap: spacing[6],
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[6],
  },
  icon: {
    alignItems: 'center',
    borderRadius: radii.xl,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  copy: {
    alignItems: 'center',
    gap: spacing[2],
    maxWidth: 420,
  },
  centeredText: {
    textAlign: 'center',
  },
});
