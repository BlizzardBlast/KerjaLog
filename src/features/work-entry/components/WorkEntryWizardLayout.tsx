import type { PropsWithChildren } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { layout, spacing } from '@/design-system/tokens/theme';

const SAFE_AREA_EDGES = ['top', 'bottom', 'left', 'right'] as const;

type WorkEntryWizardLayoutProps = PropsWithChildren<{
  stepKey: string;
}>;

export function WorkEntryWizardLayout({
  stepKey,
  children,
}: Readonly<WorkEntryWizardLayoutProps>) {
  const { theme } = useTheme();
  return (
    <SafeAreaView
      edges={SAFE_AREA_EDGES}
      style={[styles.screen, { backgroundColor: theme.colors.surface }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.screen}
      >
        <ScrollView
          key={stepKey}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    gap: spacing[5],
    paddingBottom: spacing[8],
    paddingHorizontal: layout.screenHorizontalPadding,
    paddingTop: spacing[4],
  },
});
