import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { spacing } from '@/design-system/tokens/theme';
import { AppLockSettingCard } from '@/features/app-lock/AppLockSettingCard';
import { HomeHeader } from '@/features/home/components/HomeHeader';
import { LogSomethingButton } from '@/features/home/components/LogSomethingButton';
import { RecentEntriesEmptySection } from '@/features/home/components/RecentEntriesEmptySection';
import { ReflectionSection } from '@/features/home/components/ReflectionSection';
import { ReviewScheduleSection } from '@/features/home/components/ReviewScheduleSection';
import { ThisWeekCard } from '@/features/home/components/ThisWeekCard';
import { useOnboarding } from '@/features/onboarding/useOnboarding';

const SCREEN_HORIZONTAL_PADDING = 22;

export function HomeScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { state } = useOnboarding();
  const insets = useSafeAreaInsets();
  const openCapture = () => router.push('/capture');

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
            paddingLeft: Math.max(insets.left, SCREEN_HORIZONTAL_PADDING),
            paddingRight: Math.max(insets.right, SCREEN_HORIZONTAL_PADDING),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <HomeHeader />
        <LogSomethingButton onPress={openCapture} />
        <ThisWeekCard />
        <ReflectionSection onLogSomething={openCapture} />
        <RecentEntriesEmptySection />
        <ReviewScheduleSection reviewSchedule={state.reviewSchedule} />
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
