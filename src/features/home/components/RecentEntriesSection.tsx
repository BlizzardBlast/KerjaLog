import { StyleSheet, View } from 'react-native';
import type { WorkEntry } from '@/domain/entry/model';
import { RecentEntryCard } from '@/features/home/components/RecentEntryCard';
import { SectionHeading } from '@/features/home/components/SectionHeading';
import { spacing } from '@/design-system/tokens/theme';
import { useI18n } from '@/i18n/I18nProvider';

type RecentEntriesSectionProps = {
  entries: WorkEntry[];
  onEntryPress: (id: string) => void;
};

export function RecentEntriesSection({
  entries,
  onEntryPress,
}: RecentEntriesSectionProps) {
  const { t } = useI18n();

  return (
    <>
      <SectionHeading
        title={t('home.recent.title')}
        description={t('home.recent.description')}
      />
      <View style={styles.list}>
        {entries.map((entry) => (
          <RecentEntryCard
            key={entry.id}
            entry={entry}
            onPress={() => onEntryPress(entry.id)}
          />
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing[2],
  },
});
