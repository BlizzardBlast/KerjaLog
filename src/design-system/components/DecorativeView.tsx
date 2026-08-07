import type { PropsWithChildren } from 'react';
import { View, type ViewProps } from 'react-native';

export type DecorativeViewProps = PropsWithChildren<ViewProps>;

export function DecorativeView({
  children,
  ...props
}: DecorativeViewProps) {
  return (
    <View
      {...props}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {children}
    </View>
  );
}
