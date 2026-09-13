import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import {
  createReviewOutputFilename,
  reviewOutput,
} from '@/platform/review-output/reviewOutput';

jest.mock('expo-clipboard', () => ({
  StringFormat: { HTML: 'HTML' },
  setStringAsync: jest.fn(),
}));

jest.mock('expo-crypto', () => ({ randomUUID: jest.fn(() => 'output-1') }));

jest.mock('expo-file-system/legacy', () => ({
  cacheDirectory: 'file://cache/',
  EncodingType: { UTF8: 'utf8' },
  copyAsync: jest.fn(),
  deleteAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
}));

jest.mock('expo-print', () => ({ printToFileAsync: jest.fn() }));
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));

const document = {
  html: '<h1>Review</h1>',
  markdown: '# Review',
  plainText: 'Review',
};

describe('review output adapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(Sharing.isAvailableAsync).mockResolvedValue(true);
    jest.mocked(Sharing.shareAsync).mockResolvedValue(undefined);
    jest.mocked(FileSystem.writeAsStringAsync).mockResolvedValue(undefined);
    jest.mocked(FileSystem.copyAsync).mockResolvedValue(undefined);
    jest.mocked(FileSystem.deleteAsync).mockResolvedValue(undefined);
  });

  test('uses a local-only, non-user-content filename', () => {
    expect(
      createReviewOutputFilename('md', new Date('2026-09-12T00:00:00.000Z')),
    ).toBe('kerjalog-review-2026-09-12.md');
  });

  test('copies HTML only on Android and keeps a plain fallback for other native platforms', async () => {
    const originalPlatform = Platform.OS;
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'android',
    });
    await reviewOutput.copyFormatted(document);
    expect(Clipboard.setStringAsync).toHaveBeenCalledWith('<h1>Review</h1>', {
      inputFormat: Clipboard.StringFormat.HTML,
    });

    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
    await reviewOutput.copyFormatted(document);
    expect(Clipboard.setStringAsync).toHaveBeenLastCalledWith('Review');
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: originalPlatform,
    });
  });

  test('shares Markdown through a temporary file and removes it after a completed share', async () => {
    await reviewOutput.shareMarkdown(document);

    expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
      expect.stringMatching(
        /^file:\/\/cache\/kerjalog-review-\d{4}-\d{2}-\d{2}-output-1\.md$/u,
      ),
      '# Review',
      { encoding: 'utf8' },
    );
    expect(Sharing.shareAsync).toHaveBeenCalledWith(expect.any(String), {
      mimeType: 'text/markdown',
    });
    expect(FileSystem.deleteAsync).toHaveBeenCalledWith(expect.any(String), {
      idempotent: true,
    });
  });

  test('cleans temporary Markdown even when sharing is cancelled or fails', async () => {
    jest
      .mocked(Sharing.shareAsync)
      .mockRejectedValueOnce(new Error('cancelled'));

    await expect(reviewOutput.shareMarkdown(document)).rejects.toThrow(
      'cancelled',
    );
    expect(FileSystem.deleteAsync).toHaveBeenCalledWith(expect.any(String), {
      idempotent: true,
    });
  });

  test('cleans a Markdown file even when writing the file fails', async () => {
    jest
      .mocked(FileSystem.writeAsStringAsync)
      .mockRejectedValueOnce(new Error('storage unavailable'));

    await expect(reviewOutput.shareMarkdown(document)).rejects.toThrow(
      'storage unavailable',
    );
    expect(FileSystem.deleteAsync).toHaveBeenCalledWith(expect.any(String), {
      idempotent: true,
    });
  });

  test('copies generated PDFs into a named temporary file and removes both files', async () => {
    jest.mocked(Print.printToFileAsync).mockResolvedValue({
      uri: 'file://cache/print-output.pdf',
      numberOfPages: 1,
    });

    await reviewOutput.sharePdf(document);

    expect(FileSystem.copyAsync).toHaveBeenCalledWith({
      from: 'file://cache/print-output.pdf',
      to: expect.stringMatching(/kerjalog-review-.*\.pdf$/u),
    });
    expect(Sharing.shareAsync).toHaveBeenCalledWith(expect.any(String), {
      mimeType: 'application/pdf',
    });
    expect(FileSystem.deleteAsync).toHaveBeenCalledWith(
      'file://cache/print-output.pdf',
      { idempotent: true },
    );
  });
});
