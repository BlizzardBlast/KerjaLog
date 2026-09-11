import AsyncStorage from '@react-native-async-storage/async-storage';
import { render, screen, waitFor } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { ThemeProvider } from '@/design-system/theme/ThemeProvider';
import type { WorkArea } from '@/domain/work-area/model';
import type { WorkEntryDetail } from '@/domain/entry/model';
import { SavedEntryScreen } from '@/features/work-entry/SavedEntryScreen';

const mockUseWorkEntry = jest.fn();
const mockUseWorkAreas = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
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
  };
});

jest.mock('@/features/work-entry/useWorkEntry', () => ({
  useWorkEntry: (...args: unknown[]) => mockUseWorkEntry(...args),
}));

jest.mock('@/features/work-area/useWorkAreas', () => ({
  useWorkAreas: (...args: unknown[]) => mockUseWorkAreas(...args),
}));

jest.mock('@/i18n/I18nProvider', () => ({
  useI18n: () => ({
    t: (key: string, values?: { name?: string }) =>
      values?.name ? `${key}: ${values.name}` : key,
  }),
}));

const workArea: WorkArea = {
  id: 'area-finance',
  name: 'Finance Reporting',
  archivedAt: '2026-08-31T01:00:00.000Z',
  createdAt: '2026-08-30T01:00:00.000Z',
  updatedAt: '2026-08-31T01:00:00.000Z',
};

const entry: WorkEntryDetail = {
  id: 'entry-1',
  type: 'problem_solved',
  title: 'Fixed reconciliation records',
  rawNote: 'Fixed duplicate reconciliation records.',
  impactStatement: 'Prevented an incorrect report.',
  impactStatementSource: 'user',
  occurredAt: '2026-08-30T01:00:00.000Z',
  outcomeType: 'error_fixed_or_prevented',
  status: 'review_ready',
  workAreaId: workArea.id,
  evidence: null,
  skills: [],
  excludedFromExports: false,
  createdAt: '2026-08-30T01:00:00.000Z',
  updatedAt: '2026-08-30T01:00:00.000Z',
};

describe('SavedEntryScreen work area metadata', () => {
  beforeEach(() => {
    mockUseWorkEntry.mockReturnValue({
      state: { status: 'loaded', entry },
      retry: jest.fn(),
    });
    mockUseWorkAreas.mockReturnValue({
      state: { status: 'loaded', workAreas: [workArea] },
      reload: jest.fn(),
    });
  });

  afterEach(async () => {
    await AsyncStorage.removeItem('@kerjalog/theme-mode/v1');
  });

  test('uses emphasized saved-entry styling while preserving archived metadata', async () => {
    await render(
      <ThemeProvider>
        <SavedEntryScreen id={entry.id} />
      </ThemeProvider>,
    );

    expect(
      screen.getByText('workArea.archivedName: Finance Reporting'),
    ).toBeTruthy();
    const style = StyleSheet.flatten(
      screen.getByText('workArea.savedLabel').parent?.props.style,
    );

    expect(style).toEqual(
      expect.objectContaining({
        backgroundColor: '#EEE7FF',
        borderColor: '#7138F2',
      }),
    );
  });

  test('uses primary-soft metadata styling in dark theme', async () => {
    await AsyncStorage.setItem('@kerjalog/theme-mode/v1', 'dark');

    await render(
      <ThemeProvider>
        <SavedEntryScreen id={entry.id} />
      </ThemeProvider>,
    );

    await waitFor(() => {
      const style = StyleSheet.flatten(
        screen.getByText('workArea.savedLabel').parent?.props.style,
      );

      expect(style).toEqual(
        expect.objectContaining({
          backgroundColor: '#39265E',
          borderColor: '#A78BFA',
        }),
      );
    });
  });
});
