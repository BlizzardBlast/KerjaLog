import * as Sentry from '@sentry/react-native';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Button } from '@/design-system/components/Button';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { layout, radii, spacing } from '@/design-system/tokens/theme';
import { skillDefinitionById } from '@/domain/skill/catalog';
import type { SkillId } from '@/domain/skill/model';
import { SkillEvidenceThreadItem } from '@/features/growth/components/SkillEvidenceThreadItem';
import { formatEvidenceDate } from '@/features/growth/growthPresentation';
import {
  type SkillEvidenceState,
  useSkillEvidence,
} from '@/features/growth/useSkillEvidence';
import { useI18n } from '@/i18n/I18nProvider';

export type SkillEvidenceScreenProps = {
  skillId: SkillId;
};

function ProfiledSkillEvidenceScreen({ skillId }: SkillEvidenceScreenProps) {
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
            <SymbolView
              name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
              size={22}
              tintColor={theme.colors.text}
            />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text variant="overline" color="primary">
              {t('growth.detail.eyebrow')}
            </Text>
            <Text accessibilityRole="header" variant="heading">
              {skillName}
            </Text>
          </View>
        </View>

        <SkillEvidenceBody
          skillName={skillName}
          locale={locale}
          state={controller.state}
          onRetry={controller.retry}
          onOpenEntry={openEntry}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const SkillEvidenceScreen = Sentry.withProfiler(ProfiledSkillEvidenceScreen);

export { SkillEvidenceScreen };

type SkillEvidenceBodyProps = {
  skillName: string;
  locale: string;
  state: SkillEvidenceState;
  onRetry: () => void;
  onOpenEntry: (id: string) => void;
};

function SkillEvidenceBody({
  skillName,
  locale,
  state,
  onRetry,
  onOpenEntry,
}: SkillEvidenceBodyProps) {
  const { theme } = useTheme();
  const { t } = useI18n();

  if (state.status === 'loading') {
    return (
      <View
        accessible
        accessibilityLabel={t('growth.detail.loading')}
        accessibilityRole="progressbar"
        accessibilityState={{ busy: true }}
        style={styles.loadingState}
      >
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  if (state.status === 'error') {
    return (
      <View
        accessibilityRole="alert"
        style={[
          styles.stateCard,
          {
            backgroundColor: theme.colors.surfaceSubtle,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Text variant="subheading">{t('growth.detail.error.title')}</Text>
        <Text color="textMuted">{t('growth.detail.error.description')}</Text>
        <Button size="sm" onPress={onRetry}>
          {t('growth.error.retry')}
        </Button>
      </View>
    );
  }

  const countLabel = t(
    state.entries.length === 1
      ? 'growth.detail.supportingOne'
      : 'growth.detail.supportingMany',
    { count: state.entries.length },
  );

  return (
    <View style={styles.body}>
      {state.refreshError ? (
        <View
          accessibilityRole="alert"
          style={[
            styles.refreshNotice,
            {
              backgroundColor: theme.colors.warningSoft,
              borderColor: theme.colors.warning,
            },
          ]}
        >
          <Text variant="caption" color="textMuted">
            {t('growth.refreshError')}
          </Text>
        </View>
      ) : null}

      <View
        style={[
          styles.summaryCard,
          {
            backgroundColor: theme.colors.primarySoft,
            borderColor: theme.colors.primary,
          },
        ]}
      >
        <View style={styles.summaryTopRow}>
          <Text variant="heading">{countLabel}</Text>
          {state.isRefreshing ? (
            <ActivityIndicator
              accessible
              accessibilityLabel={t('growth.detail.loading')}
              accessibilityRole="progressbar"
              accessibilityState={{ busy: true }}
              color={theme.colors.primary}
              size="small"
            />
          ) : null}
        </View>
        <Text color="textMuted">
          {t('growth.detail.description', { skill: skillName })}
        </Text>
      </View>

      {state.entries.length === 0 ? (
        <View
          style={[
            styles.stateCard,
            {
              backgroundColor: theme.colors.surfaceSubtle,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text variant="subheading">{t('growth.detail.empty.title')}</Text>
          <Text color="textMuted">{t('growth.detail.empty.description')}</Text>
        </View>
      ) : (
        <View style={styles.thread}>
          {state.entries.map((entry, index) => (
            <SkillEvidenceThreadItem
              key={entry.id}
              entry={entry}
              dateLabel={formatEvidenceDate(entry.occurredAt, locale)}
              openHint={t('growth.detail.openEntry')}
              isLast={index === state.entries.length - 1}
              onPress={() => onOpenEntry(entry.id)}
            />
          ))}
        </View>
      )}

      <View
        style={[
          styles.coverageCard,
          { backgroundColor: theme.colors.surfaceSubtle },
        ]}
      >
        <Text variant="bodyStrong">{t('growth.detail.coverageTitle')}</Text>
        <Text color="textMuted">
          {t('growth.detail.coverageDescription')}
        </Text>
      </View>
    </View>
  );
}

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
          styles.invalidContent,
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
    gap: spacing[5],
    paddingBottom: spacing[8],
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
    gap: spacing[4],
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 240,
  },
  stateCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing[3],
    padding: spacing[4],
  },
  refreshNotice: {
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing[3],
  },
  summaryCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing[2],
    padding: spacing[4],
  },
  summaryTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[3],
    justifyContent: 'space-between',
  },
  thread: {
    paddingTop: spacing[1],
  },
  coverageCard: {
    borderRadius: radii.lg,
    gap: spacing[1],
    padding: spacing[4],
  },
  invalidContent: {
    flex: 1,
    gap: spacing[4],
    justifyContent: 'center',
  },
});
