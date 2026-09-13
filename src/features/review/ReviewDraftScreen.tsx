import * as Sentry from '@sentry/react-native';
import { useForm, useSelector } from '@tanstack/react-form';
import * as Crypto from 'expo-crypto';
import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/design-system/components/Button';
import { Text } from '@/design-system/components/Text';
import { TextField } from '@/design-system/components/TextField';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { layout, radii, spacing } from '@/design-system/tokens/theme';
import { reviewRepository } from '@/data/repositories/reviewRepository';
import {
  renderReviewDocumentHtml,
  renderReviewDocumentMarkdown,
  renderReviewDocumentPlainText,
} from '@/domain/review/document';
import type { ReviewDraft, ReviewDraftDocument } from '@/domain/review/model';
import { useI18n } from '@/i18n/I18nProvider';
import { reviewOutput } from '@/platform/review-output/reviewOutput';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ReviewDraftScreenProps = { id: string };

type DraftState =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'loaded'; draft: ReviewDraft };

type EditorValues = { title: string; document: ReviewDraftDocument };
type ReviewOutputAction = 'copy' | 'pdf' | 'markdown' | 'share';

function ProfiledReviewDraftScreen({ id }: Readonly<ReviewDraftScreenProps>) {
  const router = Sentry.wrapExpoRouter(useRouter());
  const { t } = useI18n();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<DraftState>({ status: 'loading' });
  const requestId = useRef(0);

  useEffect(() => {
    const activeRequestId = ++requestId.current;
    void reviewRepository.findDraft(id).then(
      (draft) => {
        if (requestId.current === activeRequestId) {
          setState(
            draft ? { status: 'loaded', draft } : { status: 'not-found' },
          );
        }
      },
      () => {
        if (requestId.current === activeRequestId) {
          setState({ status: 'not-found' });
        }
      },
    );
  }, [id]);

  if (state.status === 'loading') {
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

function ReviewDraftEditor({
  draft,
  onDeleted,
  onCreateUpdatedCopy,
}: Readonly<{
  draft: ReviewDraft;
  onDeleted: () => void;
  onCreateUpdatedCopy: () => void;
}>) {
  const { t } = useI18n();
  const { theme } = useTheme();
  const [saveError, setSaveError] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [outputAction, setOutputAction] = useState<ReviewOutputAction | null>(
    null,
  );
  const [outputError, setOutputError] = useState(false);
  const form = useForm({
    defaultValues: {
      title: draft.title,
      document: draft.document,
    } satisfies EditorValues,
    onSubmit: async ({ value }) => {
      try {
        await reviewRepository.updateDraft(draft.id, value);
      } catch {
        setSaveError(true);
      }
    },
  });
  const title = useSelector(form.store, (state) => state.values.title);
  const document = useSelector(form.store, (state) => state.values.document);
  const isSubmitting = useSelector(form.store, (state) => state.isSubmitting);

  const updateDocument = (nextDocument: ReviewDraftDocument) => {
    form.setFieldValue('document', nextDocument);
    setSaveError(false);
  };
  const updateSection = (
    sectionIndex: number,
    update: (
      section: ReviewDraftDocument['sections'][number],
    ) => ReviewDraftDocument['sections'][number],
  ) => {
    updateDocument({
      sections: document.sections.map((section, index) =>
        index === sectionIndex ? update(section) : section,
      ),
    });
  };
  const moveSection = (sectionIndex: number, offset: -1 | 1) => {
    const targetIndex = sectionIndex + offset;
    if (targetIndex < 0 || targetIndex >= document.sections.length) {
      return;
    }
    const sections = [...document.sections];
    const current = sections[sectionIndex];
    const target = sections[targetIndex];
    if (!current || !target) {
      return;
    }
    sections[sectionIndex] = target;
    sections[targetIndex] = current;
    updateDocument({ sections });
  };
  const deleteDraft = async () => {
    if (isDeleting) {
      return;
    }
    setIsDeleting(true);
    setDeleteError(false);
    try {
      await reviewRepository.deleteDraft(draft.id);
      onDeleted();
    } catch {
      setDeleteError(true);
      setIsDeleting(false);
    }
  };
  const runOutput = async (action: ReviewOutputAction) => {
    setOutputAction(action);
    setOutputError(false);
    const output = {
      html: renderReviewDocumentHtml(title, document),
      markdown: renderReviewDocumentMarkdown(title, document),
      plainText: renderReviewDocumentPlainText(title, document),
    };
    try {
      switch (action) {
        case 'copy':
          await reviewOutput.copyFormatted(output);
          break;
        case 'pdf':
          await reviewOutput.sharePdf(output);
          break;
        case 'markdown':
          await reviewOutput.shareMarkdown(output);
          break;
        case 'share':
          await reviewOutput.sharePlainText(output);
          break;
      }
    } catch {
      setOutputError(true);
    } finally {
      setOutputAction(null);
    }
  };
  const confirmOutput = (action: ReviewOutputAction) => {
    Alert.alert(
      t('review.output.confirmTitle'),
      t('review.output.confirmDescription'),
      [
        { text: t('review.output.confirmCancel'), style: 'cancel' },
        {
          text: t('review.output.confirmAction'),
          onPress: () => runOutput(action),
        },
      ],
    );
  };

  return (
    <View style={styles.editor}>
      <View style={styles.heading}>
        <Text variant="overline" color="primary">
          {t('review.eyebrow')}
        </Text>
        <Text accessibilityRole="header" variant="title">
          {title}
        </Text>
        <Text color="textMuted" variant="caption">
          {t('review.draft.period', draft.period)}
        </Text>
      </View>
      <View style={styles.fieldGroup}>
        <Text variant="label">{t('review.editor.titleLabel')}</Text>
        <TextField
          accessibilityLabel={t('review.editor.titleLabel')}
          value={title}
          onChangeText={(value) => {
            form.setFieldValue('title', value);
            setSaveError(false);
          }}
          style={styles.textInput}
        />
      </View>
      <View style={styles.sections}>
        <Text accessibilityRole="header" variant="subheading">
          {t('review.editor.sections')}
        </Text>
        {document.sections.map((section, sectionIndex) => (
          <View
            key={section.id}
            style={[
              styles.section,
              {
                backgroundColor: theme.colors.surfaceSubtle,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <TextField
              accessibilityLabel={t('review.editor.sectionTitle')}
              value={section.title}
              onChangeText={(value) =>
                updateSection(sectionIndex, (current) => ({
                  ...current,
                  title: value,
                }))
              }
              style={styles.textInput}
            />
            {section.bullets.map((bullet, bulletIndex) => (
              <View key={`${section.id}-${bullet}`} style={styles.bulletRow}>
                <TextField
                  accessibilityLabel={t('review.editor.bulletLabel', {
                    number: bulletIndex + 1,
                  })}
                  multiline
                  value={bullet}
                  onChangeText={(value) =>
                    updateSection(sectionIndex, (current) => ({
                      ...current,
                      bullets: current.bullets.map((item, index) =>
                        index === bulletIndex ? value : item,
                      ),
                    }))
                  }
                  style={[styles.textInput, styles.bulletInput]}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('review.editor.removeBullet')}
                  onPress={() =>
                    updateSection(sectionIndex, (current) => ({
                      ...current,
                      bullets: current.bullets.filter(
                        (_, index) => index !== bulletIndex,
                      ),
                    }))
                  }
                  style={styles.iconButton}
                >
                  <Text color="danger">×</Text>
                </Pressable>
              </View>
            ))}
            <View style={styles.sectionActions}>
              <Button
                size="sm"
                variant="secondary"
                onPress={() =>
                  updateSection(sectionIndex, (current) => ({
                    ...current,
                    bullets: [
                      ...current.bullets,
                      t('review.editor.emptyBullet'),
                    ],
                  }))
                }
              >
                {t('review.editor.addBullet')}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onPress={() => moveSection(sectionIndex, -1)}
                disabled={sectionIndex === 0}
              >
                {t('review.editor.moveSectionUp')}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onPress={() => moveSection(sectionIndex, 1)}
                disabled={sectionIndex === document.sections.length - 1}
              >
                {t('review.editor.moveSectionDown')}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onPress={() =>
                  updateDocument({
                    sections: document.sections.filter(
                      (_, index) => index !== sectionIndex,
                    ),
                  })
                }
              >
                {t('review.editor.removeSection')}
              </Button>
            </View>
          </View>
        ))}
        <Button
          fullWidth
          variant="secondary"
          onPress={() =>
            updateDocument({
              sections: [
                ...document.sections,
                {
                  id: Crypto.randomUUID(),
                  title: t('review.editor.emptySection'),
                  bullets: [t('review.editor.emptyBullet')],
                },
              ],
            })
          }
        >
          {t('review.editor.addSection')}
        </Button>
      </View>
      {saveError ? (
        <Text accessibilityRole="alert" color="danger">
          {t('review.editor.saveError')}
        </Text>
      ) : null}
      {deleteError ? (
        <Text accessibilityRole="alert" color="danger">
          {t('review.editor.deleteError')}
        </Text>
      ) : null}
      <View style={styles.outputs}>
        <Text accessibilityRole="header" variant="subheading">
          {t('review.output.title')}
        </Text>
        <View style={styles.outputActions}>
          {(
            [
              ['copy', 'review.output.copy'],
              ['pdf', 'review.output.pdf'],
              ['markdown', 'review.output.markdown'],
              ['share', 'review.output.share'],
            ] as const
          ).map(([action, label]) => (
            <Button
              key={action}
              size="sm"
              style={styles.outputButton}
              variant="secondary"
              disabled={outputAction !== null}
              loading={outputAction === action}
              onPress={() => confirmOutput(action)}
            >
              {t(label)}
            </Button>
          ))}
        </View>
        {outputError ? (
          <Text accessibilityRole="alert" color="danger">
            {t('review.output.error')}
          </Text>
        ) : null}
      </View>
      <Button
        fullWidth
        loading={isSubmitting}
        onPress={() => {
          setSaveError(false);
          void form.handleSubmit();
        }}
      >
        {t('review.editor.save')}
      </Button>
      <Button fullWidth variant="secondary" onPress={onCreateUpdatedCopy}>
        {t('review.editor.createUpdatedCopy')}
      </Button>
      <Button
        fullWidth
        variant="destructive"
        loading={isDeleting}
        onPress={() =>
          Alert.alert(
            t('review.editor.deleteTitle'),
            t('review.editor.deleteDescription'),
            [
              { text: t('review.editor.deleteCancel'), style: 'cancel' },
              {
                text: t('review.editor.deleteConfirm'),
                style: 'destructive',
                onPress: () => void deleteDraft(),
              },
            ],
          )
        }
      >
        {t('review.editor.delete')}
      </Button>
    </View>
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
  editor: { gap: spacing[5] },
  heading: { gap: spacing[2] },
  fieldGroup: { gap: spacing[2] },
  sections: { gap: spacing[3] },
  outputs: { gap: spacing[3] },
  outputActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  outputButton: { flexBasis: 140, flexGrow: 1 },
  section: {
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing[3],
    padding: spacing[3],
  },
  bulletRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing[2],
  },
  textInput: {
    borderRadius: radii.md,
    borderWidth: 1,
    minHeight: 52,
    padding: spacing[3],
  },
  bulletInput: { flex: 1, minHeight: 72, textAlignVertical: 'top' },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    minWidth: 48,
  },
  sectionActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
});
