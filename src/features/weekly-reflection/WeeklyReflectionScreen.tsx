import * as Sentry from '@sentry/react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Button } from '@/design-system/components/Button';
import { Text } from '@/design-system/components/Text';
import { TextField } from '@/design-system/components/TextField';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { layout, radii, spacing } from '@/design-system/tokens/theme';
import { workEntryDraftRepository } from '@/data/repositories/workEntryDraftRepository';
import {
  EMPTY_WORK_ENTRY_DRAFT,
  hasWorkEntryDraftContent,
} from '@/domain/entry/draft';
import { WORK_ENTRY_TEXT_LIMITS } from '@/domain/entry/limits';
import {
  WEEKLY_REFLECTION_PROMPTS,
  type WeeklyReflectionPromptId,
} from '@/features/weekly-reflection/reflectionPrompts';
import { useI18n } from '@/i18n/I18nProvider';

const promptTranslationKeyById = {
  moved_forward: 'reflection.prompt.moved_forward',
  helped: 'reflection.prompt.helped',
  problem: 'reflection.prompt.problem',
  learned: 'reflection.prompt.learned',
} as const;

type ReflectionAnswers = Partial<Record<WeeklyReflectionPromptId, string>>;
type HandoffState = 'idle' | 'saving' | 'active-draft' | 'error';

function ProfiledWeeklyReflectionScreen() {
  const router = Sentry.wrapExpoRouter(useRouter());
  const { t } = useI18n();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [promptIndex, setPromptIndex] = useState(0);
  const [answers, setAnswers] = useState<ReflectionAnswers>({});
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [handoffState, setHandoffState] = useState<HandoffState>('idle');

  const prompt = WEEKLY_REFLECTION_PROMPTS[promptIndex];
  const answeredPrompts = WEEKLY_REFLECTION_PROMPTS.flatMap((item) => {
    const answer = answers[item.id]?.trim();
    return answer ? [{ prompt: item, answer }] : [];
  });

  const advance = (saveAnswer: boolean) => {
    if (!prompt) {
      return;
    }

    const nextAnswers = { ...answers };
    if (saveAnswer && currentAnswer.trim()) {
      nextAnswers[prompt.id] = currentAnswer.trim();
    } else {
      delete nextAnswers[prompt.id];
    }
    setAnswers(nextAnswers);
    setCurrentAnswer('');
    setHandoffState('idle');

    if (promptIndex === WEEKLY_REFLECTION_PROMPTS.length - 1) {
      setReviewing(true);
      return;
    }

    setPromptIndex((current) => current + 1);
  };

  const handoffToLog = async (
    promptId: WeeklyReflectionPromptId,
    answer: string,
  ) => {
    const promptToLog = WEEKLY_REFLECTION_PROMPTS.find(
      (item) => item.id === promptId,
    );
    if (!promptToLog || handoffState === 'saving') {
      return;
    }

    setHandoffState('saving');
    try {
      const activeDraft = await workEntryDraftRepository.loadActive();
      if (activeDraft && hasWorkEntryDraftContent(activeDraft)) {
        setHandoffState('active-draft');
        return;
      }

      await workEntryDraftRepository.saveActive({
        ...EMPTY_WORK_ENTRY_DRAFT,
        step: 'event',
        intent: promptToLog.intent,
        rawNote: answer.trim(),
      });
      setHandoffState('idle');
      router.push('/entry/new');
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          feature: 'weekly-reflection',
          operation: 'handoff-to-log',
        },
      });
      setHandoffState('error');
    }
  };

  if (reviewing) {
    return (
      <SafeAreaView
        edges={['top']}
        style={[styles.screen, { backgroundColor: theme.colors.background }]}
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
          <Text variant="overline" color="primary">
            {t('reflection.summary.eyebrow')}
          </Text>
          <Text variant="title">{t('reflection.summary.title')}</Text>
          <Text color="textMuted">
            {t('reflection.summary.description')}
          </Text>

          {answeredPrompts.length === 0 ? (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text variant="subheading">
                {t('reflection.summary.emptyTitle')}
              </Text>
              <Text color="textMuted">
                {t('reflection.summary.emptyDescription')}
              </Text>
            </View>
          ) : (
            answeredPrompts.map(({ prompt: item, answer }) => (
              <View
                key={item.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Text variant="bodyStrong">
                  {t(promptTranslationKeyById[item.id])}
                </Text>
                <Text>{answer}</Text>
                <Button
                  disabled={handoffState === 'saving'}
                  loading={handoffState === 'saving'}
                  onPress={() => handoffToLog(item.id, answer)}
                  variant="secondary"
                >
                  {t('reflection.summary.logThis')}
                </Button>
              </View>
            ))
          )}

          {handoffState === 'active-draft' ? (
            <View
              accessibilityRole="alert"
              style={[
                styles.notice,
                {
                  backgroundColor: theme.colors.warningSoft,
                  borderColor: theme.colors.warning,
                },
              ]}
            >
              <Text variant="bodyStrong">
                {t('reflection.handoff.activeDraftTitle')}
              </Text>
              <Text>{t('reflection.handoff.activeDraftDescription')}</Text>
              <Button onPress={() => router.push('/entry/new')} variant="ghost">
                {t('reflection.handoff.openDraft')}
              </Button>
            </View>
          ) : null}

          {handoffState === 'error' ? (
            <Text accessibilityRole="alert" color="danger">
              {t('reflection.handoff.error')}
            </Text>
          ) : null}

          <Button fullWidth onPress={() => router.replace('/home')} size="lg">
            {t('reflection.summary.backHome')}
          </Button>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!prompt) {
    return null;
  }

  const isLastPrompt = promptIndex === WEEKLY_REFLECTION_PROMPTS.length - 1;

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
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
        <Text variant="overline" color="primary">
          {t('reflection.eyebrow')}
        </Text>
        <Text variant="title">{t('reflection.title')}</Text>
        <Text color="textMuted">{t('reflection.description')}</Text>
        <Text variant="caption" color="textMuted">
          {t('reflection.progress', {
            current: promptIndex + 1,
            total: WEEKLY_REFLECTION_PROMPTS.length,
          })}
        </Text>

        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text variant="heading">
            {t(promptTranslationKeyById[prompt.id])}
          </Text>
          <TextField
            accessibilityLabel={t(promptTranslationKeyById[prompt.id])}
            maxLength={WORK_ENTRY_TEXT_LIMITS.rawNote}
            multiline
            onChangeText={setCurrentAnswer}
            placeholder={t('reflection.placeholder')}
            style={styles.textarea}
            textAlignVertical="top"
            value={currentAnswer}
          />
          <Text variant="caption" color="textMuted">
            {t('reflection.privacy')}
          </Text>
        </View>

        <View style={styles.actions}>
          <Button
            onPress={() => advance(false)}
            style={styles.action}
            variant="secondary"
          >
            {t('reflection.skip')}
          </Button>
          <Button
            disabled={!currentAnswer.trim()}
            onPress={() => advance(true)}
            style={styles.action}
          >
            {t(isLastPrompt ? 'reflection.finish' : 'reflection.continue')}
          </Button>
        </View>
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
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing[3],
    padding: spacing[4],
  },
  textarea: {
    borderRadius: radii.lg,
    borderWidth: 1,
    minHeight: 156,
    padding: spacing[4],
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  action: {
    flex: 1,
    minWidth: 140,
  },
  notice: {
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing[2],
    padding: spacing[4],
  },
});
