import * as Font from 'expo-font';
import regular from 'expo-symbols/androidWeights/regular';
import { type AndroidSymbol, type SFSymbol, SymbolView } from 'expo-symbols';
import {
  type ColorValue,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export type AppIconName = {
  ios: SFSymbol;
  android: AndroidSymbol;
};

export type AppIconProps = {
  name: AppIconName;
  size?: number;
  color: ColorValue;
};

/**
 * Renders app icons without the per-instance Android font-loading blank frame
 * in expo-symbols. Android uses the preloaded Material Symbols font when it is
 * available and falls back to SymbolView if runtime font loading fails.
 */
export function AppIcon({ name, size = 24, color }: AppIconProps) {
  const useLoadedAndroidFont =
    Platform.OS === 'android' && Font.isLoaded(regular.name);

  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[styles.container, { height: size, width: size }]}
    >
      {useLoadedAndroidFont ? (
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
      ) : (
        <SymbolView
          name={{ ios: name.ios, android: name.android, web: name.android }}
          size={size}
          tintColor={color}
        />
      )}
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
