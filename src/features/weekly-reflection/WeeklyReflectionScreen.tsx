import * as Sentry from '@sentry/react-native';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { layout, spacing } from '@/design-system/tokens/theme';
import { WeeklyReflectionPromptView } from '@/features/weekly-reflection/WeeklyReflectionPromptView';
import { WeeklyReflectionSummaryView } from '@/features/weekly-reflection/WeeklyReflectionSummaryView';
import { useWeeklyReflectionController } from '@/features/weekly-reflection/useWeeklyReflectionController';

function ProfiledWeeklyReflectionScreen() {
  const router = Sentry.wrapExpoRouter(useRouter());
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const flow = useWeeklyReflectionController({
    onOpenLog: () => router.push('/entry/new'),
  });

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.screen, { backgroundColor: theme.colors.canvas }]}
    >
      <ScrollView
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
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {flow.reviewing ? (
          <WeeklyReflectionSummaryView
            answeredPrompts={flow.answeredPrompts}
            handoffState={flow.handoffState}
            onBackHome={() => router.replace('/home')}
            onLogAnswer={(prompt, answer) =>
              flow.handoffToLog(prompt.id, answer)
            }
            onOpenDraft={() => router.push('/entry/new')}
          />
        ) : flow.prompt ? (
          <WeeklyReflectionPromptView
            currentAnswer={flow.currentAnswer}
            onAnswerChange={flow.setCurrentAnswer}
            onContinue={() => flow.advance(true)}
            onSkip={() => flow.advance(false)}
            prompt={flow.prompt}
            promptIndex={flow.promptIndex}
            totalPrompts={flow.totalPrompts}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const WeeklyReflectionScreen = Sentry.withProfiler(
  ProfiledWeeklyReflectionScreen,
);

export { WeeklyReflectionScreen };

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    gap: spacing[4],
    paddingBottom: spacing[8],
    paddingTop: spacing[4],
  },
});
