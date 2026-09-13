import * as Crypto from 'expo-crypto';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button } from '@/design-system/components/Button';
import { Text } from '@/design-system/components/Text';
import { TextField } from '@/design-system/components/TextField';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing } from '@/design-system/tokens/theme';
import type { ReviewDraftDocument } from '@/domain/review/model';
import { useI18n } from '@/i18n/I18nProvider';

type ReviewDraftDocumentEditorProps = {
  document: ReviewDraftDocument;
  onChange: (document: ReviewDraftDocument) => void;
};

export function ReviewDraftDocumentEditor({
  document,
  onChange,
}: Readonly<ReviewDraftDocumentEditorProps>) {
  const { t } = useI18n();
  const { theme } = useTheme();

  const updateSection = (
    sectionIndex: number,
    update: (
      section: ReviewDraftDocument['sections'][number],
    ) => ReviewDraftDocument['sections'][number],
  ) => {
    onChange({
      sections: document.sections.map((section, index) =>
        index === sectionIndex ? update(section) : section,
      ),
    });
  };
  const moveSection = (sectionIndex: number, offset: -1 | 1) => {
    const targetIndex = sectionIndex + offset;
    if (targetIndex < 0 || targetIndex >= document.sections.length) {
      return;
    }
    const sections = [...document.sections];
    const current = sections[sectionIndex];
    const target = sections[targetIndex];
    if (!current || !target) {
      return;
    }
    sections[sectionIndex] = target;
    sections[targetIndex] = current;
    onChange({ sections });
  };

  return (
    <View style={styles.sections}>
      <Text accessibilityRole="header" variant="subheading">
        {t('review.editor.sections')}
      </Text>
      {document.sections.map((section, sectionIndex) => (
        <View
          key={section.id}
          style={[
            styles.section,
            {
              backgroundColor: theme.colors.surfaceSubtle,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <TextField
            accessibilityLabel={t('review.editor.sectionTitle')}
            hasError={!section.title.trim()}
            value={section.title}
            onChangeText={(value) =>
              updateSection(sectionIndex, (current) => ({
                ...current,
                title: value,
              }))
            }
            style={styles.textInput}
          />
          {section.bullets.map((bullet, bulletIndex) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: bullets do not reorder and remain fully controlled by the form.
            <View key={`${section.id}-${bulletIndex}`} style={styles.bulletRow}>
              <TextField
                accessibilityLabel={t('review.editor.bulletLabel', {
                  number: bulletIndex + 1,
                })}
                hasError={!bullet.trim()}
                multiline
                value={bullet}
                onChangeText={(value) =>
                  updateSection(sectionIndex, (current) => ({
                    ...current,
                    bullets: current.bullets.map((item, index) =>
                      index === bulletIndex ? value : item,
                    ),
                  }))
                }
                style={[styles.textInput, styles.bulletInput]}
              />
              <Pressable
                accessibilityLabel={t('review.editor.removeBullet')}
                accessibilityRole="button"
                hitSlop={8}
                onPress={() =>
                  updateSection(sectionIndex, (current) => ({
                    ...current,
                    bullets: current.bullets.filter(
                      (_, index) => index !== bulletIndex,
                    ),
                  }))
                }
                style={styles.iconButton}
              >
                <Text color="danger">×</Text>
              </Pressable>
            </View>
          ))}
          <View style={styles.sectionActions}>
            <Button
              size="sm"
              variant="secondary"
              onPress={() =>
                updateSection(sectionIndex, (current) => ({
                  ...current,
                  bullets: [...current.bullets, t('review.editor.emptyBullet')],
                }))
              }
            >
              {t('review.editor.addBullet')}
            </Button>
            <Button
              disabled={sectionIndex === 0}
              size="sm"
              variant="ghost"
              onPress={() => moveSection(sectionIndex, -1)}
            >
              {t('review.editor.moveSectionUp')}
            </Button>
            <Button
              disabled={sectionIndex === document.sections.length - 1}
              size="sm"
              variant="ghost"
              onPress={() => moveSection(sectionIndex, 1)}
            >
              {t('review.editor.moveSectionDown')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onPress={() =>
                onChange({
                  sections: document.sections.filter(
                    (_, index) => index !== sectionIndex,
                  ),
                })
              }
            >
              {t('review.editor.removeSection')}
            </Button>
          </View>
        </View>
      ))}
      <Button
        fullWidth
        variant="secondary"
        onPress={() =>
          onChange({
            sections: [
              ...document.sections,
              {
                id: Crypto.randomUUID(),
                title: t('review.editor.emptySection'),
                bullets: [t('review.editor.emptyBullet')],
              },
            ],
          })
        }
      >
        {t('review.editor.addSection')}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  sections: { gap: spacing[3] },
  section: {
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing[3],
    padding: spacing[3],
  },
  bulletRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing[2],
  },
  textInput: {
    borderRadius: radii.md,
    borderWidth: 1,
    minHeight: 52,
    padding: spacing[3],
  },
  bulletInput: { flex: 1, minHeight: 72, textAlignVertical: 'top' },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    minWidth: 48,
  },
  sectionActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
});
