import DateTimePicker from '@expo/ui/community/datetime-picker';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing } from '@/design-system/tokens/theme';
import type { WeeklyReminderSchedule } from '@/features/onboarding/model';
import { createReminderTimeDate } from '@/features/onboarding/reminderSchedule';
import { useI18n } from '@/i18n/I18nProvider';

export type ReminderTimePickerProps = {
  visible: boolean;
  value: WeeklyReminderSchedule;
  onChange: (date: Date) => void;
  onClose: () => void;
};

type VisibleReminderTimePickerProps = Omit<ReminderTimePickerProps, 'visible'>;

export function ReminderTimePicker({
  visible,
  value,
  onChange,
  onClose,
}: Readonly<ReminderTimePickerProps>) {
  if (!visible) {
    return null;
  }

  return (
    <VisibleReminderTimePicker
      value={value}
      onChange={onChange}
      onClose={onClose}
    />
  );
}

function VisibleReminderTimePicker({
  value,
  onChange,
  onClose,
}: Readonly<VisibleReminderTimePickerProps>) {
  const insets = useSafeAreaInsets();
  const { theme, resolvedTheme } = useTheme();
  const { language, t } = useI18n();
  const [draftDate, setDraftDate] = useState(() =>
    createReminderTimeDate(value),
  );

  if (Platform.OS === 'android') {
    return (
      <DateTimePicker
        accentColor={theme.colors.primary}
        mode="time"
        onDismiss={onClose}
        onValueChange={(_, selectedDate) => {
          onChange(selectedDate);
          onClose();
        }}
        presentation="dialog"
        value={draftDate}
      />
    );
  }

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible>
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

          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={styles.headerAction}
            >
              <Text variant="label" color="textMuted">
                {t('common.action.cancel')}
              </Text>
            </Pressable>

            <Text variant="bodyStrong" style={styles.headerTitle}>
              {t('onboarding.review.reminderTimePickerTitle')}
            </Text>

            <Pressable
              accessibilityRole="button"
              onPress={() => {
                onChange(draftDate);
                onClose();
              }}
              style={styles.headerAction}
            >
              <Text variant="label" color="primary">
                {t('common.action.done')}
              </Text>
            </Pressable>
          </View>

          <DateTimePicker
            accentColor={theme.colors.primary}
            display="spinner"
            locale={language === 'id' ? 'id_ID' : 'en_US'}
            mode="time"
            onValueChange={(_, selectedDate) => setDraftDate(selectedDate)}
            themeVariant={resolvedTheme}
            value={draftDate}
          />
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
  header: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  headerAction: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 64,
  },
  headerTitle: {
    flex: 1,
    marginHorizontal: spacing[2],
    textAlign: 'center',
  },
});
