import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { Text } from '@/design-system/components/Text';
import { ThemeProvider } from '@/design-system/theme/ThemeProvider';
import type { WorkArea } from '@/domain/work-area/model';
import { WorkAreaEditorCard } from '@/features/work-area/components/WorkAreaEditorCard';
import { WorkAreaSection } from '@/features/work-area/components/WorkAreaSection';

jest.mock('@/i18n/I18nProvider', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

const longName =
  'International customer reconciliation and reporting responsibilities';

const workArea: WorkArea = {
  id: 'area-reporting',
  name: longName,
  archivedAt: null,
  createdAt: '2026-08-30T01:00:00.000Z',
  updatedAt: '2026-08-30T01:00:00.000Z',
};

describe('Work Area components', () => {
  afterEach(async () => {
    await AsyncStorage.removeItem('@kerjalog/theme-mode/v1');
  });

  test('uses the standard surface treatment for its editor card', async () => {
    await render(
      <ThemeProvider>
        <WorkAreaEditorCard
          busy={false}
          editing={false}
          hasMutationError={false}
          initialName=""
          onCancel={jest.fn()}
          onNameChange={jest.fn()}
          onSubmitName={jest.fn()}
        />
      </ThemeProvider>,
    );

    const editorCard = screen.getByText('workArea.createTitle').parent;
    const style = StyleSheet.flatten(editorCard?.props.style);

    expect(style.backgroundColor).toBe('#FFFDFC');
  });

  test('uses the standard dark surface treatment for its editor card', async () => {
    await AsyncStorage.setItem('@kerjalog/theme-mode/v1', 'dark');

    await render(
      <ThemeProvider>
        <WorkAreaEditorCard
          busy={false}
          editing={false}
          hasMutationError={false}
          initialName=""
          onCancel={jest.fn()}
          onNameChange={jest.fn()}
          onSubmitName={jest.fn()}
        />
      </ThemeProvider>,
    );

    const editorCard = screen.getByText('workArea.createTitle').parent;

    await waitFor(() => {
      const style = StyleSheet.flatten(editorCard?.props.style);

      expect(style.backgroundColor).toBe('#211C25');
    });
  });

  test('reserves a readable line for long work area names before wrapping actions', async () => {
    await render(
      <ThemeProvider>
        <WorkAreaSection
          emptyText=""
          renderActions={() => <Text>Actions</Text>}
          title="Active"
          workAreas={[workArea]}
        />
      </ThemeProvider>,
    );

    const name = screen.getByText(longName);
    const style = StyleSheet.flatten(name.props.style);

    expect(style).toEqual(
      expect.objectContaining({
        flexBasis: 120,
        flexGrow: 1,
        flexShrink: 1,
        minWidth: 120,
      }),
    );
  });

  test('derives editor CTA state and accessible validation from the canonical form value', async () => {
    await render(
      <ThemeProvider>
        <WorkAreaEditorCard
          busy={false}
          editing={false}
          hasMutationError={false}
          initialName=""
          onCancel={jest.fn()}
          onNameChange={jest.fn()}
          onSubmitName={jest.fn()}
        />
      </ThemeProvider>,
    );

    const createButton = screen.getByRole('button', {
      name: 'workArea.createAction',
    });
    const nameField = screen.getByLabelText('workArea.nameLabel');

    expect(createButton.props.accessibilityState).toMatchObject({
      disabled: true,
    });

    await fireEvent.changeText(nameField, 'Finance Reporting');
    await waitFor(() => {
      expect(createButton.props.accessibilityState).toMatchObject({
        disabled: false,
      });
    });

    await fireEvent.changeText(nameField, '   ');
    await fireEvent(nameField, 'blur');

    expect(screen.getByRole('alert')).toHaveTextContent(
      'workArea.nameRequired',
    );
    expect(createButton.props.accessibilityState).toMatchObject({
      disabled: true,
    });
  });
});
