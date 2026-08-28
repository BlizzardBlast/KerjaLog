import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing } from '@/design-system/tokens/theme';
import { ReminderDayPicker } from '@/features/onboarding/components/ReminderDayPicker';
import { ReminderTimePicker } from '@/features/onboarding/components/ReminderTimePicker';
import type { WeeklyReminderSchedule } from '@/features/onboarding/model';
import {
  formatReminderTime,
  reminderWeekdayTranslationKeys,
  withReminderTime,
} from '@/features/onboarding/reminderSchedule';
import { useI18n } from '@/i18n/I18nProvider';
import { ignoreError } from '@/shared/utils/function';

export type ReminderScheduleCardProps = {
  schedule: WeeklyReminderSchedule;
  disabled?: boolean;
  onChange: (schedule: WeeklyReminderSchedule) => void | Promise<void>;
};

export function ReminderScheduleCard({
  schedule,
  disabled = false,
  onChange,
}: Readonly<ReminderScheduleCardProps>) {
  const { theme } = useTheme();
  const { language, t } = useI18n();
  const [dayPickerVisible, setDayPickerVisible] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);

  const commitSchedule = (nextSchedule: WeeklyReminderSchedule) => {
    Promise.resolve(onChange(nextSchedule)).catch(ignoreError);
  };

  return (
    <>
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
          disabled && styles.disabled,
        ]}
      >
        <ScheduleRow
          label={t('onboarding.review.reminderDayLabel')}
          value={t(reminderWeekdayTranslationKeys[schedule.weekday])}
          accessibilityLabel={t('onboarding.review.reminderDayAccessibility')}
          disabled={disabled}
          onPress={() => setDayPickerVisible(true)}
        />

        <View
          style={[styles.divider, { backgroundColor: theme.colors.border }]}
        />

        <ScheduleRow
          label={t('onboarding.review.reminderTimeLabel')}
          value={formatReminderTime(schedule, language)}
          accessibilityLabel={t('onboarding.review.reminderTimeAccessibility')}
          disabled={disabled}
          onPress={() => setTimePickerVisible(true)}
        />

        <Text variant="caption" color="textMuted" style={styles.hint}>
          {t('onboarding.review.reminderLocalTimeHint')}
        </Text>
      </View>

      <ReminderDayPicker
        onChange={(weekday) => commitSchedule({ ...schedule, weekday })}
        onClose={() => setDayPickerVisible(false)}
        value={schedule.weekday}
        visible={dayPickerVisible}
      />

      <ReminderTimePicker
        onChange={(date) => commitSchedule(withReminderTime(schedule, date))}
        onClose={() => setTimePickerVisible(false)}
        value={schedule}
        visible={timePickerVisible}
      />
    </>
  );
}

type ScheduleRowProps = {
  label: string;
  value: string;
  accessibilityLabel: string;
  disabled: boolean;
  onPress: () => void;
};

function ScheduleRow({
  label,
  value,
  accessibilityLabel,
  disabled,
  onPress,
}: Readonly<ScheduleRowProps>) {
  return (
    <Pressable
      accessibilityLabel={`${accessibilityLabel}: ${value}`}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.rowCopy}>
        <Text variant="label" color="textMuted">
          {label}
        </Text>
        <Text variant="bodyStrong">{value}</Text>
      </View>
      <Text variant="heading" color="textMuted" accessibilityElementsHidden>
        ›
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 64,
    paddingVertical: spacing[2],
  },
  rowCopy: {
    gap: spacing[1],
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  hint: {
    paddingBottom: spacing[3],
    paddingTop: spacing[2],
  },
  disabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.75,
  },
});
