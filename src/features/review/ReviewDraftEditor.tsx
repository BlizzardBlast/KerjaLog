import { useForm, useSelector } from '@tanstack/react-form';
import { Alert, StyleSheet, View } from 'react-native';
import { useRef, useState } from 'react';
import { Button } from '@/design-system/components/Button';
import { Text } from '@/design-system/components/Text';
import { TextField } from '@/design-system/components/TextField';
import { reviewRepository } from '@/data/repositories/reviewRepository';
import {
  getReviewDraftDocumentValidationIssue,
  type ReviewDraftDocumentValidationIssue,
} from '@/domain/review/documentValidation';
import type { ReviewDraft, ReviewDraftDocument } from '@/domain/review/model';
import { ReviewDraftDocumentEditor } from '@/features/review/ReviewDraftDocumentEditor';
import { ReviewDraftOutputActions } from '@/features/review/ReviewDraftOutputActions';
import { radii, spacing } from '@/design-system/tokens/theme';
import { useI18n } from '@/i18n/I18nProvider';

type EditorValues = { title: string; document: ReviewDraftDocument };

type ReviewDraftEditorProps = {
  draft: ReviewDraft;
  onDeleted: () => void;
  onCreateUpdatedCopy: () => void;
};

export function ReviewDraftEditor({
  draft,
  onDeleted,
  onCreateUpdatedCopy,
}: Readonly<ReviewDraftEditorProps>) {
  const { t } = useI18n();
  const [saveError, setSaveError] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  // Both refs close same-tick confirmation callbacks before state rerenders.
  const saveInFlightRef = useRef(false);
  const deleteInFlightRef = useRef(false);
  const form = useForm({
    defaultValues: {
      title: draft.title,
      document: draft.document,
    } satisfies EditorValues,
    onSubmit: async ({ value }) => {
      if (saveInFlightRef.current) {
        return;
      }

      saveInFlightRef.current = true;
      try {
        await reviewRepository.updateDraft(draft.id, value);
      } catch {
        setSaveError(true);
      } finally {
        saveInFlightRef.current = false;
      }
    },
  });
  const title = useSelector(form.store, (state) => state.values.title);
  const document = useSelector(form.store, (state) => state.values.document);
  const isSubmitting = useSelector(form.store, (state) => state.isSubmitting);
  const documentValidationIssue =
    getReviewDraftDocumentValidationIssue(document);
  const titleIsInvalid = !title.trim();
  const validationMessage = getValidationMessage(
    titleIsInvalid,
    documentValidationIssue,
    t,
  );

  const updateDocument = (nextDocument: ReviewDraftDocument) => {
    form.setFieldValue('document', nextDocument);
    setSaveError(false);
  };
  const deleteDraft = async () => {
    if (deleteInFlightRef.current) {
      return;
    }

    deleteInFlightRef.current = true;
    setIsDeleting(true);
    setDeleteError(false);
    try {
      await reviewRepository.deleteDraft(draft.id);
      onDeleted();
    } catch {
      deleteInFlightRef.current = false;
      setDeleteError(true);
      setIsDeleting(false);
    }
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
          hasError={titleIsInvalid}
          value={title}
          onChangeText={(value) => {
            form.setFieldValue('title', value);
            setSaveError(false);
          }}
          style={styles.textInput}
        />
      </View>
      <ReviewDraftDocumentEditor
        document={document}
        onChange={updateDocument}
      />
      {validationMessage ? (
        <Text
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
          color="danger"
          variant="caption"
        >
          {validationMessage}
        </Text>
      ) : null}
      {saveError ? (
        <Text
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
          color="danger"
        >
          {t('review.editor.saveError')}
        </Text>
      ) : null}
      {deleteError ? (
        <Text
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
          color="danger"
        >
          {t('review.editor.deleteError')}
        </Text>
      ) : null}
      <ReviewDraftOutputActions
        disabled={isDeleting || validationMessage !== null}
        document={document}
        title={title}
      />
      <Button
        disabled={validationMessage !== null || isDeleting}
        fullWidth
        loading={isSubmitting}
        onPress={() => {
          setSaveError(false);
          void form.handleSubmit();
        }}
      >
        {t('review.editor.save')}
      </Button>
      <Button
        disabled={isDeleting}
        fullWidth
        variant="secondary"
        onPress={onCreateUpdatedCopy}
      >
        {t('review.editor.createUpdatedCopy')}
      </Button>
      <Button
        fullWidth
        loading={isDeleting}
        variant="destructive"
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

function getValidationMessage(
  titleIsInvalid: boolean,
  documentValidationIssue: ReviewDraftDocumentValidationIssue | null,
  t: (key: Parameters<ReturnType<typeof useI18n>['t']>[0]) => string,
): string | null {
  if (titleIsInvalid) {
    return t('review.editor.titleRequired');
  }
  switch (documentValidationIssue) {
    case 'section':
      return t('review.editor.sectionTitleRequired');
    case 'bullet':
      return t('review.editor.bulletRequired');
    case 'document':
      return t('review.editor.saveError');
    case null:
      return null;
  }
}

const styles = StyleSheet.create({
  editor: { gap: spacing[5] },
  heading: { gap: spacing[2] },
  fieldGroup: { gap: spacing[2] },
  textInput: {
    borderRadius: radii.md,
    borderWidth: 1,
    minHeight: 52,
    padding: spacing[3],
  },
});
