import { fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { ThemeProvider } from '@/design-system/theme/ThemeProvider';
import type { PortableBackup } from '@/domain/portability/model';
import { ReviewBackupPanel } from '@/features/review/ReviewBackupPanel';

jest.mock('@/i18n/I18nProvider', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

const backup: PortableBackup = {
  version: 1,
  exportedAt: '2026-09-12T08:00:00.000Z',
  data: {
    workAreas: [],
    entries: [],
    activeDraft: null,
    reviewDrafts: [],
    preferences: {
      themeMode: 'system',
      language: 'en',
      onboarding: {
        version: 1,
        currentStep: 'welcome',
        completed: false,
        weeklyReminderEnabled: false,
        weeklyReminderSchedule: { weekday: 6, hour: 16, minute: 30 },
      },
    },
  },
};

describe('ReviewBackupPanel', () => {
  test('does not replace anything until the destructive confirmation is accepted', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    const onReplace = jest.fn();
    await render(
      <ThemeProvider>
        <ReviewBackupPanel
          action={null}
          error={null}
          pendingImport={backup}
          onChooseImport={jest.fn()}
          onDiscardImport={jest.fn()}
          onExport={jest.fn()}
          onReplace={onReplace}
        />
      </ThemeProvider>,
    );

    fireEvent.press(
      screen.getByRole('button', { name: 'review.backup.replace' }),
    );
    expect(alert).toHaveBeenCalledWith(
      'review.backup.replaceConfirmTitle',
      'review.backup.replaceConfirmDescription',
      expect.any(Array),
    );
    expect(onReplace).not.toHaveBeenCalled();

    const buttons = alert.mock.calls[0]?.[2];
    const confirm = buttons?.find((button) => button.style === 'destructive');
    confirm?.onPress?.();

    expect(onReplace).toHaveBeenCalledTimes(1);
  });
});
