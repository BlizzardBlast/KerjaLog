import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { reviewRepository } from '@/data/repositories/reviewRepository';
import { ThemeProvider } from '@/design-system/theme/ThemeProvider';
import type { ReviewCandidate, ReviewDraft } from '@/domain/review/model';
import { ReviewSetupForm } from '@/features/review/ReviewSetupForm';

jest.mock('@react-native-community/datetimepicker', () => ({
  __esModule: true,
  default: () => null,
  DateTimePickerAndroid: { open: jest.fn() },
}));

jest.mock('expo-router', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    useFocusEffect: (effect: import('react').EffectCallback) => {
      React.useEffect(effect, [effect]);
    },
  };
});

jest.mock('@/data/repositories/reviewRepository', () => ({
  reviewRepository: {
    createDraft: jest.fn(),
    findCandidates: jest.fn(),
    findDraft: jest.fn(),
  },
}));

jest.mock('@/i18n/I18nProvider', () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, string | number>) =>
      params?.purpose ?? params?.title ?? params?.count?.toString() ?? key,
  }),
}));

const repository = jest.mocked(reviewRepository);

const candidates: ReviewCandidate[] = [
  {
    id: 'entry-a',
    title: 'Simplified handoff',
    impactStatement: 'Simplified the handoff.',
    rawNote: 'Updated a handoff.',
    occurredAt: '2026-09-02T08:00:00.000Z',
    outcomeType: 'work_clearer',
    evidence: { types: ['result'], detail: 'Team adopted the checklist.' },
    skillIds: ['communication'],
  },
];

const createdDraft: ReviewDraft = {
  id: 'review-1',
  title: 'Performance self-review draft',
  purpose: 'performance_self_review',
  period: { startDate: '2026-09-01', endDate: '2026-09-30' },
  document: { sections: [] },
  entries: [],
  createdAt: '2026-09-03T08:00:00.000Z',
  updatedAt: '2026-09-03T08:00:00.000Z',
};

describe('ReviewSetupForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    repository.findCandidates.mockResolvedValue(candidates);
    repository.createDraft.mockResolvedValue(createdDraft);
  });

  test('uses the canonical form selection to create a factual review draft', async () => {
    const onCreated = jest.fn();
    await render(
      <ThemeProvider>
        <ReviewSetupForm
          skillId={undefined}
          copyFromDraftId={undefined}
          onCancel={jest.fn()}
          onCreated={onCreated}
        />
      </ThemeProvider>,
    );

    const candidate = await screen.findByRole('checkbox', {
      name: 'Simplified handoff',
    });
    await waitFor(() => {
      expect(candidate.props.accessibilityState).toEqual({ checked: true });
    });

    await act(async () => {
      fireEvent.press(
        screen.getByRole('button', { name: 'review.setup.create' }),
      );
    });

    await waitFor(() =>
      expect(repository.createDraft).toHaveBeenCalledTimes(1),
    );
    expect(repository.createDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        purpose: 'performance_self_review',
        entries: [expect.objectContaining({ sourceEntryId: 'entry-a' })],
      }),
    );
    expect(onCreated).toHaveBeenCalledWith(createdDraft);
  });

  test('uses a Growth skill handoff only to filter candidates, never to select them', async () => {
    await render(
      <ThemeProvider>
        <ReviewSetupForm
          skillId="communication"
          copyFromDraftId={undefined}
          onCancel={jest.fn()}
          onCreated={jest.fn()}
        />
      </ThemeProvider>,
    );

    const candidate = await screen.findByRole('checkbox', {
      name: 'Simplified handoff',
    });
    expect(repository.findCandidates).toHaveBeenCalledWith(
      expect.objectContaining({ skillId: 'communication' }),
    );
    expect(candidate.props.accessibilityState).toEqual({ checked: false });
  });
});
