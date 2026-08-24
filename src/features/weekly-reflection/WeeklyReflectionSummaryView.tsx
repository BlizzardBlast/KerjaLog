import { StyleSheet, View } from 'react-native';
import { Button } from '@/design-system/components/Button';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing } from '@/design-system/tokens/theme';
import { promptTranslationKeyById } from '@/features/weekly-reflection/reflectionCopy';
import type { WeeklyReflectionPrompt } from '@/features/weekly-reflection/reflectionPrompts';
import type { ReflectionHandoffState } from '@/features/weekly-reflection/useWeeklyReflectionController';
import { useI18n } from '@/i18n/I18nProvider';

type AnsweredPrompt = {
  prompt: WeeklyReflectionPrompt;
  answer: string;
};

type WeeklyReflectionSummaryViewProps = {
  answeredPrompts: AnsweredPrompt[];
  handoffState: ReflectionHandoffState;
  onLogAnswer: (prompt: WeeklyReflectionPrompt, answer: string) => void;
  onOpenDraft: () => void;
  onBackHome: () => void;
};

export function WeeklyReflectionSummaryView({
  answeredPrompts,
  handoffState,
  onLogAnswer,
  onOpenDraft,
  onBackHome,
}: WeeklyReflectionSummaryViewProps) {
  const { t } = useI18n();
  const { theme } = useTheme();

  return (
    <>
      <Text variant="overline" color="primary">
        {t('reflection.summary.eyebrow')}
      </Text>
      <Text variant="title">{t('reflection.summary.title')}</Text>
      <Text color="textMuted">{t('reflection.summary.description')}</Text>

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
          <Text variant="subheading">{t('reflection.summary.emptyTitle')}</Text>
          <Text color="textMuted">
            {t('reflection.summary.emptyDescription')}
          </Text>
        </View>
      ) : (
        answeredPrompts.map(({ prompt, answer }) => (
          <View
            key={prompt.id}
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text variant="bodyStrong">
              {t(promptTranslationKeyById[prompt.id])}
            </Text>
            <Text>{answer}</Text>
            <Button
              disabled={handoffState === 'saving'}
              loading={handoffState === 'saving'}
              onPress={() => onLogAnswer(prompt, answer)}
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
          <Button onPress={onOpenDraft} variant="ghost">
            {t('reflection.handoff.openDraft')}
          </Button>
        </View>
      ) : null}

      {handoffState === 'error' ? (
        <Text accessibilityRole="alert" color="danger">
          {t('reflection.handoff.error')}
        </Text>
      ) : null}

      <Button fullWidth onPress={onBackHome} size="lg">
        {t('reflection.summary.backHome')}
      </Button>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing[3],
    padding: spacing[4],
  },
  notice: {
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing[2],
    padding: spacing[4],
  },
});
