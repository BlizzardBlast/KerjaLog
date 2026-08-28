import { StyleSheet, View } from 'react-native';
import { DecorativeView } from '@/design-system/components/DecorativeView';
import { Text } from '@/design-system/components/Text';
import { AppIcon } from '@/design-system/icons/AppIcon';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { spacing } from '@/design-system/tokens/theme';
import { SectionHeading } from '@/features/home/components/SectionHeading';
import type { ReviewSchedule } from '@/features/onboarding/model';
import type { TranslationKey } from '@/i18n/translations';
import { useI18n } from '@/i18n/I18nProvider';

const reviewScheduleLabelKeys: Record<ReviewSchedule, TranslationKey> = {
  'within-3-months': 'home.review.within3Months',
  'within-6-months': 'home.review.within6Months',
  'within-12-months': 'home.review.within12Months',
  'not-sure': 'home.review.notSet',
};

type ReviewScheduleSectionProps = {
  reviewSchedule: ReviewSchedule | undefined;
};

export function ReviewScheduleSection({
  reviewSchedule,
}: Readonly<ReviewScheduleSectionProps>) {
  const { theme } = useTheme();
  const { t } = useI18n();
  const reviewScheduleLabel = reviewSchedule
    ? t(reviewScheduleLabelKeys[reviewSchedule])
    : t('home.review.notSet');

  return (
    <>
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
        <DecorativeView
          style={[
            styles.reviewIcon,
            { backgroundColor: theme.colors.successSoft },
          ]}
        >
          <AppIcon
            name={{ ios: 'calendar', android: 'calendar_month' }}
            size={22}
            color={theme.colors.success}
          />
        </DecorativeView>
        <View style={styles.reviewCopy}>
          <Text variant="bodyStrong">{t('home.review.performanceReview')}</Text>
          <Text variant="caption" color="textMuted">
            {reviewScheduleLabel}
          </Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  reviewRow: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: spacing[4],
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
