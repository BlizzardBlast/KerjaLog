import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing } from '@/design-system/tokens/theme';
import {
  hasWorkEntryHistoryFilters,
  type WorkEntryHistoryFilters,
} from '@/domain/entry/history';
import { ENTRY_TYPES, type EntryType } from '@/domain/entry/model';
import type { WorkArea } from '@/domain/work-area/model';
import { getHistoryEntryTypeKey } from '@/features/history/historyCopy';
import { useI18n } from '@/i18n/I18nProvider';

type ExpandedFilter = 'entryType' | 'workArea' | null;

type HistoryFilterBarProps = {
  filters: WorkEntryHistoryFilters;
  workAreas: WorkArea[];
  onEntryTypeChange: (entryType: EntryType | null) => void;
  onWorkAreaChange: (workAreaId: string | null) => void;
  onEvidenceToggle: () => void;
  onReviewReadyToggle: () => void;
  onClear: () => void;
};

export function HistoryFilterBar({
  filters,
  workAreas,
  onEntryTypeChange,
  onWorkAreaChange,
  onEvidenceToggle,
  onReviewReadyToggle,
  onClear,
}: Readonly<HistoryFilterBarProps>) {
  const { t } = useI18n();
  const [expandedFilter, setExpandedFilter] = useState<ExpandedFilter>(() => {
    if (filters.entryType !== null) return 'entryType';
    if (filters.workAreaId !== null) return 'workArea';
    return null;
  });
  const hasFilters = hasWorkEntryHistoryFilters(filters);
  const canFilterWorkAreas =
    workAreas.length > 0 || filters.workAreaId !== null;

  const toggleExpanded = (filter: Exclude<ExpandedFilter, null>) => {
    setExpandedFilter((current) => (current === filter ? null : filter));
  };

  return (
    <View style={styles.container}>
      <ScrollView
        accessibilityLabel={t('history.filters.label')}
        horizontal
        contentContainerStyle={styles.row}
        showsHorizontalScrollIndicator={false}
      >
        <FilterChip
          label={t('history.filters.all')}
          selected={!hasFilters}
          onPress={() => {
            onClear();
            setExpandedFilter(null);
          }}
        />
        <FilterChip
          expanded={expandedFilter === 'entryType'}
          label={t('history.filters.entryType')}
          selected={filters.entryType !== null}
          onPress={() => toggleExpanded('entryType')}
        />
        {canFilterWorkAreas ? (
          <FilterChip
            expanded={expandedFilter === 'workArea'}
            label={t('history.filters.workArea')}
            selected={filters.workAreaId !== null}
            onPress={() => toggleExpanded('workArea')}
          />
        ) : null}
        <FilterChip
          label={t('history.filters.evidence')}
          selected={filters.hasEvidence}
          onPress={onEvidenceToggle}
        />
        <FilterChip
          label={t('history.filters.reviewReady')}
          selected={filters.reviewReadyOnly}
          onPress={onReviewReadyToggle}
        />
      </ScrollView>

      {expandedFilter === 'entryType' ? (
        <ScrollView
          accessibilityLabel={t('history.filters.entryTypesLabel')}
          horizontal
          contentContainerStyle={styles.row}
          showsHorizontalScrollIndicator={false}
        >
          {ENTRY_TYPES.map((entryType) => (
            <FilterChip
              key={entryType}
              label={t(getHistoryEntryTypeKey(entryType))}
              selected={filters.entryType === entryType}
              onPress={() =>
                onEntryTypeChange(
                  filters.entryType === entryType ? null : entryType,
                )
              }
            />
          ))}
        </ScrollView>
      ) : null}

      {expandedFilter === 'workArea' ? (
        <ScrollView
          accessibilityLabel={t('history.filters.workAreasLabel')}
          horizontal
          contentContainerStyle={styles.row}
          showsHorizontalScrollIndicator={false}
        >
          <FilterChip
            label={t('history.filters.anyWorkArea')}
            selected={filters.workAreaId === null}
            onPress={() => onWorkAreaChange(null)}
          />
          {workAreas.map((workArea) => (
            <FilterChip
              key={workArea.id}
              label={
                workArea.archivedAt
                  ? t('workArea.archivedName', { name: workArea.name })
                  : workArea.name
              }
              selected={filters.workAreaId === workArea.id}
              onPress={() =>
                onWorkAreaChange(
                  filters.workAreaId === workArea.id ? null : workArea.id,
                )
              }
            />
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

type FilterChipProps = {
  expanded?: boolean;
  label: string;
  selected: boolean;
  onPress: () => void;
};

function FilterChip({
  expanded,
  label,
  selected,
  onPress,
}: Readonly<FilterChipProps>) {
  const { theme } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded, selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected
            ? theme.colors.primarySoft
            : theme.colors.surface,
          borderColor: selected ? theme.colors.primary : theme.colors.border,
        },
        pressed && styles.pressed,
      ]}
    >
      <Text
        variant="label"
        color={selected ? 'primary' : 'textMuted'}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[2],
  },
  row: {
    gap: spacing[2],
    paddingRight: spacing[4],
  },
  chip: {
    alignItems: 'center',
    borderRadius: radii.full,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing[4],
  },
  pressed: {
    opacity: 0.76,
  },
});
