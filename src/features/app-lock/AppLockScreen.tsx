import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/design-system/components/Button';
import { DecorativeView } from '@/design-system/components/DecorativeView';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing } from '@/design-system/tokens/theme';
import { useAppLock } from '@/features/app-lock/AppLockProvider';
import { useI18n } from '@/i18n/I18nProvider';

export function AppLockScreen() {
  const { theme } = useTheme();
  const { t } = useI18n();
  const { error, isAuthenticating, unlock } = useAppLock();

  const errorMessage =
    error === 'unavailable'
      ? t('appLock.setting.unavailable')
      : error === 'cancelled'
        ? t('appLock.screen.cancelled')
        : error === 'authentication-failed' || error === 'storage-failed'
          ? t('appLock.screen.failed')
          : null;

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.screen, { backgroundColor: theme.colors.surface }]}
    >
      <View style={styles.content}>
        <DecorativeView
          style={[styles.icon, { backgroundColor: theme.colors.primarySoft }]}
        >
          <SymbolView
            name={{ ios: 'lock.fill', android: 'lock', web: 'lock' }}
            size={32}
            tintColor={theme.colors.primary}
          />
        </DecorativeView>

        <View style={styles.copy}>
          <Text variant="overline" color="primary" style={styles.centeredText}>
            {t('appLock.screen.eyebrow')}
          </Text>
          <Text variant="title" style={styles.centeredText}>
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
            accessibilityLiveRegion="polite"
            variant="caption"
            color="danger"
            style={styles.centeredText}
          >
            {errorMessage}
          </Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    flex: 1,
    gap: spacing[6],
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
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
