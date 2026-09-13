import * as Clipboard from 'expo-clipboard';
import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform, Share } from 'react-native';

export type ReviewOutputDocument = {
  html: string;
  markdown: string;
  plainText: string;
};

export type ReviewOutputAdapter = {
  copyFormatted(document: ReviewOutputDocument): Promise<void>;
  shareMarkdown(document: ReviewOutputDocument): Promise<void>;
  sharePdf(document: ReviewOutputDocument): Promise<void>;
  sharePlainText(document: ReviewOutputDocument): Promise<void>;
};

export const reviewOutput: ReviewOutputAdapter = {
  async copyFormatted({ html, plainText }) {
    if (Platform.OS === 'android') {
      await Clipboard.setStringAsync(html, {
        inputFormat: Clipboard.StringFormat.HTML,
      });
      return;
    }
    await Clipboard.setStringAsync(plainText);
  },

  async shareMarkdown({ markdown }) {
    const uri = createTemporaryOutputUri('md');
    try {
      await FileSystem.writeAsStringAsync(uri, markdown, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      await shareTemporaryFile(uri, 'text/markdown');
    } finally {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    }
  },

  async sharePdf({ html }) {
    const printed = await Print.printToFileAsync({ html });
    let uri: string | null = null;
    try {
      uri = createTemporaryOutputUri('pdf');
      await FileSystem.copyAsync({ from: printed.uri, to: uri });
      await shareTemporaryFile(uri, 'application/pdf');
    } finally {
      if (uri) {
        await FileSystem.deleteAsync(uri, { idempotent: true });
      }
      await FileSystem.deleteAsync(printed.uri, { idempotent: true });
    }
  },

  async sharePlainText({ plainText }) {
    await Share.share({ message: plainText });
  },
};

export function createReviewOutputFilename(
  extension: 'md' | 'pdf',
  now = new Date(),
): string {
  const date = now.toISOString().slice(0, 10);
  return `kerjalog-review-${date}.${extension}`;
}

function createTemporaryOutputUri(extension: 'md' | 'pdf'): string {
  if (!FileSystem.cacheDirectory) {
    throw new Error('Temporary review output storage is unavailable.');
  }
  const filename = createReviewOutputFilename(extension);
  const suffix = Crypto.randomUUID();
  return `${FileSystem.cacheDirectory}${filename.replace(
    `.${extension}`,
    `-${suffix}.${extension}`,
  )}`;
}

async function shareTemporaryFile(
  uri: string,
  mimeType: string,
): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Native file sharing is unavailable.');
  }
  await Sharing.shareAsync(uri, { mimeType });
}
