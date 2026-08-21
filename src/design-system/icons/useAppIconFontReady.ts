import { useFonts } from 'expo-font';
import regular from 'expo-symbols/androidWeights/regular';
import { Platform } from 'react-native';

const androidIconFonts =
  Platform.OS === 'android' ? { [regular.name]: regular.font } : {};

/** Keeps the splash screen visible until Android Material Symbols are ready. */
export function useAppIconFontReady(): boolean {
  const [loaded, error] = useFonts(androidIconFonts);

  if (Platform.OS === 'android' && error) {
    throw error;
  }

  return Platform.OS !== 'android' || loaded;
}
