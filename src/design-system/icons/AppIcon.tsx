import regular from 'expo-symbols/androidWeights/regular';
import { type AndroidSymbol, type SFSymbol, SymbolView } from 'expo-symbols';
import { Platform, StyleSheet, Text, View } from 'react-native';

export type AppIconName = {
  ios: SFSymbol;
  android: AndroidSymbol;
  web?: AndroidSymbol;
};

export type AppIconProps = {
  name: AppIconName;
  size?: number;
  color: string;
};

/**
 * Renders app icons without the per-instance Android font-loading blank frame
 * in expo-symbols. The Material Symbols font is loaded once at app startup by
 * useAppIconFontReady before Android UI is shown.
 */
export function AppIcon({ name, size = 24, color }: AppIconProps) {
  if (Platform.OS === 'ios') {
    return <SymbolView name={name.ios} size={size} tintColor={color} />;
  }

  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[styles.container, { height: size, width: size }]}
    >
      <Text
        allowFontScaling={false}
        style={[
          styles.materialSymbol,
          {
            color,
            fontFamily: regular.name,
            fontSize: size,
            height: size,
            lineHeight: size,
            width: size,
          },
        ]}
      >
        {name.android}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  materialSymbol: {
    includeFontPadding: false,
    textAlign: 'center',
  },
});
