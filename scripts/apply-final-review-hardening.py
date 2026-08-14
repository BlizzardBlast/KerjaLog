from __future__ import annotations

import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, content: str) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")


def replace_once(path: str, old: str, new: str) -> None:
    content = read(path)
    if old not in content:
        raise RuntimeError(f"Expected text not found in {path}: {old[:100]!r}")
    write(path, content.replace(old, new, 1))


def delete(path: str) -> None:
    target = ROOT / path
    if target.is_dir():
        shutil.rmtree(target)
    elif target.exists():
        target.unlink()


# ---------------------------------------------------------------------------
# Dependency/tooling hardening
# ---------------------------------------------------------------------------
package_path = ROOT / "package.json"
package = json.loads(package_path.read_text(encoding="utf-8"))
for dependency in (
    "expo-device",
    "expo-glass-effect",
    "expo-image",
    "expo-web-browser",
):
    package["dependencies"].pop(dependency, None)

package["devDependencies"].update(
    {
        "@typescript-eslint/parser": "8.65.0",
        "eslint": "10.8.0",
        "eslint-plugin-react-hooks": "7.1.1",
    }
)
package["scripts"]["lint"] = "biome lint . && eslint src --max-warnings=0"
package["scripts"].pop("react:refs:check", None)
package["scripts"]["check"] = (
    "pnpm lint && pnpm format:check && pnpm typecheck && "
    "pnpm run compiler:check && pnpm run schema:check && pnpm test:ci && "
    "pnpm run expo:doctor && pnpm run native:check && "
    "pnpm run export:android && pnpm run export:ios"
)
package_path.write_text(json.dumps(package, indent=2) + "\n", encoding="utf-8")

write(
    "eslint.config.mjs",
    """import tsParser from '@typescript-eslint/parser';
import reactHooks from 'eslint-plugin-react-hooks';

const reactHooksRecommended = reactHooks.configs.flat.recommended;

export default [
  {
    ignores: ['android/**', 'ios/**', 'dist/**', 'node_modules/**'],
  },
  {
    ...reactHooksRecommended,
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      ...reactHooksRecommended.languageOptions,
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
  },
];
""",
)

delete("scripts/check-render-ref-access.mjs")
delete("scripts/check-render-ref-access.test.mjs")

ci = read(".github/workflows/ci.yml")
ci = ci.replace(
    "\n      - name: Check render ref purity\n        run: pnpm run react:refs:check\n",
    "",
)
write(".github/workflows/ci.yml", ci)

write(
    ".github/dependabot.yml",
    """version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
    open-pull-requests-limit: 10
    groups:
      production-dependencies:
        dependency-type: production
        patterns:
          - '*'
      development-dependencies:
        dependency-type: development
        patterns:
          - '*'
""",
)

# ---------------------------------------------------------------------------
# Expo/native configuration: build-time fonts + no exact-alarm special access
# ---------------------------------------------------------------------------
app_path = ROOT / "app.json"
app = json.loads(app_path.read_text(encoding="utf-8"))
android = app["expo"]["android"]
android.pop("permissions", None)
android["blockedPermissions"] = ["android.permission.SCHEDULE_EXACT_ALARM"]
plugins = app["expo"]["plugins"]
font_plugin = [
    "expo-font",
    {
        "fonts": [
            "node_modules/@expo-google-fonts/manrope/500Medium/Manrope_500Medium.ttf",
            "node_modules/@expo-google-fonts/manrope/600SemiBold/Manrope_600SemiBold.ttf",
            "node_modules/@expo-google-fonts/manrope/700Bold/Manrope_700Bold.ttf",
            "node_modules/@expo-google-fonts/manrope/800ExtraBold/Manrope_800ExtraBold.ttf",
        ]
    },
]
if not any(item == "expo-font" or (isinstance(item, list) and item[0] == "expo-font") for item in plugins):
    plugins.insert(2, font_plugin)
app_path.write_text(json.dumps(app, indent=2) + "\n", encoding="utf-8")

write(
    "src/app/_layout.tsx",
    """import type { ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StrictMode } from 'react';
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { ThemeProvider } from '@/design-system/theme/ThemeProvider';
import { AppLockProvider } from '@/features/app-lock/AppLockProvider';
import { OnboardingProvider } from '@/features/onboarding/OnboardingProvider';
import { I18nProvider } from '@/i18n/I18nProvider';
import { RootNavigator } from '@/navigation/RootNavigator';
import { configureNotificationHandling } from '@/platform/notifications/weeklyReflection';
import { RootErrorScreen } from '@/shared/components/RootErrorScreen';
import { ignoreError } from '@/shared/utils/function';

SplashScreen.preventAutoHideAsync().catch(ignoreError);
configureNotificationHandling().catch(ignoreError);

export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return <RootErrorScreen onRetry={retry} />;
}

export default function RootLayout() {
  return (
    <StrictMode>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <ThemeProvider>
          <I18nProvider>
            <OnboardingProvider>
              <AppLockProvider>
                <RootNavigator />
              </AppLockProvider>
            </OnboardingProvider>
          </I18nProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </StrictMode>
  );
}
""",
)

replace_once(
    "src/design-system/tokens/theme.ts",
    "import type { TextStyle } from 'react-native';",
    "import { Platform, type TextStyle } from 'react-native';",
)
replace_once(
    "src/design-system/tokens/theme.ts",
    """export const fontFamilies = {
  medium: 'Manrope_500Medium',
  semiBold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extraBold: 'Manrope_800ExtraBold',
} as const;
""",
    """function selectFontFamily(android: string, ios: string): string {
  return Platform.OS === 'ios' ? ios : android;
}

export const fontFamilies = {
  medium: selectFontFamily('Manrope_500Medium', 'Manrope-Medium'),
  semiBold: selectFontFamily('Manrope_600SemiBold', 'Manrope-SemiBold'),
  bold: selectFontFamily('Manrope_700Bold', 'Manrope-Bold'),
  extraBold: selectFontFamily('Manrope_800ExtraBold', 'Manrope-ExtraBold'),
} as const;
""",
)

native_verifier = read("scripts/verify-native-config.js")
native_verifier = native_verifier.replace(
    """function assertMatches(value, expected, label) {
  if (!expected.test(value)) {
    throw new Error(`${label} is missing expected configuration.`);
  }
}
""",
    """function assertMatches(value, expected, label) {
  if (!expected.test(value)) {
    throw new Error(`${label} is missing expected configuration.`);
  }
}

function assertNotIncludes(value, unexpected, label) {
  if (value.includes(unexpected)) {
    throw new Error(`${label} includes forbidden configuration: ${unexpected}`);
  }
}
""",
)
native_verifier = native_verifier.replace(
    """assertIncludes(
  androidManifest,
  'android.permission.SCHEDULE_EXACT_ALARM',
  'Android app manifest',
);
""",
    """assertNotIncludes(
  androidManifest,
  'android.permission.SCHEDULE_EXACT_ALARM',
  'Android app manifest',
);
""",
)
write("scripts/verify-native-config.js", native_verifier)

# ---------------------------------------------------------------------------
# Stable Expo Router JavaScript tabs
# ---------------------------------------------------------------------------
write(
    "src/navigation/tabs.ts",
    """import type { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import type { TranslationKey } from '@/i18n/catalog';

type SymbolName = ComponentProps<typeof SymbolView>['name'];

export type AppTabName = 'home' | 'history' | 'capture' | 'growth' | 'review';

export type TabDefinition = {
  name: AppTabName;
  labelKey: TranslationKey;
  shortLabelKey?: TranslationKey;
  icon: SymbolName;
  capture?: boolean;
};

export const tabs = [
  {
    name: 'home',
    labelKey: 'tabs.home',
    icon: { ios: 'house.fill', android: 'home', web: 'home' },
  },
  {
    name: 'history',
    labelKey: 'tabs.history',
    icon: { ios: 'clock.arrow.circlepath', android: 'history', web: 'history' },
  },
  {
    name: 'capture',
    labelKey: 'tabs.logWork',
    shortLabelKey: 'tabs.log',
    icon: { ios: 'plus', android: 'add', web: 'add' },
    capture: true,
  },
  {
    name: 'growth',
    labelKey: 'tabs.growth',
    icon: {
      ios: 'chart.line.uptrend.xyaxis',
      android: 'trending_up',
      web: 'trending_up',
    },
  },
  {
    name: 'review',
    labelKey: 'tabs.review',
    icon: { ios: 'doc.text.fill', android: 'description', web: 'description' },
  },
] as const satisfies ReadonlyArray<TabDefinition>;
""",
)

write(
    "src/navigation/AppTabs.tsx",
    """import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing } from '@/design-system/tokens/theme';
import { useI18n } from '@/i18n/I18nProvider';
import { tabs } from '@/navigation/tabs';

export function AppTabs() {
  const { theme } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, spacing[2]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: theme.colors.surface },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarHideOnKeyboard: true,
        tabBarLabelPosition: 'below-icon',
        tabBarItemStyle: styles.tabItem,
        tabBarLabelStyle: theme.typography.caption,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
            height: 64 + bottomPadding,
            paddingBottom: bottomPadding,
          },
        ],
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: t(tab.labelKey),
            tabBarAccessibilityLabel: t(tab.labelKey),
            tabBarLabel: t(tab.shortLabelKey ?? tab.labelKey),
            tabBarIcon: ({ color }) =>
              tab.capture ? (
                <View
                  style={[
                    styles.captureButton,
                    {
                      backgroundColor: theme.colors.primary,
                      borderColor: theme.colors.surface,
                    },
                  ]}
                >
                  <SymbolView
                    name={tab.icon}
                    size={26}
                    tintColor={theme.colors.onPrimary}
                  />
                </View>
              ) : (
                <SymbolView name={tab.icon} size={22} tintColor={color} />
              ),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing[2],
  },
  tabItem: {
    minHeight: 52,
    overflow: 'visible',
  },
  captureButton: {
    alignItems: 'center',
    borderRadius: radii.full,
    borderWidth: 5,
    height: 58,
    justifyContent: 'center',
    marginTop: -20,
    width: 58,
  },
});
""",
)

delete("src/navigation/AppTabButton.tsx")

# ---------------------------------------------------------------------------
# Reminder simplification: ordinary local notifications only
# ---------------------------------------------------------------------------
model = read("src/features/onboarding/model.ts")
model = model.replace("import type { ReminderPrecision } from '@/domain/reminder/model';\n\n", "")
model = model.replace("  weeklyReminderPrecision: ReminderPrecision | null;\n", "")
model = model.replace("  | 'weeklyReminderPrecision'\n", "")
model = model.replace("  weeklyReminderPrecision: null,\n", "")
write("src/features/onboarding/model.ts", model)

delete("src/domain/reminder/model.ts")
delete("src/platform/notifications/exactAlarmAccess.ts")
delete("src/features/reminder/InexactReminderNotice.tsx")
delete("modules/kerjalog-alarm-permissions")
delete("tests/exact-alarm-access.test.ts")
delete("tests/inexact-reminder-notice.test.tsx")

write(
    "src/features/onboarding/reminderSchedule.ts",
    """import type {
  ReminderWeekday,
  WeeklyReminderSchedule,
} from '@/features/onboarding/model';
import type { TranslationKey } from '@/i18n/catalog';
import type { Language } from '@/i18n/I18nProvider';

export const reminderWeekdayTranslationKeys: Record<
  ReminderWeekday,
  TranslationKey
> = {
  1: 'weekday.sunday',
  2: 'weekday.monday',
  3: 'weekday.tuesday',
  4: 'weekday.wednesday',
  5: 'weekday.thursday',
  6: 'weekday.friday',
  7: 'weekday.saturday',
};

const REMINDER_PICKER_ANCHOR = { year: 2000, month: 0, day: 1 } as const;

export function createReminderTimeDate(
  schedule: WeeklyReminderSchedule,
  baseDate?: Date,
): Date {
  if (!baseDate) {
    return new Date(
      REMINDER_PICKER_ANCHOR.year,
      REMINDER_PICKER_ANCHOR.month,
      REMINDER_PICKER_ANCHOR.day,
      schedule.hour,
      schedule.minute,
      0,
      0,
    );
  }

  const date = new Date(baseDate);
  date.setHours(schedule.hour, schedule.minute, 0, 0);
  return date;
}

export function withReminderTime(
  schedule: WeeklyReminderSchedule,
  date: Date,
): WeeklyReminderSchedule {
  return {
    ...schedule,
    hour: date.getHours(),
    minute: date.getMinutes(),
  };
}

export function formatReminderTime(
  schedule: WeeklyReminderSchedule,
  language: Language,
): string {
  const locale = language === 'id' ? 'id-ID' : 'en-US';

  try {
    return new Intl.DateTimeFormat(locale, {
      hour: 'numeric',
      minute: '2-digit',
    }).format(createReminderTimeDate(schedule));
  } catch {
    return `${String(schedule.hour).padStart(2, '0')}:${String(
      schedule.minute,
    ).padStart(2, '0')}`;
  }
}
""",
)

write(
    "src/platform/notifications/weeklyReflection.ts",
    """import { isRunningInExpoGo } from 'expo';
import type { NotificationPermissionsStatus } from 'expo-notifications';
import { Platform } from 'react-native';
import type { WeeklyReminderSchedule } from '@/features/onboarding/model';

const WEEKLY_REFLECTION_CHANNEL_ID = 'weekly-reflection';
const WEEKLY_REFLECTION_NOTIFICATION_ID = 'kerjalog-weekly-reflection';

type NotificationsModule = typeof import('expo-notifications');

export type WeeklyReflectionEnableResult =
  | 'enabled'
  | 'permission-denied'
  | 'unsupported-runtime';

export type WeeklyReflectionNotificationStatus =
  | 'enabled'
  | 'disabled'
  | 'unsupported-runtime';

export type WeeklyReflectionNotificationCopy = {
  title: string;
  body: string;
  channelName: string;
};

export type WeeklyReflectionNotificationRequest = {
  schedule: WeeklyReminderSchedule;
  copy: WeeklyReflectionNotificationCopy;
};

function isUnsupportedNotificationRuntime(): boolean {
  return Platform.OS === 'android' && isRunningInExpoGo();
}

function loadNotifications(): NotificationsModule | null {
  if (isUnsupportedNotificationRuntime()) {
    return null;
  }

  return require('expo-notifications') as NotificationsModule;
}

function isNotificationPermissionGranted(
  permissions: NotificationPermissionsStatus,
  notifications: NotificationsModule,
): boolean {
  return (
    permissions.granted ||
    permissions.ios?.status === notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

async function ensureAndroidNotificationChannel(
  notifications: NotificationsModule,
  channelName: string,
) {
  if (Platform.OS !== 'android') {
    return;
  }

  await notifications.setNotificationChannelAsync(
    WEEKLY_REFLECTION_CHANNEL_ID,
    {
      name: channelName,
      importance: notifications.AndroidImportance.DEFAULT,
    },
  );
}

async function requestNotificationPermissionIfNeeded(
  notifications: NotificationsModule,
): Promise<boolean> {
  const existingPermissions = await notifications.getPermissionsAsync();

  if (isNotificationPermissionGranted(existingPermissions, notifications)) {
    return true;
  }

  if (!existingPermissions.canAskAgain) {
    return false;
  }

  const requestedPermissions = await notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: false,
      allowSound: false,
    },
  });

  return isNotificationPermissionGranted(requestedPermissions, notifications);
}

export async function configureNotificationHandling(): Promise<void> {
  const notifications = loadNotifications();

  if (!notifications) {
    return;
  }

  notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function getWeeklyReflectionNotificationStatus(): Promise<WeeklyReflectionNotificationStatus> {
  const notifications = loadNotifications();

  if (!notifications) {
    return 'unsupported-runtime';
  }

  const permissions = await notifications.getPermissionsAsync();

  if (!isNotificationPermissionGranted(permissions, notifications)) {
    return 'disabled';
  }

  const scheduledNotifications =
    await notifications.getAllScheduledNotificationsAsync();
  const isScheduled = scheduledNotifications.some(
    (request) => request.identifier === WEEKLY_REFLECTION_NOTIFICATION_ID,
  );

  return isScheduled ? 'enabled' : 'disabled';
}

export async function enableWeeklyReflectionNotification({
  schedule,
  copy,
}: WeeklyReflectionNotificationRequest): Promise<WeeklyReflectionEnableResult> {
  const notifications = loadNotifications();

  if (!notifications) {
    return 'unsupported-runtime';
  }

  await ensureAndroidNotificationChannel(notifications, copy.channelName);

  const permissionGranted =
    await requestNotificationPermissionIfNeeded(notifications);

  if (!permissionGranted) {
    return 'permission-denied';
  }

  await notifications.cancelScheduledNotificationAsync(
    WEEKLY_REFLECTION_NOTIFICATION_ID,
  );

  await notifications.scheduleNotificationAsync({
    identifier: WEEKLY_REFLECTION_NOTIFICATION_ID,
    content: {
      title: copy.title,
      body: copy.body,
    },
    trigger: {
      type: notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: schedule.weekday,
      hour: schedule.hour,
      minute: schedule.minute,
      ...(Platform.OS === 'android'
        ? { channelId: WEEKLY_REFLECTION_CHANNEL_ID }
        : {}),
    },
  });

  return 'enabled';
}

export async function disableWeeklyReflectionNotification(): Promise<void> {
  const notifications = loadNotifications();

  if (!notifications) {
    return;
  }

  await notifications.cancelScheduledNotificationAsync(
    WEEKLY_REFLECTION_NOTIFICATION_ID,
  );
}
""",
)

write(
    "src/features/onboarding/useWeeklyReminderController.ts",
    """import { useReducer } from 'react';
import type {
  OnboardingPatch,
  OnboardingState,
  WeeklyReminderSchedule,
} from '@/features/onboarding/model';
import {
  INITIAL_REMINDER_FEEDBACK_STATE,
  type NotificationReminderIssue,
  reminderFeedbackReducer,
} from '@/features/onboarding/reminderFeedback';
import { useI18n } from '@/i18n/I18nProvider';
import {
  disableWeeklyReflectionNotification,
  enableWeeklyReflectionNotification,
  type WeeklyReflectionEnableResult,
} from '@/platform/notifications/weeklyReflection';

const reminderIssueByResult: Record<
  Extract<
    WeeklyReflectionEnableResult,
    'permission-denied' | 'unsupported-runtime'
  >,
  NotificationReminderIssue
> = {
  'permission-denied': 'permission',
  'unsupported-runtime': 'runtime',
};

type UpdateOnboarding = (patch: OnboardingPatch) => void;

export function useWeeklyReminderController(
  state: OnboardingState,
  update: UpdateOnboarding,
) {
  const { t } = useI18n();
  const [feedback, dispatchFeedback] = useReducer(
    reminderFeedbackReducer,
    INITIAL_REMINDER_FEEDBACK_STATE,
  );

  const enableForSchedule = async (schedule: WeeklyReminderSchedule) =>
    enableWeeklyReflectionNotification({
      schedule,
      copy: {
        title: t('onboarding.review.notificationTitle'),
        body: t('onboarding.review.notificationBody'),
        channelName: t('onboarding.review.notificationChannelName'),
      },
    });

  const applyEnableResult = (result: WeeklyReflectionEnableResult) => {
    if (result === 'enabled') {
      update({ weeklyReminderEnabled: true });
      dispatchFeedback({ type: 'success' });
      return;
    }

    update({ weeklyReminderEnabled: false });
    dispatchFeedback({
      type: 'failure',
      issue: reminderIssueByResult[result],
    });
  };

  const setEnabled = async (enabled: boolean) => {
    dispatchFeedback({ type: 'start' });

    try {
      if (!enabled) {
        await disableWeeklyReflectionNotification();
        update({ weeklyReminderEnabled: false });
        dispatchFeedback({ type: 'success' });
        return;
      }

      const result = await enableForSchedule(state.weeklyReminderSchedule);
      applyEnableResult(result);
    } catch {
      update({ weeklyReminderEnabled: false });
      dispatchFeedback({ type: 'failure', issue: 'setup' });
    }
  };

  const setSchedule = async (schedule: WeeklyReminderSchedule) => {
    update({ weeklyReminderSchedule: schedule });

    if (!state.weeklyReminderEnabled) {
      return;
    }

    dispatchFeedback({ type: 'start' });

    try {
      const result = await enableForSchedule(schedule);
      applyEnableResult(result);
    } catch {
      update({ weeklyReminderEnabled: false });
      dispatchFeedback({ type: 'failure', issue: 'setup' });
    }
  };

  return {
    feedback,
    setEnabled,
    setSchedule,
  };
}
""",
)

write(
    "src/features/onboarding/useOnboardingController.ts",
    """import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import {
  DEFAULT_ONBOARDING_STATE,
  hasRequiredOnboardingAnswers,
  ONBOARDING_STEP_ORDER,
  type OnboardingPatch,
  type OnboardingState,
} from '@/features/onboarding/model';
import {
  loadOnboardingState,
  saveOnboardingState,
} from '@/features/onboarding/storage';
import { getWeeklyReflectionNotificationStatus } from '@/platform/notifications/weeklyReflection';
import { ignoreError } from '@/shared/utils/function';

export type OnboardingContextValue = {
  state: OnboardingState;
  isHydrated: boolean;
  currentStepIndex: number;
  update: (patch: OnboardingPatch) => void;
  goNext: () => void;
  goBack: () => void;
  complete: () => Promise<void>;
};

export function useOnboardingController(): OnboardingContextValue {
  const [state, setState] = useState<OnboardingState>(DEFAULT_ONBOARDING_STATE);
  const [isHydrated, setIsHydrated] = useState(false);
  const writeQueueRef = useRef<Promise<void>>(Promise.resolve());
  const skipNextAutosaveRef = useRef(true);

  useEffect(() => {
    let ignore = false;

    const hydrateOnboarding = async () => {
      const storedState = await loadOnboardingState();

      if (ignore) {
        return;
      }

      setState(storedState);
      setIsHydrated(true);
    };

    hydrateOnboarding().catch(ignoreError);

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (skipNextAutosaveRef.current) {
      skipNextAutosaveRef.current = false;
      return;
    }

    const snapshot = state;

    writeQueueRef.current = writeQueueRef.current
      .catch(ignoreError)
      .then(() => saveOnboardingState(snapshot))
      .catch(ignoreError);
  }, [isHydrated, state]);

  useEffect(() => {
    if (!isHydrated || !state.weeklyReminderEnabled) {
      return;
    }

    let ignore = false;
    let isReconciling = false;

    const reconcileReminderState = async () => {
      if (isReconciling) {
        return;
      }

      isReconciling = true;

      try {
        const status = await getWeeklyReflectionNotificationStatus();

        if (ignore || status === 'unsupported-runtime' || status === 'enabled') {
          return;
        }

        setState((current) =>
          current.weeklyReminderEnabled
            ? { ...current, weeklyReminderEnabled: false }
            : current,
        );
      } catch {
        if (!ignore) {
          setState((current) => ({
            ...current,
            weeklyReminderEnabled: false,
          }));
        }
      } finally {
        isReconciling = false;
      }
    };

    reconcileReminderState().catch(ignoreError);

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        reconcileReminderState().catch(ignoreError);
      }
    });

    return () => {
      ignore = true;
      subscription.remove();
    };
  }, [isHydrated, state.weeklyReminderEnabled]);

  const currentStepIndex = Math.max(
    0,
    ONBOARDING_STEP_ORDER.indexOf(state.currentStep),
  );

  const update = (patch: OnboardingPatch) => {
    setState((current) => ({ ...current, ...patch }));
  };

  const goNext = () => {
    setState((current) => {
      const index = ONBOARDING_STEP_ORDER.indexOf(current.currentStep);
      const nextIndex = Math.min(index + 1, ONBOARDING_STEP_ORDER.length - 1);
      const nextStep = ONBOARDING_STEP_ORDER[nextIndex] ?? current.currentStep;

      return {
        ...current,
        currentStep: nextStep,
      };
    });
  };

  const goBack = () => {
    setState((current) => {
      const index = ONBOARDING_STEP_ORDER.indexOf(current.currentStep);
      const previousIndex = Math.max(index - 1, 0);
      const previousStep =
        ONBOARDING_STEP_ORDER[previousIndex] ?? current.currentStep;

      return {
        ...current,
        currentStep: previousStep,
      };
    });
  };

  const complete = async () => {
    if (!hasRequiredOnboardingAnswers(state)) {
      throw new Error('Cannot complete onboarding without required answers.');
    }

    const completedState: OnboardingState = {
      ...state,
      completed: true,
      currentStep: 'review-rhythm',
    };

    await writeQueueRef.current;
    await saveOnboardingState(completedState);

    skipNextAutosaveRef.current = true;
    setState(completedState);
  };

  return {
    state,
    isHydrated,
    currentStepIndex,
    update,
    goNext,
    goBack,
    complete,
  };
}
""",
)

storage = read("src/features/onboarding/storage.ts")
storage = storage.replace("import { isReminderPrecision } from '@/domain/reminder/model';\n", "")
storage = re.sub(
    r"\n    weeklyReminderPrecision:\n      weeklyReminderEnabled &&\n      isReminderPrecision\(value\.weeklyReminderPrecision\)\n        \? value\.weeklyReminderPrecision\n        : null,",
    "",
    storage,
)
write("src/features/onboarding/storage.ts", storage)

review = read("src/features/onboarding/components/ReviewRhythmStep.tsx")
review = review.replace(
    "import { InexactReminderNotice } from '@/features/reminder/InexactReminderNotice';\n",
    "",
)
review = re.sub(
    r"\n        \{state\.weeklyReminderEnabled &&\n        state\.weeklyReminderPrecision === 'inexact' \? \(\n          <InexactReminderNotice />\n        \) : null\}",
    "",
    review,
)
write("src/features/onboarding/components/ReviewRhythmStep.tsx", review)

home = read("src/features/home/HomeScreen.tsx")
home = home.replace(
    "import { InexactReminderNotice } from '@/features/reminder/InexactReminderNotice';\n",
    "",
)
home = re.sub(
    r"\n        \{state\.weeklyReminderEnabled &&\n        state\.weeklyReminderPrecision === 'inexact' \? \(\n          <InexactReminderNotice />\n        \) : null\}",
    "",
    home,
)
write("src/features/home/HomeScreen.tsx", home)

reminder_translations = read("src/i18n/reminderTranslations.ts")
reminder_translations = re.sub(
    r"\n  'reminder\.inexact\.title':[^\n]*\n"
    r"  'reminder\.inexact\.description':\n"
    r"    '[^\n]*',\n"
    r"  'reminder\.inexact\.useExact':[^\n]*",
    "",
    reminder_translations,
)
write("src/i18n/reminderTranslations.ts", reminder_translations)

# ---------------------------------------------------------------------------
# React ref cleanup + wizard accessibility
# ---------------------------------------------------------------------------
persisted = read("src/features/work-entry/usePersistedLogDraft.ts")
persisted = persisted.replace(
    "  useEffectEvent,\n  useRef,\n  useState,",
    "  useEffectEvent,\n  useState,",
)
persisted = re.sub(
    r"\n  const mountedRef = useRef\(false\);\n\n"
    r"  useEffect\(\(\) => \{\n"
    r"    mountedRef\.current = true;\n\n"
    r"    return \(\) => \{\n"
    r"      mountedRef\.current = false;\n"
    r"    \};\n"
    r"  \}, \[\]\);\n",
    "\n",
    persisted,
)
persisted = persisted.replace(
    """        if (mountedRef.current) {
          setHasPersistenceError(false);
        }
""",
    "        setHasPersistenceError(false);\n",
)
persisted = persisted.replace(
    """        if (mountedRef.current) {
          setHasPersistenceError(true);
        }
""",
    "        setHasPersistenceError(true);\n",
)
write("src/features/work-entry/usePersistedLogDraft.ts", persisted)

replace_once(
    "src/features/work-entry/components/logStepTypes.ts",
    "  totalSteps: number;\n  onBack: () => void;",
    "  totalSteps: number;\n  progressLabel: string;\n  onBack: () => void;",
)

log_header = read("src/features/work-entry/components/LogHeader.tsx")
log_header = log_header.replace(
    "  totalSteps: number;\n};",
    "  totalSteps: number;\n  progressLabel: string;\n};",
)
log_header = log_header.replace(
    "  totalSteps,\n}: LogHeaderProps)",
    "  totalSteps,\n  progressLabel,\n}: LogHeaderProps)",
)
log_header = log_header.replace(
    """      <View
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 1, max: totalSteps, now: currentStep }}
""",
    """      <View
        accessibilityLabel={progressLabel}
        accessibilityRole="progressbar"
        accessibilityValue={{
          min: 1,
          max: totalSteps,
          now: currentStep,
          text: progressLabel,
        }}
""",
)
write("src/features/work-entry/components/LogHeader.tsx", log_header)

replace_once(
    "src/features/work-entry/LogFlowScreen.tsx",
    """    currentStep: flow.currentStep,
    totalSteps: flow.totalSteps,
    onBack: flow.goBack,
""",
    """    currentStep: flow.currentStep,
    totalSteps: flow.totalSteps,
    progressLabel: t('log.step', {
      current: flow.currentStep,
      total: flow.totalSteps,
    }),
    onBack: flow.goBack,
""",
)
replace_once(
    "src/features/work-entry/refinement/EditEntryScreen.tsx",
    """    currentStep: refinement.currentStep,
    totalSteps: refinement.totalSteps,
    onBack: handleBack,
""",
    """    currentStep: refinement.currentStep,
    totalSteps: refinement.totalSteps,
    progressLabel: t('log.step', {
      current: refinement.currentStep,
      total: refinement.totalSteps,
    }),
    onBack: handleBack,
""",
)

# ---------------------------------------------------------------------------
# Tests for simplified reminders and deterministic render behavior
# ---------------------------------------------------------------------------
write(
    "tests/weekly-reflection-notifications.test.ts",
    """import * as Notifications from 'expo-notifications';
import {
  disableWeeklyReflectionNotification,
  enableWeeklyReflectionNotification,
  getWeeklyReflectionNotificationStatus,
} from '@/platform/notifications/weeklyReflection';

const getPermissionsAsync = jest.mocked(Notifications.getPermissionsAsync);
const requestPermissionsAsync = jest.mocked(
  Notifications.requestPermissionsAsync,
);
const getAllScheduledNotificationsAsync = jest.mocked(
  Notifications.getAllScheduledNotificationsAsync,
);
const cancelScheduledNotificationAsync = jest.mocked(
  Notifications.cancelScheduledNotificationAsync,
);
const scheduleNotificationAsync = jest.mocked(
  Notifications.scheduleNotificationAsync,
);

const copy = {
  title: 'A gentle weekly check-in',
  body: 'What moved forward this week?',
  channelName: 'Weekly reflection',
};

const defaultSchedule = {
  weekday: 6 as const,
  hour: 16,
  minute: 30,
};

describe('weekly reflection notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getAllScheduledNotificationsAsync.mockResolvedValue([]);
    cancelScheduledNotificationAsync.mockResolvedValue(undefined);
    scheduleNotificationAsync.mockResolvedValue('kerjalog-weekly-reflection');
  });

  test('requests permission just in time and schedules the selected weekly time', async () => {
    getPermissionsAsync.mockResolvedValue({
      granted: false,
      canAskAgain: true,
    } as Notifications.NotificationPermissionsStatus);
    requestPermissionsAsync.mockResolvedValue({
      granted: true,
      canAskAgain: true,
    } as Notifications.NotificationPermissionsStatus);

    const schedule = {
      weekday: 3 as const,
      hour: 18,
      minute: 15,
    };

    await expect(
      enableWeeklyReflectionNotification({ schedule, copy }),
    ).resolves.toBe('enabled');

    expect(requestPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: 'kerjalog-weekly-reflection',
        content: {
          title: copy.title,
          body: copy.body,
        },
        trigger: expect.objectContaining({
          type: 'weekly',
          weekday: schedule.weekday,
          hour: schedule.hour,
          minute: schedule.minute,
        }),
      }),
    );
  });

  test('does not schedule when notification permission cannot be granted', async () => {
    getPermissionsAsync.mockResolvedValue({
      granted: false,
      canAskAgain: false,
    } as Notifications.NotificationPermissionsStatus);

    await expect(
      enableWeeklyReflectionNotification({ schedule: defaultSchedule, copy }),
    ).resolves.toBe('permission-denied');

    expect(requestPermissionsAsync).not.toHaveBeenCalled();
    expect(scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  test('reports a persisted reminder as disabled when notification permission is gone', async () => {
    getPermissionsAsync.mockResolvedValue({
      granted: false,
      canAskAgain: false,
    } as Notifications.NotificationPermissionsStatus);

    await expect(getWeeklyReflectionNotificationStatus()).resolves.toBe(
      'disabled',
    );

    expect(getAllScheduledNotificationsAsync).not.toHaveBeenCalled();
  });

  test('reports a persisted reminder as disabled when its native schedule is gone', async () => {
    getPermissionsAsync.mockResolvedValue({
      granted: true,
      canAskAgain: true,
    } as Notifications.NotificationPermissionsStatus);
    getAllScheduledNotificationsAsync.mockResolvedValue([]);

    await expect(getWeeklyReflectionNotificationStatus()).resolves.toBe(
      'disabled',
    );
  });

  test('reports a persisted reminder as enabled while its native schedule exists', async () => {
    getPermissionsAsync.mockResolvedValue({
      granted: true,
      canAskAgain: true,
    } as Notifications.NotificationPermissionsStatus);
    getAllScheduledNotificationsAsync.mockResolvedValue([
      {
        identifier: 'kerjalog-weekly-reflection',
        content: {},
        trigger: null,
      },
    ] as Notifications.NotificationRequest[]);

    await expect(getWeeklyReflectionNotificationStatus()).resolves.toBe(
      'enabled',
    );
  });

  test('cancels the scheduled weekly reminder when disabled', async () => {
    await disableWeeklyReflectionNotification();

    expect(cancelScheduledNotificationAsync).toHaveBeenCalledWith(
      'kerjalog-weekly-reflection',
    );
  });
});
""",
)

write(
    "tests/weekly-reminder-controller.test.tsx",
    """import { act, renderHook } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import type { PropsWithChildren } from 'react';
import { DEFAULT_ONBOARDING_STATE } from '@/features/onboarding/model';
import { useWeeklyReminderController } from '@/features/onboarding/useWeeklyReminderController';
import { I18nProvider } from '@/i18n/I18nProvider';

const getPermissionsAsync = jest.mocked(Notifications.getPermissionsAsync);
const cancelScheduledNotificationAsync = jest.mocked(
  Notifications.cancelScheduledNotificationAsync,
);
const scheduleNotificationAsync = jest.mocked(
  Notifications.scheduleNotificationAsync,
);

function wrapper({ children }: PropsWithChildren) {
  return <I18nProvider>{children}</I18nProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
  cancelScheduledNotificationAsync.mockResolvedValue(undefined);
  scheduleNotificationAsync.mockResolvedValue('kerjalog-weekly-reflection');
});

describe('weekly reminder controller', () => {
  test('editing the schedule while disabled only stores the preference', async () => {
    const update = jest.fn();
    const nextSchedule = {
      weekday: 2 as const,
      hour: 9,
      minute: 15,
    };
    const { result } = await renderHook(
      () => useWeeklyReminderController(DEFAULT_ONBOARDING_STATE, update),
      { wrapper },
    );

    await act(async () => {
      await result.current.setSchedule(nextSchedule);
    });

    expect(update).toHaveBeenCalledWith({
      weeklyReminderSchedule: nextSchedule,
    });
    expect(getPermissionsAsync).not.toHaveBeenCalled();
    expect(scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  test('editing an enabled reminder reschedules and keeps it enabled', async () => {
    getPermissionsAsync.mockResolvedValue({
      granted: true,
      canAskAgain: true,
    } as Notifications.NotificationPermissionsStatus);

    const update = jest.fn();
    const state = {
      ...DEFAULT_ONBOARDING_STATE,
      weeklyReminderEnabled: true,
    };
    const nextSchedule = {
      weekday: 4 as const,
      hour: 17,
      minute: 45,
    };
    const { result } = await renderHook(
      () => useWeeklyReminderController(state, update),
      { wrapper },
    );

    await act(async () => {
      await result.current.setSchedule(nextSchedule);
    });

    expect(update).toHaveBeenNthCalledWith(1, {
      weeklyReminderSchedule: nextSchedule,
    });
    expect(update).toHaveBeenNthCalledWith(2, {
      weeklyReminderEnabled: true,
    });
    expect(scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        trigger: expect.objectContaining({
          weekday: 4,
          hour: 17,
          minute: 45,
        }),
      }),
    );
    expect(result.current.feedback).toEqual({
      issue: null,
      isUpdating: false,
    });
  });

  test('failed rescheduling preserves the desired schedule but disables the reminder', async () => {
    getPermissionsAsync.mockResolvedValue({
      granted: true,
      canAskAgain: true,
    } as Notifications.NotificationPermissionsStatus);
    scheduleNotificationAsync.mockRejectedValueOnce(
      new Error('native scheduler unavailable'),
    );

    const update = jest.fn();
    const state = {
      ...DEFAULT_ONBOARDING_STATE,
      weeklyReminderEnabled: true,
    };
    const nextSchedule = {
      weekday: 7 as const,
      hour: 10,
      minute: 0,
    };
    const { result } = await renderHook(
      () => useWeeklyReminderController(state, update),
      { wrapper },
    );

    await act(async () => {
      await result.current.setSchedule(nextSchedule);
    });

    expect(update).toHaveBeenNthCalledWith(1, {
      weeklyReminderSchedule: nextSchedule,
    });
    expect(update).toHaveBeenNthCalledWith(2, {
      weeklyReminderEnabled: false,
    });
    expect(result.current.feedback).toEqual({
      issue: 'setup',
      isUpdating: false,
    });
  });
});
""",
)

onboarding_provider = read("tests/onboarding-provider.test.tsx")
onboarding_provider = onboarding_provider.replace(
    "import { getWeeklyReminderPrecision } from '@/platform/notifications/exactAlarmAccess';\n\n"
    "jest.mock('@/platform/notifications/exactAlarmAccess', () => ({\n"
    "  getWeeklyReminderPrecision: jest.fn(),\n"
    "}));\n\n"
    "const getWeeklyReminderPrecisionMock = jest.mocked(getWeeklyReminderPrecision);\n",
    "",
)
onboarding_provider = onboarding_provider.replace(
    "  getWeeklyReminderPrecisionMock.mockReturnValue('exact');\n",
    "",
)
onboarding_provider = onboarding_provider.replace(
    "        weeklyReminderPrecision: 'exact',\n",
    "",
)
onboarding_provider = onboarding_provider.replace(
    "\n    expect(result.current.state.weeklyReminderPrecision).toBeNull();\n",
    "\n",
)
onboarding_provider = onboarding_provider.replace(
    "        weeklyReminderEnabled: false,\n        weeklyReminderPrecision: null,",
    "        weeklyReminderEnabled: false,",
)
onboarding_provider = re.sub(
    r"\n  test\('re-arms an exact reminder as inexact when special access is revoked',[\s\S]*?\n  \}\);\n",
    "\n",
    onboarding_provider,
)
write("tests/onboarding-provider.test.tsx", onboarding_provider)

onboarding_storage = read("tests/onboarding-storage.test.ts")
onboarding_storage = onboarding_storage.replace(
    "  weeklyReminderPrecision: 'inexact',\n",
    "",
)
onboarding_storage = re.sub(
    r"\n  test\('treats a missing legacy reminder precision[\s\S]*?\n  \}\);\n",
    "\n",
    onboarding_storage,
)
onboarding_storage = re.sub(
    r"\n  test\('clears reminder precision[\s\S]*?\n  \}\);\n",
    "\n",
    onboarding_storage,
)
anchor = """  test('defaults a missing reminder schedule for older v1 state', async () => {
    const { weeklyReminderSchedule: _, ...legacyState } = COMPLETE_STATE;
    getItemMock.mockResolvedValueOnce(JSON.stringify(legacyState));

    const state = await loadOnboardingState();

    expect(state.weeklyReminderSchedule).toEqual(
      DEFAULT_WEEKLY_REMINDER_SCHEDULE,
    );
  });
"""
legacy_precision_test = """

  test('ignores the removed legacy reminder precision field', async () => {
    getItemMock.mockResolvedValueOnce(
      JSON.stringify({ ...COMPLETE_STATE, weeklyReminderPrecision: 'exact' }),
    );

    const state = await loadOnboardingState();

    expect(state).toEqual(COMPLETE_STATE);
    expect(state).not.toHaveProperty('weeklyReminderPrecision');
  });
"""
if anchor not in onboarding_storage:
    raise RuntimeError("Could not locate onboarding storage reminder schedule test")
onboarding_storage = onboarding_storage.replace(anchor, anchor + legacy_precision_test)
write("tests/onboarding-storage.test.ts", onboarding_storage)

foundation = read("tests/onboarding-foundation.test.ts")
foundation = foundation.replace(
    "    expect(DEFAULT_ONBOARDING_STATE.weeklyReminderPrecision).toBeNull();\n",
    "",
)
write("tests/onboarding-foundation.test.ts", foundation)

reminder_schedule_test = read("tests/reminder-schedule.test.ts")
insert_after = """describe('reminder schedule helpers', () => {
"""
purity_test = """  test('uses a deterministic anchor when a picker date is created during render', () => {
    const date = createReminderTimeDate(schedule);

    expect(date.getFullYear()).toBe(2000);
    expect(date.getMonth()).toBe(0);
    expect(date.getDate()).toBe(1);
    expect(date.getHours()).toBe(16);
    expect(date.getMinutes()).toBe(30);
    expect(date.getSeconds()).toBe(0);
    expect(date.getMilliseconds()).toBe(0);
  });

"""
if purity_test not in reminder_schedule_test:
    reminder_schedule_test = reminder_schedule_test.replace(
        insert_after,
        insert_after + purity_test,
        1,
    )
write("tests/reminder-schedule.test.ts", reminder_schedule_test)

# ---------------------------------------------------------------------------
# Remove stale copy and align architecture documentation
# ---------------------------------------------------------------------------
translations = read("src/i18n/translations.ts")
for prefix in ("placeholder.capture", "placeholder.history"):
    translations = re.sub(
        rf"\n  '{re.escape(prefix)}\.eyebrow':[^\n]*\n"
        rf"  '{re.escape(prefix)}\.title':[^\n]*\n"
        rf"  '{re.escape(prefix)}\.description':\n"
        rf"    '[^\n]*',",
        "",
        translations,
        count=2,
    )
write("src/i18n/translations.ts", translations)

readme = read("README.md")
readme = readme.replace(
    "SQLCipher, biometrics, notifications, screen privacy, and a local Expo module.",
    "SQLCipher, biometrics, notifications, and screen privacy.",
)
readme = readme.replace(
    """SQLite = persisted product data
Zustand = ephemeral UI/workflow state
TanStack Form = active form state
Network = optional, never required for core entry capture/read
""",
    """SQLite = persisted product data
React local/context state = component-local and app-shell UI state
TanStack Form = active form state
Zustand = shared cross-feature ephemeral state only if it genuinely emerges
Network = optional, never required for core entry capture/read
""",
)
write("README.md", readme)

architecture = read("docs/PRODUCT_AND_ARCHITECTURE.md")
exact_alarm_paragraph = """On Android 12+, precise user-selected reminder times may use the `SCHEDULE_EXACT_ALARM` special app access. Treat that access as an optional precision upgrade rather than a prerequisite for reminders: Expo SDK 57 falls back to an inexact `setAndAllowWhileIdle` alarm when exact access is unavailable. Keep the reminder enabled in that case, clearly tell the user that delivery is approximate, and offer **Alarms & reminders** settings only if they want exact timing. Persist the last observed reminder precision and reconcile it when the app starts or returns to the foreground so permission grants/revocations re-arm the native reminder in the correct mode. If notification permission or the native scheduled request itself is removed, reconcile the persisted ON/OFF state. Do not turn the reminder off merely because the current runtime cannot inspect native reminder state.
"""
replacement_reminder_paragraph = """Weekly reminders use ordinary local scheduled notifications. KerjaLog does not request Android exact-alarm special access because minute-level precision is not product-critical for a gentle reflection reminder. OS power management may delay delivery. If notification permission or the native scheduled request disappears, reconcile the persisted enabled state when the app starts or returns to the foreground. A runtime that cannot inspect native reminder state must not force the persisted reminder off.
"""
if exact_alarm_paragraph not in architecture:
    raise RuntimeError("Could not locate exact-alarm architecture paragraph")
architecture = architecture.replace(exact_alarm_paragraph, replacement_reminder_paragraph)
architecture = architecture.replace(
    """SQLite = persisted product data
Zustand = ephemeral UI/workflow state
TanStack Form = active form state
""",
    """SQLite = persisted product data
React local/context state = component-local and app-shell UI state
TanStack Form = active form state
Zustand = shared cross-feature ephemeral state only if it genuinely emerges
""",
)
architecture = architecture.replace(
    "| Ephemeral app state  | `zustand`                                       | Small UI/workflow state only                          |",
    "| Ephemeral app state  | React local/context state; Zustand only if needed | Keep local state local; add a store only for genuine shared cross-feature state |",
)
architecture = architecture.replace(
    "+ render-ref purity guard (`pnpm run react:refs:check`)",
    "+ official React Hooks/compiler-aware ESLint rules",
)
architecture = architecture.replace(
    "| Global state                | Zustand for ephemeral state only                         |",
    "| Global state                | None by default; Zustand only for genuine shared ephemeral state |",
)
write("docs/PRODUCT_AND_ARCHITECTURE.md", architecture)

release = read("docs/RELEASE_CHECKLIST.md")
release = release.replace(
    "- [ ] Render-phase ref purity checks and their fixtures pass.",
    "- [ ] Official React Hooks/compiler-aware ESLint rules pass with zero warnings.",
)
release = re.sub(
    r"## Android notifications and exact alarms\n[\s\S]*?\n## Accessibility and responsive UI",
    """## Android notifications

KerjaLog's weekly reflection is an ordinary local reminder and does not request exact-alarm special access.

- [ ] Test with notification permission granted and confirm the weekly request is scheduled.
- [ ] Test with notification permission denied/revoked and confirm the app reports the reminder as disabled without crashing.
- [ ] Change the reminder day/time and confirm the native scheduled request is replaced with the new schedule.
- [ ] Remove the native scheduled request and confirm foreground reconciliation updates persisted reminder state.
- [ ] Confirm AndroidManifest does not contain `SCHEDULE_EXACT_ALARM`; delayed delivery from OS power management is acceptable for this feature.

## Accessibility and responsive UI""",
    release,
)
write("docs/RELEASE_CHECKLIST.md", release)

print("Applied final review hardening source changes.")
