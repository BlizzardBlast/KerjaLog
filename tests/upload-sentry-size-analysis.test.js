const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  createUploadCommand,
  findArchive,
  readSentryPluginOptions,
  runAsBuildHook,
  shouldUploadSizeAnalysis,
} = require('../scripts/upload-sentry-size-analysis.cjs');

const temporaryDirectories = [];

function createTemporaryDirectory() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'kerjalog-sentry-'));
  temporaryDirectories.push(directory);
  return directory;
}

function writeArchive(directory, archivePath) {
  const target = path.join(directory, archivePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, 'archive');
  return target;
}

afterEach(() => {
  jest.restoreAllMocks();

  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { force: true, recursive: true });
  }
});

describe('Sentry Size Analysis upload hook', () => {
  test.each([
    [{ EAS_BUILD: 'true', EAS_BUILD_PROFILE: 'preview' }, true],
    [{ EAS_BUILD: 'true', EAS_BUILD_PROFILE: 'production' }, true],
    [{ EAS_BUILD: 'true', EAS_BUILD_PROFILE: 'development' }, false],
    [{ EAS_BUILD_PROFILE: 'preview' }, false],
  ])('runs only for supported EAS build profiles', (environment, expected) => {
    expect(shouldUploadSizeAnalysis(environment)).toBe(expected);
  });

  test('reads organization and project from Expo plugin configuration', () => {
    expect(
      readSentryPluginOptions({
        expo: {
          plugins: [
            [
              '@sentry/react-native/expo',
              { organization: 'org', project: 'app' },
            ],
          ],
        },
      }),
    ).toEqual({ organization: 'org', project: 'app' });
  });

  test('selects Android AAB and iOS IPA archives from EAS output paths', () => {
    const androidDirectory = createTemporaryDirectory();
    const androidArchive = writeArchive(
      androidDirectory,
      'android/app/build/outputs/bundle/release/app-release.aab',
    );
    const iosDirectory = createTemporaryDirectory();
    const iosArchive = writeArchive(iosDirectory, 'ios/build/App.ipa');

    expect(findArchive(androidDirectory, 'android')).toBe(androidArchive);
    expect(findArchive(iosDirectory, 'ios')).toBe(iosArchive);
  });

  test('fails when an expected archive is missing or ambiguous', () => {
    const missingDirectory = createTemporaryDirectory();
    const ambiguousDirectory = createTemporaryDirectory();
    writeArchive(
      ambiguousDirectory,
      'android/app/build/outputs/bundle/release/one.aab',
    );
    writeArchive(
      ambiguousDirectory,
      'android/app/build/outputs/bundle/release/two.aab',
    );

    expect(() => findArchive(missingDirectory, 'android')).toThrow(
      'Expected exactly one Android AAB',
    );
    expect(() => findArchive(ambiguousDirectory, 'android')).toThrow(
      'Expected exactly one Android AAB',
    );
    expect(() => findArchive(missingDirectory, 'ios')).toThrow(
      'Expected iOS IPA',
    );
  });

  test('creates a Sentry CLI build upload command', () => {
    expect(
      createUploadCommand({
        archivePath: '/tmp/app-release.aab',
        organization: 'org',
        project: 'app',
      }),
    ).toEqual({
      command: 'pnpm',
      arguments: [
        'exec',
        'sentry-cli',
        'build',
        'upload',
        '/tmp/app-release.aab',
        '--org',
        'org',
        '--project',
        'app',
        '--build-configuration',
        'Release',
      ],
    });
  });

  test('keeps Size Analysis failures non-blocking for successful EAS builds', () => {
    // Given
    const warn = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined);

    // When
    const uploaded = runAsBuildHook({
      environment: {
        EAS_BUILD: 'true',
        EAS_BUILD_PLATFORM: 'android',
        EAS_BUILD_PROFILE: 'preview',
      },
      projectRoot: createTemporaryDirectory(),
    });

    // Then
    expect(uploaded).toBe(false);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('SENTRY_AUTH_TOKEN is required'),
    );
  });
});
