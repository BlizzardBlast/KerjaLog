import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { layout, spacing } from '@/design-system/tokens/theme';
import { AppLockSettingCard } from '@/features/app-lock/AppLockSettingCard';
import { HomeHeader } from '@/features/home/components/HomeHeader';
import { HomeWorkDataError } from '@/features/home/components/HomeWorkDataError';
import { LogSomethingButton } from '@/features/home/components/LogSomethingButton';
import { RecentEntriesEmptySection } from '@/features/home/components/RecentEntriesEmptySection';
import { RecentEntriesLoadingSection } from '@/features/home/components/RecentEntriesLoadingSection';
import { RecentEntriesSection } from '@/features/home/components/RecentEntriesSection';
import { ReflectionSection } from '@/features/home/components/ReflectionSection';
import { ReviewScheduleSection } from '@/features/home/components/ReviewScheduleSection';
import { ThisWeekCard } from '@/features/home/components/ThisWeekCard';
import { useHomeWorkEntries } from '@/features/home/useHomeWorkEntries';
import { useOnboarding } from '@/features/onboarding/useOnboarding';
import { InexactReminderNotice } from '@/features/reminder/InexactReminderNotice';

export function HomeScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { state } = useOnboarding();
  const workEntries = useHomeWorkEntries();
  const insets = useSafeAreaInsets();
  const openCapture = () => router.push('/capture');
  const openEntry = (id: string) =>
    router.push({ pathname: '/entry/[id]', params: { id } });

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.screen, { backgroundColor: theme.colors.surface }]}
    >
      <ScrollView
        style={styles.scrollView}
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
        showsVerticalScrollIndicator={false}
      >
        <HomeHeader />
        <LogSomethingButton onPress={openCapture} />

        {workEntries.status === 'error' ? (
          <HomeWorkDataError />
        ) : (
          <ThisWeekCard
            entryCount={
              workEntries.status === 'loaded' ? workEntries.thisWeekCount : null
            }
          />
        )}

        <ReflectionSection onLogSomething={openCapture} />

        {workEntries.status === 'loading' ? (
          <RecentEntriesLoadingSection />
        ) : null}
        {workEntries.status === 'loaded' &&
        workEntries.recentEntries.length === 0 ? (
          <RecentEntriesEmptySection />
        ) : null}
        {workEntries.status === 'loaded' &&
        workEntries.recentEntries.length > 0 ? (
          <RecentEntriesSection
            entries={workEntries.recentEntries}
            onEntryPress={openEntry}
          />
        ) : null}

        <ReviewScheduleSection reviewSchedule={state.reviewSchedule} />
        {state.weeklyReminderEnabled &&
        state.weeklyReminderPrecision === 'inexact' ? (
          <InexactReminderNotice />
        ) : null}
        <AppLockSettingCard />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    minHeight: 0,
  },
  content: {
    gap: spacing[4],
    paddingBottom: spacing[8],
    paddingTop: 18,
  },
});
