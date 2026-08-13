import { fireEvent, render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@/design-system/theme/ThemeProvider';
import { themes } from '@/design-system/tokens/theme';
import { TextField } from '@/design-system/components/TextField';

describe('TextField', () => {
  test('uses accessible default, focused, and error borders', async () => {
    const { rerender } = await render(
      <ThemeProvider>
        <TextField accessibilityLabel="Notes" style={{ borderWidth: 1 }} />
      </ThemeProvider>,
    );
    const input = screen.getByLabelText('Notes');

    expect(input).toHaveStyle({
      borderColor: themes.light.colors.controlBorder,
    });

    await fireEvent(input, 'focus');
    expect(input).toHaveStyle({
      borderColor: themes.light.colors.controlBorderFocused,
    });

    await rerender(
      <ThemeProvider>
        <TextField
          accessibilityLabel="Notes"
          hasError
          style={{ borderWidth: 1 }}
        />
      </ThemeProvider>,
    );
    expect(screen.getByLabelText('Notes')).toHaveStyle({
      borderColor: themes.light.colors.danger,
    });
  });
});
