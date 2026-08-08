import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Button } from '@/design-system/components/Button';
import { DecorativeView } from '@/design-system/components/DecorativeView';
import { OptionCard } from '@/design-system/components/OptionCard';
import { ToggleSwitch } from '@/design-system/components/ToggleSwitch';
import { ThemeProvider } from '@/design-system/theme/ThemeProvider';

function withTheme(children: ReactNode) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

describe('design-system interactions', () => {
  test('Button invokes onPress and exposes enabled accessibility state', async () => {
    const onPress = jest.fn();

    await render(withTheme(<Button onPress={onPress}>Save entry</Button>));

    const button = screen.getByRole('button');

    expect(button.props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: false, busy: false }),
    );

    await fireEvent.press(button);

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('Button blocks presses while disabled', async () => {
    const onPress = jest.fn();

    await render(
      withTheme(
        <Button disabled onPress={onPress}>
          Save entry
        </Button>,
      ),
    );

    const button = screen.getByRole('button');

    expect(button.props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: true, busy: false }),
    );

    await fireEvent.press(button);

    expect(onPress).not.toHaveBeenCalled();
  });

  test('OptionCard exposes radio selection and handles presses', async () => {
    const onPress = jest.fn();

    await render(
      withTheme(
        <OptionCard
          description="Software, data, design, and product work"
          onPress={onPress}
          selected
          title="Technology & Product"
        />,
      ),
    );

    const option = screen.getByRole('radio');

    expect(option.props.accessibilityState).toEqual(
      expect.objectContaining({ checked: true, disabled: false }),
    );

    await fireEvent.press(option);

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('ToggleSwitch exposes switch state and toggles consistently', async () => {
    const onValueChange = jest.fn();

    await render(
      withTheme(
        <ToggleSwitch
          accessibilityLabel="Weekly reminder"
          onValueChange={onValueChange}
          value={false}
        />,
      ),
    );

    const toggle = screen.getByRole('switch');

    expect(toggle.props.accessibilityState).toEqual(
      expect.objectContaining({ checked: false, disabled: false }),
    );

    await fireEvent.press(toggle);

    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  test('ToggleSwitch blocks presses while disabled', async () => {
    const onValueChange = jest.fn();

    await render(
      withTheme(
        <ToggleSwitch
          accessibilityLabel="Weekly reminder"
          disabled
          onValueChange={onValueChange}
          value
        />,
      ),
    );

    const toggle = screen.getByRole('switch');

    expect(toggle.props.accessibilityState).toEqual(
      expect.objectContaining({ checked: true, disabled: true }),
    );

    await fireEvent.press(toggle);

    expect(onValueChange).not.toHaveBeenCalled();
  });

  test('DecorativeView hides descendants on both native platforms', async () => {
    await render(
      <DecorativeView testID="decorative">
        <View />
      </DecorativeView>,
    );

    const decorative = screen.getByTestId('decorative', {
      includeHiddenElements: true,
    });

    expect(decorative.props.accessibilityElementsHidden).toBe(true);
    expect(decorative.props.importantForAccessibility).toBe(
      'no-hide-descendants',
    );
  });
});
