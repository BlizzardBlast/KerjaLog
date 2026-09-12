import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { Alert, StyleSheet } from 'react-native';
import { ThemeProvider } from '@/design-system/theme/ThemeProvider';
import type { WorkArea } from '@/domain/work-area/model';
import { WorkAreaManagementScreen } from '@/features/work-area/WorkAreaManagementScreen';

const mockUseWorkAreas = jest.fn();
const mockUseWorkAreaMutations = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack }),
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

jest.mock('@/features/work-area/useWorkAreas', () => ({
  useWorkAreas: (...args: unknown[]) => mockUseWorkAreas(...args),
}));

jest.mock('@/features/work-area/useWorkAreaMutations', () => ({
  useWorkAreaMutations: (...args: unknown[]) =>
    mockUseWorkAreaMutations(...args),
}));

jest.mock('@/i18n/I18nProvider', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

const activeWorkArea: WorkArea = {
  id: 'area-reporting',
  name: 'Monthly Reporting',
  archivedAt: null,
  createdAt: '2026-08-30T01:00:00.000Z',
  updatedAt: '2026-08-30T01:00:00.000Z',
};

describe('WorkAreaManagementScreen', () => {
  const alertSpy = jest.spyOn(Alert, 'alert');

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWorkAreas.mockReturnValue({
      state: { status: 'loaded', workAreas: [activeWorkArea] },
      reload: jest.fn(),
    });
    mockUseWorkAreaMutations.mockReturnValue({
      create: jest.fn(),
      rename: jest.fn(),
      archive: jest.fn(),
    });
  });

  test('uses destructive visual treatment for the archive action', async () => {
    await render(
      <ThemeProvider>
        <WorkAreaManagementScreen />
      </ThemeProvider>,
    );

    const archiveButton = screen.getByRole('button', {
      name: 'workArea.archive.action',
    });
    const style = StyleSheet.flatten(archiveButton.props.style);

    expect(style.backgroundColor).toBe('#B42318');
  });

  test('requires destructive confirmation before archiving', async () => {
    await render(
      <ThemeProvider>
        <WorkAreaManagementScreen />
      </ThemeProvider>,
    );

    await fireEvent.press(
      screen.getByRole('button', { name: 'workArea.archive.action' }),
    );

    expect(alertSpy).toHaveBeenCalledWith(
      'workArea.archive.title',
      'workArea.archive.description',
      expect.arrayContaining([
        expect.objectContaining({ style: 'cancel' }),
        expect.objectContaining({ style: 'destructive' }),
      ]),
    );
  });

  test('enters rename mode for an active work area', async () => {
    await render(
      <ThemeProvider>
        <WorkAreaManagementScreen />
      </ThemeProvider>,
    );

    await fireEvent.press(
      screen.getByRole('button', { name: 'workArea.renameAction' }),
    );

    expect(screen.getByDisplayValue('Monthly Reporting')).toBeTruthy();
    expect(screen.getByText('workArea.renameTitle')).toBeTruthy();
  });

  test('submits the latest native text-input value when Done follows typing immediately', async () => {
    const create = jest.fn().mockResolvedValue({
      id: 'area-finance',
      name: 'Finance Reporting',
    });
    mockUseWorkAreaMutations.mockReturnValue({
      create,
      rename: jest.fn(),
      archive: jest.fn(),
    });

    await render(
      <ThemeProvider>
        <WorkAreaManagementScreen />
      </ThemeProvider>,
    );

    const nameField = screen.getByLabelText('workArea.nameLabel');
    await act(async () => {
      nameField.props.onChangeText('Finance Reporting');
      nameField.props.onSubmitEditing({});
    });

    await waitFor(() => {
      expect(create).toHaveBeenCalledWith('Finance Reporting');
    });
  });
});
