import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing } from '@/design-system/tokens/theme';
import {
  REMINDER_WEEKDAYS,
  type ReminderWeekday,
} from '@/features/onboarding/model';
import { reminderWeekdayTranslationKeys } from '@/features/onboarding/reminderSchedule';
import { useI18n } from '@/i18n/I18nProvider';

export type ReminderDayPickerProps = {
  visible: boolean;
  value: ReminderWeekday;
  onChange: (weekday: ReminderWeekday) => void;
  onClose: () => void;
};

export function ReminderDayPicker({
  visible,
  value,
  onChange,
  onClose,
}: ReminderDayPickerProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { t } = useI18n();

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={styles.modal}>
        <Pressable
          accessibilityLabel={t('common.action.cancel')}
          accessibilityRole="button"
          onPress={onClose}
          style={styles.backdrop}
        />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              paddingBottom: Math.max(insets.bottom, spacing[4]),
            },
          ]}
        >
          <View style={styles.grabberWrap}>
            <View
              style={[styles.grabber, { backgroundColor: theme.colors.border }]}
            />
          </View>

          <Text variant="heading">
            {t('onboarding.review.reminderDayPickerTitle')}
          </Text>

          <View style={styles.options} accessibilityRole="radiogroup">
            {REMINDER_WEEKDAYS.map((weekday) => {
              const selected = weekday === value;

              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  key={weekday}
                  onPress={() => {
                    onChange(weekday);
                    onClose();
                  }}
                  style={({ pressed }) => [
                    styles.option,
                    {
                      backgroundColor: selected
                        ? theme.colors.primarySoft
                        : theme.colors.surface,
                      borderColor: selected
                        ? theme.colors.primary
                        : theme.colors.border,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    variant="bodyStrong"
                    color={selected ? 'primary' : 'text'}
                  >
                    {t(reminderWeekdayTranslationKeys[weekday])}
                  </Text>
                  {selected ? (
                    <Text variant="bodyStrong" color="primary">
                      ✓
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    backgroundColor: 'rgba(21, 18, 24, 0.48)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  sheet: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    borderWidth: 1,
    gap: spacing[4],
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
  },
  grabberWrap: {
    alignItems: 'center',
  },
  grabber: {
    borderRadius: radii.full,
    height: 4,
    width: 42,
  },
  options: {
    gap: spacing[2],
  },
  option: {
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  pressed: {
    opacity: 0.82,
  },
});
