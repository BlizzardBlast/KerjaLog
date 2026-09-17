import * as Sentry from '@sentry/react-native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { reviewRepository } from '@/data/repositories/reviewRepository';
import { Button } from '@/design-system/components/Button';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { layout, spacing } from '@/design-system/tokens/theme';
import type { ReviewDraft } from '@/domain/review/model';
import { ReviewDraftEditor } from '@/features/review/ReviewDraftEditor';
import { ReviewSaveToast } from '@/features/review/ReviewSaveToast';
import { useI18n } from '@/i18n/I18nProvider';

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
  const [saveToastKey, setSaveToastKey] = useState<number | null>(null);
  const requestId = useRef(0);
  const dismissSaveToast = useCallback(() => setSaveToastKey(null), []);

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
          setSaveToastKey(null);
        }
      },
      () => {
        if (requestId.current === activeRequestId) {
          setState({ id, status: 'not-found' });
          setSaveToastKey(null);
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
        testID="review-draft-loading-state"
        style={[
          styles.centered,
          styles.loadingState,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <Text
          accessibilityRole="progressbar"
          accessibilityState={{ busy: true }}
          style={styles.loadingText}
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
    <View style={[styles.screen, { backgroundColor: theme.colors.surface }]}>
      <ScrollView
        style={styles.scroll}
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
        <ReviewDraftEditor
          key={state.draft.id}
          draft={state.draft}
          onSaved={(savedDraft) => {
            setState((current) =>
              current.status === 'loaded' &&
              current.id === id &&
              current.draft.id === savedDraft.id
                ? { ...current, draft: savedDraft }
                : current,
            );
            setSaveToastKey((current) => (current ?? 0) + 1);
          }}
          onSaveFeedbackCleared={dismissSaveToast}
          onDeleted={() => router.replace('/review')}
          onCreateUpdatedCopy={() =>
            router.push({
              pathname: '/review',
              params: { copyFrom: state.draft.id },
            })
          }
        />
      </ScrollView>
      {saveToastKey !== null ? (
        <View
          pointerEvents="none"
          style={[
            styles.toastOverlay,
            {
              bottom: Math.max(insets.bottom, spacing[5]),
              left: Math.max(insets.left, layout.screenHorizontalPadding),
              right: Math.max(insets.right, layout.screenHorizontalPadding),
            },
          ]}
        >
          <ReviewSaveToast
            key={saveToastKey}
            message={t('review.editor.saveSuccess')}
            onDismiss={dismissSaveToast}
          />
        </View>
      ) : null}
    </View>
  );
}

const ReviewDraftScreen = Sentry.withProfiler(ProfiledReviewDraftScreen);

export { ReviewDraftScreen };

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },
  centered: {
    flex: 1,
    gap: spacing[3],
    justifyContent: 'center',
    padding: spacing[5],
  },
  loadingState: {
    alignItems: 'center',
  },
  loadingText: {
    textAlign: 'center',
  },
  content: { paddingBottom: spacing[8], paddingTop: spacing[5] },
  toastOverlay: {
    position: 'absolute',
  },
});
