import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { Alert } from 'react-native';
import { ThemeProvider } from '@/design-system/theme/ThemeProvider';
import { reviewRepository } from '@/data/repositories/reviewRepository';
import type { ReviewDraft } from '@/domain/review/model';
import { ReviewDraftScreen } from '@/features/review/ReviewDraftScreen';

const mockRouter = { push: jest.fn(), replace: jest.fn() };

jest.mock('@sentry/react-native', () => ({
  wrapExpoRouter: (value: unknown) => value,
  withProfiler: <T,>(component: T) => component,
}));

jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0, left: 0, right: 0, top: 0 }),
}));

jest.mock('@/data/repositories/reviewRepository', () => ({
  reviewRepository: {
    deleteDraft: jest.fn(),
    findDraft: jest.fn(),
    updateDraft: jest.fn(),
  },
}));

jest.mock('@/platform/review-output/reviewOutput', () => ({
  reviewOutput: {
    copyFormatted: jest.fn(),
    copyPlainText: jest.fn(),
    shareMarkdown: jest.fn(),
    sharePdf: jest.fn(),
    sharePlainText: jest.fn(),
  },
}));

jest.mock('@/i18n/I18nProvider', () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, string | number>) =>
      params?.number === undefined ? key : `${key}:${params.number}`,
  }),
}));

const repository = jest.mocked(reviewRepository);

const draft: ReviewDraft = {
  id: 'review-1',
  title: 'September review',
  purpose: 'performance_self_review',
  period: { startDate: '2026-09-01', endDate: '2026-09-30' },
  document: {
    sections: [
      {
        id: 'highlights',
        title: 'Highlights',
        bullets: ['Simplified handoff.'],
      },
    ],
  },
  entries: [],
  createdAt: '2026-09-03T08:00:00.000Z',
  updatedAt: '2026-09-03T08:00:00.000Z',
};

describe('ReviewDraftScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    repository.findDraft.mockResolvedValue(draft);
    repository.updateDraft.mockResolvedValue(draft);
    repository.deleteDraft.mockResolvedValue();
  });

  test('edits the document through the canonical form and deletes only after confirmation', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    await render(
      <ThemeProvider>
        <ReviewDraftScreen id="review-1" />
      </ThemeProvider>,
    );

    const name = await screen.findByLabelText('review.editor.titleLabel');
    fireEvent.changeText(name, 'Renamed review');
    await waitFor(() => expect(name.props.value).toBe('Renamed review'));
    await act(async () => {
      fireEvent.press(
        screen.getByRole('button', { name: 'review.editor.save' }),
      );
    });

    await waitFor(() =>
      expect(repository.updateDraft).toHaveBeenCalledWith(
        'review-1',
        expect.objectContaining({ title: 'Renamed review' }),
      ),
    );

    fireEvent.press(
      screen.getByRole('button', { name: 'review.editor.delete' }),
    );
    expect(alert).toHaveBeenCalledWith(
      'review.editor.deleteTitle',
      'review.editor.deleteDescription',
      expect.any(Array),
    );
    const buttons = alert.mock.calls[0]?.[2];
    const confirm = buttons?.find((button) => button.style === 'destructive');
    confirm?.onPress?.();

    await waitFor(() =>
      expect(repository.deleteDraft).toHaveBeenCalledWith('review-1'),
    );
    expect(mockRouter.replace).toHaveBeenCalledWith('/review');
  });

  test('requires a confidentiality confirmation before output', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    await render(
      <ThemeProvider>
        <ReviewDraftScreen id="review-1" />
      </ThemeProvider>,
    );

    await screen.findByRole('button', { name: 'review.output.copyFormatted' });
    fireEvent.press(
      screen.getByRole('button', { name: 'review.output.copyFormatted' }),
    );

    expect(alert).toHaveBeenCalledWith(
      'review.output.confirmTitle',
      'review.output.confirmDescription',
      expect.any(Array),
    );
  });

  test('resets editor form values when navigation changes the draft id', async () => {
    const nextDraft: ReviewDraft = {
      ...draft,
      id: 'review-2',
      title: 'October review',
      document: {
        sections: [
          {
            id: 'next-highlights',
            title: 'October highlights',
            bullets: ['Closed a reporting gap.'],
          },
        ],
      },
    };
    const view = await render(
      <ThemeProvider>
        <ReviewDraftScreen id="review-1" />
      </ThemeProvider>,
    );

    const firstName = await screen.findByLabelText('review.editor.titleLabel');
    expect(firstName.props.value).toBe('September review');
    repository.findDraft.mockResolvedValue(nextDraft);

    await act(async () => {
      view.rerender(
        <ThemeProvider>
          <ReviewDraftScreen id="review-2" />
        </ThemeProvider>,
      );
    });

    await waitFor(() =>
      expect(
        screen.getByLabelText('review.editor.titleLabel').props.value,
      ).toBe('October review'),
    );
    await act(async () => {
      fireEvent.press(
        screen.getByRole('button', { name: 'review.editor.save' }),
      );
    });

    await waitFor(() =>
      expect(repository.updateDraft).toHaveBeenLastCalledWith(
        'review-2',
        expect.objectContaining({ title: 'October review' }),
      ),
    );
  });
});
