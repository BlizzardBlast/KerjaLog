import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { ignoreError } from '@/shared/utils/function';

type RootErrorScreenProps = {
  onRetry: () => Promise<void>;
};

type RootErrorCopy = {
  title: string;
  description: string;
  retry: string;
};

const copyByLanguage: Record<'en' | 'id', RootErrorCopy> = {
  en: {
    title: 'Something went wrong',
    description:
      'KerjaLog could not open this screen. Your saved work remains on this device.',
    retry: 'Try again',
  },
  id: {
    title: 'Terjadi kesalahan',
    description:
      'KerjaLog tidak dapat membuka layar ini. Catatan kerja yang tersimpan tetap berada di perangkat ini.',
    retry: 'Coba lagi',
  },
};

function getFallbackCopy(): RootErrorCopy {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase();
    return copyByLanguage[locale.startsWith('id') ? 'id' : 'en'];
  } catch {
    return copyByLanguage.en;
  }
}

export function RootErrorScreen({ onRetry }: RootErrorScreenProps) {
  const colorScheme = useColorScheme();
  const dark = colorScheme === 'dark';
  const copy = getFallbackCopy();
  const colors = dark
    ? {
        background: '#211C25',
        text: '#F8F3FB',
        textMuted: '#BCB2C1',
        button: '#A78BFA',
        buttonText: '#151218',
      }
    : {
        background: '#FFFDFC',
        text: '#211B2A',
        textMuted: '#6F6675',
        button: '#7138F2',
        buttonText: '#FFFFFF',
      };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View accessibilityRole="alert" style={styles.copy}>
        <Text style={[styles.title, { color: colors.text }]}>{copy.title}</Text>
        <Text style={[styles.description, { color: colors.textMuted }]}>
          {copy.description}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          onRetry().catch(ignoreError);
        }}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: colors.button },
          pressed && styles.pressed,
        ]}
      >
        <Text style={[styles.buttonText, { color: colors.buttonText }]}>
          {copy.retry}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: 'center',
    flex: 1,
    gap: 24,
    justifyContent: 'center',
    padding: 24,
  },
  copy: {
    gap: 12,
    maxWidth: 480,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  button: {
    alignItems: 'center',
    borderRadius: 16,
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 120,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  pressed: {
    opacity: 0.8,
  },
});
