import { useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Button } from '@/design-system/components/Button';
import { Text } from '@/design-system/components/Text';
import { spacing } from '@/design-system/tokens/theme';
import {
  renderReviewDocumentHtml,
  renderReviewDocumentMarkdown,
  renderReviewDocumentPlainText,
} from '@/domain/review/document';
import type { ReviewDraftDocument } from '@/domain/review/model';
import { useI18n } from '@/i18n/I18nProvider';
import { reviewOutput } from '@/platform/review-output/reviewOutput';

type ReviewOutputAction =
  | 'copyPlainText'
  | 'copyFormatted'
  | 'pdf'
  | 'markdown'
  | 'share';

type ReviewDraftOutputActionsProps = {
  disabled: boolean;
  document: ReviewDraftDocument;
  title: string;
};

const outputButtons = [
  ['copyPlainText', 'review.output.copyText'],
  ['copyFormatted', 'review.output.copyFormatted'],
  ['pdf', 'review.output.pdf'],
  ['markdown', 'review.output.markdown'],
  ['share', 'review.output.share'],
] as const satisfies ReadonlyArray<readonly [ReviewOutputAction, string]>;

export function ReviewDraftOutputActions({
  disabled,
  document,
  title,
}: Readonly<ReviewDraftOutputActionsProps>) {
  const { t } = useI18n();
  const [outputAction, setOutputAction] = useState<ReviewOutputAction | null>(
    null,
  );
  const [outputError, setOutputError] = useState(false);
  // Prevents duplicate native shares/copies before React can disable the control.
  const outputInFlightRef = useRef(false);

  const runOutput = async (action: ReviewOutputAction) => {
    if (outputInFlightRef.current) {
      return;
    }

    outputInFlightRef.current = true;
    setOutputAction(action);
    setOutputError(false);
    const output = {
      html: renderReviewDocumentHtml(title, document),
      markdown: renderReviewDocumentMarkdown(title, document),
      plainText: renderReviewDocumentPlainText(title, document),
    };
    try {
      switch (action) {
        case 'copyPlainText':
          await reviewOutput.copyPlainText(output);
          break;
        case 'copyFormatted':
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
      outputInFlightRef.current = false;
      setOutputAction(null);
    }
  };
  const confirmOutput = (action: ReviewOutputAction) => {
    if (disabled || outputInFlightRef.current) {
      return;
    }

    Alert.alert(
      t('review.output.confirmTitle'),
      t('review.output.confirmDescription'),
      [
        { text: t('review.output.confirmCancel'), style: 'cancel' },
        {
          text: t('review.output.confirmAction'),
          onPress: () => void runOutput(action),
        },
      ],
    );
  };

  return (
    <View style={styles.outputs}>
      <Text accessibilityRole="header" variant="subheading">
        {t('review.output.title')}
      </Text>
      <View style={styles.actions}>
        {outputButtons.map(([action, label]) => (
          <Button
            key={action}
            disabled={disabled || outputAction !== null}
            loading={outputAction === action}
            size="sm"
            style={styles.action}
            variant="secondary"
            onPress={() => confirmOutput(action)}
          >
            {t(label)}
          </Button>
        ))}
      </View>
      {outputError ? (
        <Text
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
          color="danger"
        >
          {t('review.output.error')}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  outputs: { gap: spacing[3] },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  action: { flexBasis: 140, flexGrow: 1 },
});
