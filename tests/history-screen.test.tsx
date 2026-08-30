import { fireEvent, render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@/design-system/theme/ThemeProvider';
import { EMPTY_WORK_ENTRY_HISTORY_FILTERS } from '@/domain/entry/history';
import type { WorkEntry } from '@/domain/entry/model';
import { HistoryScreen } from '@/features/history/HistoryScreen';
import type { HistoryEntriesController } from '@/features/history/useHistoryEntries';

const mockUseHistoryEntries = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('expo-symbols', () => ({
  SymbolView: () => null,
}));

jest.mock('react-native-safe-area-context', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View } =
    jest.requireActual<typeof import('react-native')>('react-native');

  return {
    SafeAreaView: ({
      children,
      ...props
    }: {
      children: React.ReactNode;
      [key: string]: unknown;
    }) => React.createElement(View, props, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock('@/features/history/useHistoryEntries', () => ({
  useHistoryEntries: () => mockUseHistoryEntries(),
}));

jest.mock('@/features/work-area/useWorkAreas', () => ({
  useWorkAreas: () => ({
    state: { status: 'loaded', workAreas: [] },
    reload: jest.fn(),
  }),
}));

jest.mock('@/i18n/I18nProvider', () => ({
  useI18n: () => ({
    language: 'en',
    t: (key: string) => key,
  }),
}));

const entry: WorkEntry = {
  id: 'entry-1',
  type: 'problem_solved',
  title: 'Resolved reconciliation discrepancies',
  rawNote: 'Found duplicate reconciliation records.',
  impactStatement: 'Removed duplicate records before submission.',
  occurredAt: '2026-08-06T08:00:00.000Z',
  outcomeType: 'error_fixed_or_prevented',
  status: 'review_ready',
  workAreaId: null,
  evidence: null,
  excludedFromExports: false,
  createdAt: '2026-08-06T08:01:00.000Z',
  updatedAt: '2026-08-06T08:01:00.000Z',
};

function createController(
  overrides: Partial<HistoryEntriesController> = {},
): HistoryEntriesController {
  return {
    searchText: '',
    isSearchPending: false,
    setSearchText: jest.fn(),
    filters: EMPTY_WORK_ENTRY_HISTORY_FILTERS,
    setEntryType: jest.fn(),
    setWorkArea: jest.fn(),
    toggleEvidence: jest.fn(),
    toggleReviewReady: jest.fn(),
    clearFilters: jest.fn(),
    retry: jest.fn(),
    loadMore: jest.fn(),
    retryLoadMore: jest.fn(),
    state: {
      status: 'loaded',
      entries: [entry],
      hasMore: true,
      isLoadingMore: false,
      loadMoreError: false,
    },
    ...overrides,
  };
}

describe('HistoryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('routes the pagination error footer through the explicit retry action', async () => {
    const retryLoadMore = jest.fn();
    mockUseHistoryEntries.mockReturnValue(
      createController({
        retryLoadMore,
        state: {
          status: 'loaded',
          entries: [entry],
          hasMore: true,
          isLoadingMore: false,
          loadMoreError: true,
        },
      }),
    );

    await render(
      <ThemeProvider>
        <HistoryScreen />
      </ThemeProvider>,
    );

    expect(screen.getByText('history.loadMoreError')).toBeTruthy();
    await fireEvent.press(
      screen.getByRole('button', { name: 'history.loadMoreRetry' }),
    );

    expect(retryLoadMore).toHaveBeenCalledTimes(1);
  });

  test('exposes History headings with header semantics', async () => {
    mockUseHistoryEntries.mockReturnValue(createController());

    await render(
      <ThemeProvider>
        <HistoryScreen />
      </ThemeProvider>,
    );

    expect(screen.getByRole('header', { name: 'history.title' })).toBeTruthy();
    expect(screen.getAllByRole('header')).toHaveLength(2);
  });

  test('shows an accessible progress state instead of stale no-match content while search is pending', async () => {
    mockUseHistoryEntries.mockReturnValue(
      createController({
        searchText: 'finance',
        isSearchPending: true,
        state: {
          status: 'loaded',
          entries: [],
          hasMore: false,
          isLoadingMore: false,
          loadMoreError: false,
        },
      }),
    );

    await render(
      <ThemeProvider>
        <HistoryScreen />
      </ThemeProvider>,
    );

    expect(
      screen.getByRole('progressbar', { name: 'history.updating' }),
    ).toBeTruthy();
    expect(screen.queryByText('history.noMatches.title')).toBeNull();
  });
});
