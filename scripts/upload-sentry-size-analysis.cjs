const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const SIZE_ANALYSIS_BUILD_PROFILES = new Set(['preview', 'production']);
const SENTRY_EXPO_PLUGIN = '@sentry/react-native/expo';

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function shouldUploadSizeAnalysis(environment) {
  return (
    environment.EAS_BUILD === 'true' &&
    SIZE_ANALYSIS_BUILD_PROFILES.has(environment.EAS_BUILD_PROFILE)
  );
}

function readSentryPluginOptions(appConfig) {
  const plugins = appConfig?.expo?.plugins;

  if (!Array.isArray(plugins)) {
    throw new Error('Expected Expo plugin configuration in app.json.');
  }

  const sentryPlugin = plugins.find(
    (plugin) => Array.isArray(plugin) && plugin[0] === SENTRY_EXPO_PLUGIN,
  );

  if (!Array.isArray(sentryPlugin) || !isRecord(sentryPlugin[1])) {
    throw new Error(
      `Expected ${SENTRY_EXPO_PLUGIN} options with organization and project.`,
    );
  }

  const { organization, project } = sentryPlugin[1];

  if (typeof organization !== 'string' || typeof project !== 'string') {
    throw new Error(
      `Expected ${SENTRY_EXPO_PLUGIN} options with organization and project.`,
    );
  }

  return { organization, project };
}

function findAabArchives(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return findAabArchives(entryPath);
    }

    return entry.isFile() && entry.name.endsWith('.aab') ? [entryPath] : [];
  });
}

function findArchive(projectRoot, platform) {
  if (platform === 'android') {
    const archives = findAabArchives(
      path.join(projectRoot, 'android', 'app', 'build', 'outputs'),
    );

    if (archives.length !== 1) {
      throw new Error(
        `Expected exactly one Android AAB under android/app/build/outputs; found ${archives.length}.`,
      );
    }

    return archives[0];
  }

  if (platform === 'ios') {
    const archivePath = path.join(projectRoot, 'ios', 'build', 'App.ipa');

    if (!fs.existsSync(archivePath)) {
      throw new Error('Expected iOS IPA at ios/build/App.ipa.');
    }

    return archivePath;
  }

  throw new Error(`Unsupported EAS build platform: ${String(platform)}.`);
}

function createUploadCommand({ archivePath, organization, project }) {
  return {
    command: 'pnpm',
    arguments: [
      'exec',
      'sentry-cli',
      'build',
      'upload',
      archivePath,
      '--org',
      organization,
      '--project',
      project,
      '--build-configuration',
      'Release',
    ],
  };
}

function uploadArchive({ archivePath, organization, project, projectRoot }) {
  const uploadCommand = createUploadCommand({
    archivePath,
    organization,
    project,
  });
  const result = spawnSync(uploadCommand.command, uploadCommand.arguments, {
    cwd: projectRoot,
    stdio: 'inherit',
  });

  if (result.error) {
    throw new Error(`Failed to start Sentry CLI: ${result.error.message}`);
  }

  if (result.status !== 0) {
    throw new Error(
      `Sentry CLI Size Analysis upload failed with exit code ${String(result.status)}.`,
    );
  }
}

function main({ environment = process.env, projectRoot = process.cwd() } = {}) {
  if (!shouldUploadSizeAnalysis(environment)) {
    return false;
  }

  if (!environment.SENTRY_AUTH_TOKEN) {
    throw new Error(
      'SENTRY_AUTH_TOKEN is required for Sentry Size Analysis uploads.',
    );
  }

  const appConfigPath = path.join(projectRoot, 'app.json');
  const appConfig = JSON.parse(fs.readFileSync(appConfigPath, 'utf8'));
  const { organization, project } = readSentryPluginOptions(appConfig);
  const archivePath = findArchive(projectRoot, environment.EAS_BUILD_PLATFORM);

  uploadArchive({ archivePath, organization, project, projectRoot });
  return true;
}

function runAsBuildHook(options) {
  try {
    return main(options);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Sentry Size Analysis upload skipped: ${message}`);
    return false;
  }
}

if (require.main === module) {
  runAsBuildHook();
}

module.exports = {
  createUploadCommand,
  findArchive,
  main,
  readSentryPluginOptions,
  runAsBuildHook,
  shouldUploadSizeAnalysis,
};
