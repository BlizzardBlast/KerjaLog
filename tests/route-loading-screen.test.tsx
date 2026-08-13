import { render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@/design-system/theme/ThemeProvider';
import { RouteLoadingScreen } from '@/shared/components/RouteLoadingScreen';

describe('RouteLoadingScreen', () => {
  test('announces an indeterminate busy state', async () => {
    await render(
      <ThemeProvider>
        <RouteLoadingScreen label="Opening KerjaLog" />
      </ThemeProvider>,
    );

    const progress = screen.getByRole('progressbar', {
      name: 'Opening KerjaLog',
    });

    expect(progress.props.accessibilityState).toEqual({ busy: true });
  });
});
