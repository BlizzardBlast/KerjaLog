import * as Sentry from '@sentry/react-native';
import { useRouter } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
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
  const goHome = () => router.replace('/home');
  const openLog = () => router.push('/entry/new');
  const flow = useWeeklyReflectionController({ onOpenLog: openLog });

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.screen, { backgroundColor: theme.colors.canvas }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.screen}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingLeft: Math.max(
                insets.left,
                layout.screenHorizontalPadding,
              ),
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
              onBackHome={goHome}
              onLogAnswer={(prompt, answer) =>
                flow.handoffToLog(prompt.id, answer)
              }
              onOpenDraft={openLog}
            />
          ) : flow.prompt ? (
            <WeeklyReflectionPromptView
              currentAnswer={flow.currentAnswer}
              onAnswerChange={flow.setCurrentAnswer}
              onClose={goHome}
              onContinue={() => flow.advance(true)}
              onSkip={() => flow.advance(false)}
              prompt={flow.prompt}
              promptIndex={flow.promptIndex}
              totalPrompts={flow.totalPrompts}
            />
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
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
