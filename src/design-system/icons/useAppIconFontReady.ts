import { useFonts } from 'expo-font';
import regular from 'expo-symbols/androidWeights/regular';
import { Platform } from 'react-native';

const androidIconFonts =
  Platform.OS === 'android' ? { [regular.name]: regular.font } : {};

/**
 * Keeps the splash screen visible until Android Material Symbols are ready.
 * If runtime loading fails, allow the app to continue and let AppIcon use its
 * SymbolView fallback rather than trapping the user behind startup UI.
 */
export function useAppIconFontReady(): boolean {
  const [loaded, error] = useFonts(androidIconFonts);

  return Platform.OS !== 'android' || loaded || error !== null;
}
