import { render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@/design-system/theme/ThemeProvider';
import { ReviewScreen } from '@/features/review/ReviewScreen';

let mockRouteParams: { create?: string; skillId?: string } = {};

jest.mock('@sentry/react-native', () => ({
  wrapExpoRouter: (value: unknown) => value,
  withProfiler: <T,>(component: T) => component,
}));

jest.mock('expo-router', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    useFocusEffect: (effect: import('react').EffectCallback) => {
      React.useEffect(effect, [effect]);
    },
    useLocalSearchParams: () => mockRouteParams,
    useRouter: () => ({ push: jest.fn(), setParams: jest.fn() }),
  };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0, left: 0, right: 0, top: 0 }),
}));

jest.mock('@/data/repositories/reviewRepository', () => ({
  reviewRepository: { listDrafts: jest.fn().mockResolvedValue([]) },
}));

jest.mock('@/data/repositories/portableBackupRepository', () => ({
  portableBackupRepository: {},
}));

jest.mock('@/platform/portability/portableBackupFile', () => ({
  portableBackupFile: {},
}));

jest.mock('@/features/onboarding/useOnboarding', () => ({
  useOnboarding: () => ({
    restoreImportedState: jest.fn(),
    state: {},
  }),
}));

jest.mock('@/i18n/I18nProvider', () => ({
  useI18n: () => ({
    language: 'en',
    restoreImportedLanguage: jest.fn(),
    t: (key: string) => key,
  }),
}));

jest.mock('@/features/review/ReviewSetupForm', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { Text } =
    jest.requireActual<typeof import('react-native')>('react-native');
  return {
    ReviewSetupForm: ({ skillId }: { skillId: string | undefined }) =>
      React.createElement(Text, { testID: 'review-setup' }, skillId ?? 'none'),
  };
});

describe('ReviewScreen', () => {
  beforeEach(() => {
    mockRouteParams = {};
  });

  test('opens setup immediately for a Growth skill handoff', async () => {
    mockRouteParams = { skillId: 'communication' };

    await render(
      <ThemeProvider>
        <ReviewScreen />
      </ThemeProvider>,
    );

    expect(await screen.findByTestId('review-setup')).toHaveTextContent(
      'communication',
    );
  });
});
