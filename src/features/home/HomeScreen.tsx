import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/design-system/components/Button';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import type { ReviewSchedule } from '@/features/onboarding/model';
import { loadOnboardingState } from '@/features/onboarding/storage';
import { useI18n } from '@/i18n/I18nProvider';
import type { TranslationKey } from '@/i18n/translations';

const reviewScheduleLabelKeys: Record<ReviewSchedule, TranslationKey> = {
  'within-3-months': 'home.review.within3Months',
  'within-6-months': 'home.review.within6Months',
  'within-12-months': 'home.review.within12Months',
  'not-sure': 'home.review.notSet',
};

export function HomeScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useI18n();
  const [reviewSchedule, setReviewSchedule] = useState<
    ReviewSchedule | undefined
  >();
  const [isReviewScheduleLoaded, setIsReviewScheduleLoaded] = useState(false);

  useEffect(() => {
    let isActive = true;

    loadOnboardingState().then((state) => {
      if (isActive) {
        setReviewSchedule(state.reviewSchedule);
        setIsReviewScheduleLoaded(true);
      }
    });

    return () => {
      isActive = false;
    };
  }, []);

  const reviewScheduleLabel = !isReviewScheduleLoaded
    ? t('common.loading.setup')
    : reviewSchedule
      ? t(reviewScheduleLabelKeys[reviewSchedule])
      : t('home.review.notSet');

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.screen, { backgroundColor: theme.colors.canvas }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headingBlock}>
          <Text variant="overline" color="primary">
            {t('home.eyebrow')}
          </Text>
          <Text variant="title">{t('home.title')}</Text>
          <Text variant="body" color="textMuted">
            {t('home.description')}
          </Text>
        </View>

        <Button
          fullWidth
          leadingIcon={
            <SymbolView
              name={{ ios: 'plus', android: 'add', web: 'add' }}
              size={20}
              tintColor={theme.colors.onPrimary}
            />
          }
          onPress={() => router.push('/capture')}
          size="lg"
        >
          {t('home.logSomething')}
        </Button>

        <View
          style={[
            styles.weekCard,
            {
              backgroundColor: theme.colors.primarySoft,
              borderColor: theme.colors.primary,
            },
          ]}
        >
          <View style={styles.cardHeadingRow}>
            <View style={styles.cardHeadingCopy}>
              <Text variant="overline" color="primary">
                {t('home.thisWeek.eyebrow')}
              </Text>
              <Text variant="heading">{t('home.thisWeek.title')}</Text>
            </View>
            <View
              style={[
                styles.countPill,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <Text variant="label" color="primary">
                {t('home.thisWeek.zeroEntries')}
              </Text>
            </View>
          </View>
          <Text variant="body" color="textMuted">
            {t('home.thisWeek.description')}
          </Text>
        </View>

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
            onPress={() => router.push('/capture')}
            style={styles.inlineButton}
            variant="secondary"
          >
            {t('home.reflection.action')}
          </Button>
        </View>

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
          <View
            accessibilityElementsHidden
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
          </View>
          <Text variant="bodyStrong">{t('home.recent.emptyTitle')}</Text>
          <Text variant="caption" color="textMuted" style={styles.emptyCopy}>
            {t('home.recent.emptyDescription')}
          </Text>
        </View>

        <SectionHeading
          title={t('home.review.title')}
          description={t('home.review.description')}
        />
        <View
          style={[
            styles.reviewRow,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View
            accessibilityElementsHidden
            style={[
              styles.reviewIcon,
              { backgroundColor: theme.colors.successSoft },
            ]}
          >
            <SymbolView
              name={{
                ios: 'calendar',
                android: 'calendar_month',
                web: 'calendar_month',
              }}
              size={22}
              tintColor={theme.colors.success}
            />
          </View>
          <View style={styles.reviewCopy}>
            <Text variant="bodyStrong">
              {t('home.review.performanceReview')}
            </Text>
            <Text variant="caption" color="textMuted">
              {reviewScheduleLabel}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <View style={styles.sectionHeading}>
      <Text variant="heading">{title}</Text>
      <Text variant="caption" color="textMuted">
        {description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    gap: 16,
    paddingBottom: 32,
    paddingHorizontal: 22,
    paddingTop: 18,
  },
  headingBlock: {
    gap: 8,
    marginBottom: 4,
  },
  weekCard: {
    borderRadius: 22,
    borderWidth: 1,
    gap: 14,
    padding: 18,
  },
  cardHeadingRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
  },
  cardHeadingCopy: {
    flex: 1,
    gap: 4,
  },
  countPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sectionHeading: {
    gap: 2,
    marginTop: 10,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  cardDescription: {
    marginTop: 5,
  },
  inlineButton: {
    marginTop: 16,
  },
  emptyCard: {
    alignItems: 'flex-start',
    borderRadius: 20,
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
  reviewRow: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 16,
  },
  reviewIcon: {
    alignItems: 'center',
    borderRadius: 14,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  reviewCopy: {
    flex: 1,
    gap: 2,
  },
});
