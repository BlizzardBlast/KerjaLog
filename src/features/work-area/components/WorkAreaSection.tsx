import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { spacing } from '@/design-system/tokens/theme';
import type { WorkArea } from '@/domain/work-area/model';

type WorkAreaSectionProps = {
  title: string;
  emptyText: string;
  workAreas: WorkArea[];
  renderActions: (workArea: WorkArea) => ReactNode;
};

export function WorkAreaSection({
  title,
  emptyText,
  workAreas,
  renderActions,
}: Readonly<WorkAreaSectionProps>) {
  const { theme } = useTheme();

  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" variant="heading">
        {title}
      </Text>
      {workAreas.length === 0 ? (
        <Text color="textMuted">{emptyText}</Text>
      ) : (
        workAreas.map((workArea) => (
          <View
            key={workArea.id}
            style={[styles.row, { borderColor: theme.colors.border }]}
          >
            <Text style={styles.name} variant="bodyStrong">
              {workArea.name}
            </Text>
            <View style={styles.rowActions}>{renderActions(workArea)}</View>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing[3] },
  row: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing[3],
    paddingBottom: spacing[3],
  },
  name: { flex: 1 },
  rowActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    justifyContent: 'flex-end',
  },
});
