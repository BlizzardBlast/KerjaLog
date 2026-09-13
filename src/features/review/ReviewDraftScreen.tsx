import * as Sentry from '@sentry/react-native';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/design-system/components/Button';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { layout, spacing } from '@/design-system/tokens/theme';
import { reviewRepository } from '@/data/repositories/reviewRepository';
import type { ReviewDraft } from '@/domain/review/model';
import { ReviewDraftEditor } from '@/features/review/ReviewDraftEditor';
import { useI18n } from '@/i18n/I18nProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ReviewDraftScreenProps = { id: string };

type DraftState =
  | { id: string; status: 'loading' }
  | { id: string; status: 'not-found' }
  | { id: string; status: 'loaded'; draft: ReviewDraft };

function ProfiledReviewDraftScreen({ id }: Readonly<ReviewDraftScreenProps>) {
  const router = Sentry.wrapExpoRouter(useRouter());
  const { t } = useI18n();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<DraftState>({ id, status: 'loading' });
  const requestId = useRef(0);

  useEffect(() => {
    const activeRequestId = ++requestId.current;
    void reviewRepository.findDraft(id).then(
      (draft) => {
        if (requestId.current === activeRequestId) {
          setState(
            draft
              ? { id, status: 'loaded', draft }
              : { id, status: 'not-found' },
          );
        }
      },
      () => {
        if (requestId.current === activeRequestId) {
          setState({ id, status: 'not-found' });
        }
      },
    );

    return () => {
      requestId.current += 1;
    };
  }, [id]);

  if (state.status === 'loading' || state.id !== id) {
    return (
      <View
        style={[styles.centered, { backgroundColor: theme.colors.surface }]}
      >
        <Text
          accessibilityRole="progressbar"
          accessibilityState={{ busy: true }}
        >
          {t('review.editor.loading')}
        </Text>
      </View>
    );
  }
  if (state.status === 'not-found') {
    return (
      <View
        style={[styles.centered, { backgroundColor: theme.colors.surface }]}
      >
        <Text accessibilityRole="header" variant="title">
          {t('review.editor.notFound.title')}
        </Text>
        <Text color="textMuted">{t('review.editor.notFound.description')}</Text>
        <Button fullWidth onPress={() => router.replace('/review')}>
          {t('review.editor.back')}
        </Button>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.colors.surface }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingLeft: Math.max(insets.left, layout.screenHorizontalPadding),
          paddingRight: Math.max(insets.right, layout.screenHorizontalPadding),
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <ReviewDraftEditor
        key={state.draft.id}
        draft={state.draft}
        onDeleted={() => router.replace('/review')}
        onCreateUpdatedCopy={() =>
          router.push({
            pathname: '/review',
            params: { copyFrom: state.draft.id },
          })
        }
      />
    </ScrollView>
  );
}

const ReviewDraftScreen = Sentry.withProfiler(ProfiledReviewDraftScreen);

export { ReviewDraftScreen };

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: {
    flex: 1,
    gap: spacing[3],
    justifyContent: 'center',
    padding: spacing[5],
  },
  content: { paddingBottom: spacing[8], paddingTop: spacing[5] },
});
