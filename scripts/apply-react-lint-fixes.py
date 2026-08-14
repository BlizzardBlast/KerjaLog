from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def write(path: str, content: str) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding='utf-8')


write(
    'src/features/onboarding/components/ReminderTimePicker.tsx',
    '''import DateTimePicker from '@expo/ui/community/datetime-picker';
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

type VisibleReminderTimePickerProps = Omit<
  ReminderTimePickerProps,
  'visible'
>;

export function ReminderTimePicker({
  visible,
  value,
  onChange,
  onClose,
}: ReminderTimePickerProps) {
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
}: VisibleReminderTimePickerProps) {
  const insets = useSafeAreaInsets();
  const { theme, resolvedTheme } = useTheme();
  const { language, t } = useI18n();
  const [draftDate, setDraftDate] = useState(() => createReminderTimeDate(value));

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
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible
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

            <Text variant="bodyStrong">
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
    justifyContent: 'space-between',
  },
  headerAction: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 64,
  },
});
''',
)

write(
    'src/features/work-entry/useWorkEntry.ts',
    '''import { useEffect, useRef, useState } from 'react';
import { workEntryRepository } from '@/data/repositories/workEntryRepository';
import type { WorkEntryDetail } from '@/domain/entry/model';
import type { WorkEntryByIdReader } from '@/domain/entry/repository';

export type WorkEntryLoadState =
  | { status: 'loading' }
  | { status: 'loaded'; entry: WorkEntryDetail }
  | { status: 'not-found' }
  | { status: 'error' };

export type WorkEntryLoader = {
  state: WorkEntryLoadState;
  retry: () => void;
};

type StoredWorkEntryLoadState = {
  id: string;
  state: WorkEntryLoadState;
};

const LOADING_STATE: WorkEntryLoadState = { status: 'loading' };

export function useWorkEntry(
  id: string,
  repository: WorkEntryByIdReader = workEntryRepository,
): WorkEntryLoader {
  const [stored, setStored] = useState<StoredWorkEntryLoadState>(() => ({
    id,
    state: LOADING_STATE,
  }));
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    repository
      .findById(id)
      .then((entry) => {
        if (requestId === requestIdRef.current) {
          setStored({
            id,
            state: entry
              ? { status: 'loaded', entry }
              : { status: 'not-found' },
          });
        }
      })
      .catch(() => {
        if (requestId === requestIdRef.current) {
          setStored({ id, state: { status: 'error' } });
        }
      });

    return () => {
      requestIdRef.current += 1;
    };
  }, [id, repository]);

  const retry = () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setStored({ id, state: LOADING_STATE });

    repository
      .findById(id)
      .then((entry) => {
        if (requestId === requestIdRef.current) {
          setStored({
            id,
            state: entry
              ? { status: 'loaded', entry }
              : { status: 'not-found' },
          });
        }
      })
      .catch(() => {
        if (requestId === requestIdRef.current) {
          setStored({ id, state: { status: 'error' } });
        }
      });
  };

  return {
    state: stored.id === id ? stored.state : LOADING_STATE,
    retry,
  };
}
''',
)

write(
    'src/features/work-entry/useWorkEntryDraft.ts',
    '''import { useEffect, useRef, useState } from 'react';
import { workEntryDraftRepository } from '@/data/repositories/workEntryDraftRepository';
import type { WorkEntryDraft } from '@/domain/entry/draft';
import type { WorkEntryDraftReader } from '@/domain/entry/repository';

export type WorkEntryDraftLoadState =
  | { status: 'loading' }
  | { status: 'loaded'; draft: WorkEntryDraft | null }
  | { status: 'error' };

export type WorkEntryDraftLoader = {
  state: WorkEntryDraftLoadState;
  retry: () => void;
};

export function useWorkEntryDraft(
  repository: WorkEntryDraftReader = workEntryDraftRepository,
): WorkEntryDraftLoader {
  const [state, setState] = useState<WorkEntryDraftLoadState>({
    status: 'loading',
  });
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    repository
      .loadActive()
      .then((draft) => {
        if (requestId === requestIdRef.current) {
          setState({ status: 'loaded', draft });
        }
      })
      .catch(() => {
        if (requestId === requestIdRef.current) {
          setState({ status: 'error' });
        }
      });

    return () => {
      requestIdRef.current += 1;
    };
  }, [repository]);

  const retry = () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setState({ status: 'loading' });

    repository
      .loadActive()
      .then((draft) => {
        if (requestId === requestIdRef.current) {
          setState({ status: 'loaded', draft });
        }
      })
      .catch(() => {
        if (requestId === requestIdRef.current) {
          setState({ status: 'error' });
        }
      });
  };

  return {
    state,
    retry,
  };
}
''',
)

print('Applied React lint fixes.')
