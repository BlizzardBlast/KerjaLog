import {
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import {
  radii,
  spacing,
  themes,
  typography,
} from '@/design-system/tokens/theme';
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
  const colors = themes[colorScheme === 'dark' ? 'dark' : 'light'].colors;
  const copy = getFallbackCopy();

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface }]}>
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
          { backgroundColor: colors.primary },
          pressed && styles.pressed,
        ]}
      >
        <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
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
    gap: spacing[6],
    justifyContent: 'center',
    padding: spacing[6],
  },
  copy: {
    gap: spacing[3],
    maxWidth: 480,
  },
  title: {
    fontSize: typography.title.fontSize,
    fontWeight: '700',
    lineHeight: typography.title.lineHeight,
    textAlign: 'center',
  },
  description: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    textAlign: 'center',
  },
  button: {
    alignItems: 'center',
    borderRadius: radii.md,
    justifyContent: 'center',
    minHeight: spacing[12],
    minWidth: 120,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
  },
  buttonText: {
    fontSize: typography.bodyStrong.fontSize,
    fontWeight: '600',
    lineHeight: typography.bodyStrong.lineHeight,
  },
  pressed: {
    opacity: 0.8,
  },
});
