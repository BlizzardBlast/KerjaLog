import { Pressable, StyleSheet, View } from 'react-native';
import { DecorativeView } from '@/design-system/components/DecorativeView';
import { Text } from '@/design-system/components/Text';
import { AppIcon, type AppIconName } from '@/design-system/icons/AppIcon';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing } from '@/design-system/tokens/theme';

type LogChoiceCardProps = {
  title: string;
  description?: string | undefined;
  icon?: AppIconName | undefined;
  selected: boolean;
  onPress: () => void;
  mode?: 'single' | 'multiple';
};

export function LogChoiceCard({
  title,
  description,
  icon,
  selected,
  onPress,
  mode = 'single',
}: LogChoiceCardProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      accessibilityRole={mode === 'multiple' ? 'checkbox' : 'radio'}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: selected
            ? theme.colors.primarySoft
            : theme.colors.surface,
          borderColor: selected ? theme.colors.primary : theme.colors.border,
        },
        selected && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      {icon ? (
        <DecorativeView
          style={[
            styles.icon,
            {
              backgroundColor: selected
                ? theme.colors.primary
                : theme.colors.surfaceSubtle,
            },
          ]}
        >
          <AppIcon
            name={icon}
            size={20}
            color={selected ? theme.colors.onPrimary : theme.colors.textMuted}
          />
        </DecorativeView>
      ) : null}

      <View style={styles.copy}>
        <Text variant="bodyStrong">{title}</Text>
        {description ? (
          <Text variant="caption" color="textMuted" style={styles.description}>
            {description}
          </Text>
        ) : null}
      </View>

      {selected ? (
        <DecorativeView
          style={[styles.check, { backgroundColor: theme.colors.primary }]}
        >
          <AppIcon
            name={{ ios: 'checkmark', android: 'check' }}
            size={16}
            color={theme.colors.onPrimary}
          />
        </DecorativeView>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing[3],
    minHeight: 68,
    padding: 14,
  },
  selected: {
    borderWidth: 2,
    padding: 13,
  },
  pressed: {
    opacity: 0.82,
  },
  icon: {
    alignItems: 'center',
    borderRadius: radii.sm,
    height: spacing[10],
    justifyContent: 'center',
    width: spacing[10],
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  description: {
    marginTop: 3,
  },
  check: {
    alignItems: 'center',
    borderRadius: radii.full,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
});
