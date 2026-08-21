import * as Sentry from '@sentry/react-native';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { layout, spacing } from '@/design-system/tokens/theme';
import type { SkillEvidenceSummary } from '@/domain/growth/model';
import { GrowthEvidenceMapContent } from '@/features/growth/components/GrowthEvidenceMapContent';
import { useGrowthEvidenceMap } from '@/features/growth/useGrowthEvidenceMap';
import { useI18n } from '@/i18n/I18nProvider';

function ProfiledGrowthScreen() {
  const router = Sentry.wrapExpoRouter(useRouter());
  const { theme } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const controller = useGrowthEvidenceMap();

  const openSkill = (skillId: SkillEvidenceSummary['skillId']) => {
    router.push({ pathname: '/growth/[skillId]', params: { skillId } });
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.screen, { backgroundColor: theme.colors.surface }]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
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
        <View style={styles.heading}>
          <Text variant="overline" color="primary">
            {t('growth.eyebrow')}
          </Text>
          <Text accessibilityRole="header" variant="title">
            {t('growth.title')}
          </Text>
          <Text color="textMuted">{t('growth.description')}</Text>
        </View>

        <GrowthEvidenceMapContent
          state={controller.state}
          onRetry={controller.retry}
          onOpenSkill={openSkill}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const GrowthScreen = Sentry.withProfiler(ProfiledGrowthScreen);

export { GrowthScreen };

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    gap: spacing[5],
    paddingBottom: spacing[8],
    paddingTop: spacing[5],
  },
  heading: {
    gap: spacing[2],
  },
});
