import * as Sentry from '@sentry/react-native';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Text } from '@/design-system/components/Text';
import { AppIcon } from '@/design-system/icons/AppIcon';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { layout, radii, spacing } from '@/design-system/tokens/theme';
import { skillDefinitionById } from '@/domain/skill/catalog';
import type { SkillId } from '@/domain/skill/model';
import { SkillEvidenceContent } from '@/features/growth/components/SkillEvidenceContent';
import { useSkillEvidence } from '@/features/growth/useSkillEvidence';
import { useI18n } from '@/i18n/I18nProvider';

export type SkillEvidenceScreenProps = {
  skillId: SkillId;
};

function ProfiledSkillEvidenceScreen({
  skillId,
}: Readonly<SkillEvidenceScreenProps>) {
  const router = Sentry.wrapExpoRouter(useRouter());
  const { theme } = useTheme();
  const { language, t } = useI18n();
  const insets = useSafeAreaInsets();
  const controller = useSkillEvidence(skillId);
  const skillName = t(skillDefinitionById[skillId].nameKey);
  const locale = language === 'id' ? 'id-ID' : 'en-US';

  const openEntry = (id: string) => {
    router.push({ pathname: '/entry/[id]', params: { id } });
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.screen, { backgroundColor: theme.colors.surface }]}
    >
      <View
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
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('growth.detail.back')}
            hitSlop={8}
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              {
                backgroundColor: pressed
                  ? theme.colors.primarySoft
                  : theme.colors.surfaceSubtle,
              },
            ]}
          >
            <AppIcon
              name={{ ios: 'chevron.left', android: 'arrow_back' }}
              size={22}
              color={theme.colors.text}
            />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text variant="overline" color="primary">
              {t('growth.detail.eyebrow')}
            </Text>
            <Text accessibilityRole="header" variant="title">
              {skillName}
            </Text>
          </View>
        </View>

        <View style={styles.body}>
          <SkillEvidenceContent
            locale={locale}
            state={controller.state}
            onRetry={controller.retry}
            onOpenEntry={openEntry}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const SkillEvidenceScreen = Sentry.withProfiler(ProfiledSkillEvidenceScreen);

export { SkillEvidenceScreen };

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: spacing[4],
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[3],
  },
  backButton: {
    alignItems: 'center',
    borderRadius: radii.md,
    height: spacing[12],
    justifyContent: 'center',
    width: spacing[12],
  },
  headerCopy: {
    flex: 1,
    gap: spacing[1],
    minWidth: 0,
  },
  body: {
    flex: 1,
    marginTop: spacing[5],
  },
});
