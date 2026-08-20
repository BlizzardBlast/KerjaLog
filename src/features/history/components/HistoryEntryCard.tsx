import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { DecorativeView } from '@/design-system/components/DecorativeView';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing, type ThemeColors } from '@/design-system/tokens/theme';
import type { EntryStatus, WorkEntry } from '@/domain/entry/model';
import {
  getHistoryEntryStatusKey,
  getHistoryEntryTypeKey,
} from '@/features/history/historyCopy';
import { formatHistoryEntryDate } from '@/features/history/historyGrouping';
import { useI18n } from '@/i18n/I18nProvider';

type SymbolName = ComponentProps<typeof SymbolView>['name'];

const PRIVATE_SYMBOL = {
  ios: 'lock.fill',
  android: 'lock',
  web: 'lock',
} satisfies SymbolName;

type HistoryEntryCardProps = {
  entry: WorkEntry;
  onPress: () => void;
};

export function HistoryEntryCard({ entry, onPress }: HistoryEntryCardProps) {
  const { theme } = useTheme();
  const { language, t } = useI18n();
  const locale = language === 'id' ? 'id-ID' : 'en-US';
  const isPrivate = entry.excludedFromExports;
  const statusLabel = isPrivate
    ? t('history.status.private')
    : t(getHistoryEntryStatusKey(entry.status));
  const meta = `${formatHistoryEntryDate(entry.occurredAt, locale)} · ${t(
    getHistoryEntryTypeKey(entry.type),
  )}`;
  const preview =
    entry.evidence?.detail ?? entry.impactStatement ?? entry.rawNote;

  return (
    <Pressable
      accessibilityHint={t('history.entry.openHint')}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.copy}>
          <Text variant="bodyStrong">{entry.title}</Text>
          <Text variant="caption" color="textMuted">
            {meta}
          </Text>
        </View>
        <StatusChip
          isPrivate={isPrivate}
          label={statusLabel}
          status={entry.status}
        />
      </View>
      <Text variant="caption" color="textMuted" numberOfLines={3}>
        {preview}
      </Text>
    </Pressable>
  );
}

type StatusChipProps = {
  isPrivate: boolean;
  label: string;
  status: EntryStatus;
};

function StatusChip({ isPrivate, label, status }: StatusChipProps) {
  const { theme } = useTheme();
  const palette = getStatusPalette(isPrivate, status);

  return (
    <View
      style={[
        styles.statusChip,
        { backgroundColor: theme.colors[palette.background] },
      ]}
    >
      {isPrivate ? (
        <DecorativeView>
          <SymbolView
            name={PRIVATE_SYMBOL}
            size={13}
            tintColor={theme.colors[palette.foreground]}
          />
        </DecorativeView>
      ) : null}
      <Text
        variant="caption"
        color={palette.foreground}
        style={styles.statusLabel}
      >
        {label}
      </Text>
    </View>
  );
}

function getStatusPalette(
  isPrivate: boolean,
  status: EntryStatus,
): { background: keyof ThemeColors; foreground: keyof ThemeColors } {
  if (isPrivate || status === 'quick_note') {
    return { background: 'warningSoft', foreground: 'warning' };
  }

  if (status === 'review_ready') {
    return { background: 'successSoft', foreground: 'success' };
  }

  return { background: 'surfaceSubtle', foreground: 'textMuted' };
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing[3],
    padding: spacing[4],
  },
  topRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing[2],
  },
  copy: {
    flex: 1,
    gap: spacing[1],
    minWidth: 0,
  },
  statusChip: {
    alignItems: 'center',
    borderRadius: radii.full,
    flexDirection: 'row',
    flexShrink: 1,
    gap: spacing[1],
    maxWidth: '48%',
    minHeight: 28,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
  },
  statusLabel: {
    flexShrink: 1,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.82,
  },
});
