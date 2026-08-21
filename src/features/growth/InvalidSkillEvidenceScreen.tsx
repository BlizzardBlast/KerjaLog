import * as Sentry from '@sentry/react-native';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Button } from '@/design-system/components/Button';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { layout, spacing } from '@/design-system/tokens/theme';
import { useI18n } from '@/i18n/I18nProvider';

export function InvalidSkillEvidenceScreen() {
  const router = Sentry.wrapExpoRouter(useRouter());
  const { theme } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.screen, { backgroundColor: theme.colors.surface }]}
    >
      <View
        accessibilityRole="alert"
        style={[
          styles.content,
          {
            paddingLeft: Math.max(insets.left, layout.screenHorizontalPadding),
            paddingRight: Math.max(
              insets.right,
              layout.screenHorizontalPadding,
            ),
          },
        ]}
      >
        <Text accessibilityRole="header" variant="title">
          {t('growth.detail.invalid.title')}
        </Text>
        <Text color="textMuted">{t('growth.detail.invalid.description')}</Text>
        <Button fullWidth onPress={() => router.replace('/growth')}>
          {t('growth.detail.back')}
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    gap: spacing[4],
    justifyContent: 'center',
  },
});
