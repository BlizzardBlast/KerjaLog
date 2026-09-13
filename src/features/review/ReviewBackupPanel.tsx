import { Alert, StyleSheet, View } from 'react-native';
import { Button } from '@/design-system/components/Button';
import { Text } from '@/design-system/components/Text';
import { radii, spacing } from '@/design-system/tokens/theme';
import {
  getPortableBackupSummary,
  type PortableBackup,
} from '@/domain/portability/model';
import { useI18n } from '@/i18n/I18nProvider';

type PortableAction = 'export' | 'import' | null;

type ReviewBackupPanelProps = {
  action: PortableAction;
  error: PortableAction;
  pendingImport: PortableBackup | null;
  onChooseImport: () => void;
  onDiscardImport: () => void;
  onExport: () => void;
  onReplace: () => void;
};

export function ReviewBackupPanel({
  action,
  error,
  pendingImport,
  onChooseImport,
  onDiscardImport,
  onExport,
  onReplace,
}: Readonly<ReviewBackupPanelProps>) {
  const { t } = useI18n();

  return (
    <View style={styles.card}>
      <Text accessibilityRole="header" variant="subheading">
        {t('review.backup.title')}
      </Text>
      <Text color="textMuted" variant="caption">
        {t('review.backup.description')}
      </Text>
      <View style={styles.actions}>
        <Button
          disabled={action !== null}
          loading={action === 'export'}
          size="sm"
          variant="secondary"
          onPress={() =>
            Alert.alert(
              t('review.backup.exportConfirmTitle'),
              t('review.backup.exportConfirmDescription'),
              [
                { text: t('review.backup.exportCancel'), style: 'cancel' },
                { text: t('review.backup.exportConfirm'), onPress: onExport },
              ],
            )
          }
        >
          {t('review.backup.export')}
        </Button>
        <Button
          disabled={action !== null}
          loading={action === 'import'}
          size="sm"
          variant="ghost"
          onPress={onChooseImport}
        >
          {t('review.backup.import')}
        </Button>
      </View>
      {error ? (
        <Text accessibilityRole="alert" color="danger" variant="caption">
          {t(`review.backup.${error}Error`)}
        </Text>
      ) : null}
      {pendingImport ? (
        <View accessibilityRole="alert" style={styles.summary}>
          <Text variant="bodyStrong">{t('review.backup.readyTitle')}</Text>
          <Text color="textMuted" variant="caption">
            {t(
              'review.backup.summary',
              getPortableBackupSummary(pendingImport),
            )}
          </Text>
          <Text color="textMuted" variant="caption">
            {t('review.backup.replaceDescription')}
          </Text>
          <View style={styles.actions}>
            <Button
              disabled={action !== null}
              size="sm"
              variant="ghost"
              onPress={onDiscardImport}
            >
              {t('review.backup.replaceCancel')}
            </Button>
            <Button
              disabled={action !== null}
              loading={action === 'import'}
              size="sm"
              variant="destructive"
              onPress={() =>
                Alert.alert(
                  t('review.backup.replaceConfirmTitle'),
                  t('review.backup.replaceConfirmDescription'),
                  [
                    {
                      text: t('review.backup.replaceCancel'),
                      style: 'cancel',
                    },
                    {
                      text: t('review.backup.replaceConfirm'),
                      style: 'destructive',
                      onPress: onReplace,
                    },
                  ],
                )
              }
            >
              {t('review.backup.replace')}
            </Button>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    gap: spacing[3],
    padding: spacing[4],
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  summary: { gap: spacing[2] },
});
