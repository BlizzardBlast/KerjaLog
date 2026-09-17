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
  disabled: boolean;
  document: ReviewDraftDocument;
  onChange: (document: ReviewDraftDocument) => void;
};

export function ReviewDraftDocumentEditor({
  disabled,
  document,
  onChange,
}: Readonly<ReviewDraftDocumentEditorProps>) {
  const { t } = useI18n();
  const { theme } = useTheme();

  const commitDocument = (nextDocument: ReviewDraftDocument) => {
    if (!disabled) {
      onChange(nextDocument);
    }
  };
  const updateSection = (
    sectionIndex: number,
    update: (
      section: ReviewDraftDocument['sections'][number],
    ) => ReviewDraftDocument['sections'][number],
  ) => {
    commitDocument({
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
    commitDocument({ sections });
  };
  const updateSectionTitle = (sectionIndex: number, title: string) => {
    updateSection(sectionIndex, (section) => ({ ...section, title }));
  };
  const updateBullet = (
    sectionIndex: number,
    bulletIndex: number,
    value: string,
  ) => {
    updateSection(sectionIndex, (section) => ({
      ...section,
      bullets: section.bullets.map((bullet, index) =>
        index === bulletIndex ? value : bullet,
      ),
    }));
  };
  const removeBullet = (sectionIndex: number, bulletIndex: number) => {
    updateSection(sectionIndex, (section) => ({
      ...section,
      bullets: section.bullets.filter((_, index) => index !== bulletIndex),
    }));
  };
  const addBullet = (sectionIndex: number) => {
    updateSection(sectionIndex, (section) => ({
      ...section,
      bullets: [...section.bullets, t('review.editor.emptyBullet')],
    }));
  };
  const removeSection = (sectionIndex: number) => {
    commitDocument({
      sections: document.sections.filter((_, index) => index !== sectionIndex),
    });
  };
  const addSection = () => {
    commitDocument({
      sections: [
        ...document.sections,
        {
          id: Crypto.randomUUID(),
          title: t('review.editor.emptySection'),
          bullets: [t('review.editor.emptyBullet')],
        },
      ],
    });
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
            accessibilityState={{ disabled }}
            editable={!disabled}
            hasError={!section.title.trim()}
            value={section.title}
            onChangeText={(value) => updateSectionTitle(sectionIndex, value)}
            style={styles.textInput}
          />
          {section.bullets.map((bullet, bulletIndex) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: bullets do not reorder and remain fully controlled by the form.
            <View key={`${section.id}-${bulletIndex}`} style={styles.bulletRow}>
              <TextField
                accessibilityLabel={t('review.editor.bulletLabel', {
                  number: bulletIndex + 1,
                })}
                accessibilityState={{ disabled }}
                editable={!disabled}
                hasError={!bullet.trim()}
                multiline
                value={bullet}
                onChangeText={(value) =>
                  updateBullet(sectionIndex, bulletIndex, value)
                }
                style={[styles.textInput, styles.bulletInput]}
              />
              <Pressable
                accessibilityLabel={t('review.editor.removeBullet')}
                accessibilityRole="button"
                accessibilityState={{ disabled }}
                disabled={disabled}
                hitSlop={8}
                onPress={() => removeBullet(sectionIndex, bulletIndex)}
                style={[styles.iconButton, disabled && styles.disabled]}
              >
                <Text color="danger">×</Text>
              </Pressable>
            </View>
          ))}
          <View style={styles.sectionActions}>
            <Button
              disabled={disabled}
              size="sm"
              variant="secondary"
              onPress={() => addBullet(sectionIndex)}
            >
              {t('review.editor.addBullet')}
            </Button>
            <Button
              disabled={disabled || sectionIndex === 0}
              size="sm"
              variant="ghost"
              onPress={() => moveSection(sectionIndex, -1)}
            >
              {t('review.editor.moveSectionUp')}
            </Button>
            <Button
              disabled={
                disabled || sectionIndex === document.sections.length - 1
              }
              size="sm"
              variant="ghost"
              onPress={() => moveSection(sectionIndex, 1)}
            >
              {t('review.editor.moveSectionDown')}
            </Button>
            <Button
              disabled={disabled}
              size="sm"
              variant="ghost"
              onPress={() => removeSection(sectionIndex)}
            >
              {t('review.editor.removeSection')}
            </Button>
          </View>
        </View>
      ))}
      <Button
        disabled={disabled}
        fullWidth
        variant="secondary"
        onPress={addSection}
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
  disabled: { opacity: 0.5 },
  sectionActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
});
