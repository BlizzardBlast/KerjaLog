import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/design-system/components/Button';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import type { ReviewSchedule } from '@/features/onboarding/model';
import { loadOnboardingState } from '@/features/onboarding/storage';

const reviewScheduleLabels: Record<ReviewSchedule, string> = {
  'within-3-months': 'Within the next 3 months',
  'within-6-months': 'Within the next 6 months',
  'within-12-months': 'Within the next 12 months',
  'not-sure': 'Not set yet',
};

export function HomeScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [reviewSchedule, setReviewSchedule] = useState<ReviewSchedule | undefined>();

  useEffect(() => {
    let isActive = true;

    loadOnboardingState().then((state) => {
      if (isActive) {
        setReviewSchedule(state.reviewSchedule);
      }
    });

    return () => {
      isActive = false;
    };
  }, []);

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
            KerjaLog
          </Text>
          <Text variant="title">Your work matters—even when it feels routine.</Text>
          <Text variant="body" color="textMuted">
            Capture one useful detail while it is still easy to remember.
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
          Log something
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
                This week
              </Text>
              <Text variant="heading">Start with one small thing</Text>
            </View>
            <View
              style={[
                styles.countPill,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <Text variant="label" color="primary">
                0 entries
              </Text>
            </View>
          </View>
          <Text variant="body" color="textMuted">
            A solved problem, a teammate you helped, a task you finished, or something you learned all count.
          </Text>
        </View>

        <SectionHeading
          title="Weekly reflection"
          description="A gentle prompt, not a streak."
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
          <Text variant="bodyStrong">
            What became easier, clearer, faster, or safer because of your work this week?
          </Text>
          <Text variant="caption" color="textMuted" style={styles.cardDescription}>
            You can skip this and come back later.
          </Text>
          <Button
            onPress={() => router.push('/capture')}
            style={styles.inlineButton}
            variant="secondary"
          >
            Reflect on this week
          </Button>
        </View>

        <SectionHeading
          title="Recent progress"
          description="Your newest work entries will appear here."
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
          <Text variant="bodyStrong">Nothing logged yet</Text>
          <Text variant="caption" color="textMuted" style={styles.emptyCopy}>
            Your first entry does not need a metric or a big achievement. Write down what happened and KerjaLog will help you develop it later.
          </Text>
        </View>

        <SectionHeading
          title="Next review"
          description="A reminder of what you are collecting evidence for."
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
              name={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }}
              size={22}
              tintColor={theme.colors.success}
            />
          </View>
          <View style={styles.reviewCopy}>
            <Text variant="bodyStrong">Performance review</Text>
            <Text variant="caption" color="textMuted">
              {reviewSchedule ? reviewScheduleLabels[reviewSchedule] : 'Loading your setup…'}
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
