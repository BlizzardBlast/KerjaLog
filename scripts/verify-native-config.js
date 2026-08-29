const fs = require('node:fs');
const path = require('node:path');

const EXACT_ALARM_PERMISSION = 'android.permission.SCHEDULE_EXACT_ALARM';
const SUPPORTED_PLATFORMS = new Set(['all', 'android', 'ios']);

function getTargetPlatform(argv) {
  const platformIndex = argv.indexOf('--platform');
  if (platformIndex < 0) {
    return 'all';
  }

  const platform = argv[platformIndex + 1];
  if (!SUPPORTED_PLATFORMS.has(platform)) {
    throw new Error(
      'Native configuration platform must be one of: all, android, ios.',
    );
  }

  return platform;
}

function assertIncludes(value, expected, label) {
  if (!value.includes(expected)) {
    throw new Error(`${label} is missing expected configuration: ${expected}`);
  }
}

function assertNotIncludes(value, unexpected, label) {
  if (value.includes(unexpected)) {
    throw new Error(`${label} includes forbidden configuration: ${unexpected}`);
  }
}

function assertPermissionBlocked(manifest, permission) {
  const tag = manifest
    .match(/<uses-permission\\b[^>]*>/gu)
    ?.find((candidate) => candidate.includes(`android:name="${permission}"`));

  if (!tag?.includes('tools:node="remove"')) {
    throw new Error(
      `Android app manifest must block ${permission} with tools:node="remove".`,
    );
  }
}

function findFiles(directory, filename) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const candidate = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return findFiles(candidate, filename);
    }

    return entry.name === filename ? [candidate] : [];
  });
}

function verifyIosConfiguration() {
  const iosDirectory = path.resolve('ios');
  if (!fs.existsSync(iosDirectory)) {
    throw new Error('Generated iOS directory could not be found.');
  }

  const appDelegatePath = fs
    .readdirSync(iosDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(iosDirectory, entry.name, 'AppDelegate.swift'))
    .find((candidate) => fs.existsSync(candidate));

  if (!appDelegatePath) {
    throw new Error('Generated iOS AppDelegate.swift could not be found.');
  }

  const infoPlistPath = path.join(path.dirname(appDelegatePath), 'Info.plist');
  if (!fs.existsSync(infoPlistPath)) {
    throw new Error('Generated iOS Info.plist could not be found.');
  }

  const appDelegate = fs.readFileSync(appDelegatePath, 'utf8');
  const infoPlist = fs.readFileSync(infoPlistPath, 'utf8');
  const iosPodProperties = JSON.parse(
    fs.readFileSync(path.resolve('ios/Podfile.properties.json'), 'utf8'),
  );

  assertIncludes(
    appDelegate,
    'resourceValues.isExcludedFromBackup = true',
    'iOS AppDelegate',
  );
  assertIncludes(appDelegate, 'NSLog(', 'iOS AppDelegate');
  assertNotIncludes(infoPlist, 'ITSAppUsesNonExemptEncryption', 'iOS Info.plist');

  if (iosPodProperties['expo.sqlite.useSQLCipher'] !== 'true') {
    throw new Error('Generated iOS SQLCipher configuration is not enabled.');
  }
}

function verifyAndroidConfiguration() {
  const androidGradleProperties = fs.readFileSync(
    path.resolve('android/gradle.properties'),
    'utf8',
  );
  const androidManifest = fs.readFileSync(
    path.resolve('android/app/src/main/AndroidManifest.xml'),
    'utf8',
  );
  const localAuthenticationManifest = fs.readFileSync(
    path.resolve(
      'node_modules/expo-local-authentication/android/src/main/AndroidManifest.xml',
    ),
    'utf8',
  );

  assertIncludes(
    androidGradleProperties,
    'expo.sqlite.useSQLCipher=true',
    'Android Gradle properties',
  );
  assertPermissionBlocked(androidManifest, EXACT_ALARM_PERMISSION);

  const mergedManifestPaths = findFiles(
    path.resolve('android/app/build/intermediates'),
    'AndroidManifest.xml',
  ).filter(
    (candidate) =>
      /merged_manifest(?:s)?/u.test(candidate) &&
      /[/\\\\]debug[/\\\\]/u.test(candidate),
  );

  if (mergedManifestPaths.length === 0) {
    throw new Error(
      'Generated merged Android debug manifest could not be found.',
    );
  }

  for (const mergedManifestPath of mergedManifestPaths) {
    assertNotIncludes(
      fs.readFileSync(mergedManifestPath, 'utf8'),
      EXACT_ALARM_PERMISSION,
      `Merged Android manifest ${path.relative(
        process.cwd(),
        mergedManifestPath,
      )}`,
    );
  }

  assertIncludes(
    localAuthenticationManifest,
    'android.permission.USE_BIOMETRIC',
    'Expo LocalAuthentication manifest',
  );
  assertIncludes(
    localAuthenticationManifest,
    'android.permission.USE_FINGERPRINT',
    'Expo LocalAuthentication manifest',
  );
}

const targetPlatform = getTargetPlatform(process.argv.slice(2));

if (targetPlatform === 'all' || targetPlatform === 'ios') {
  verifyIosConfiguration();
}

if (targetPlatform === 'all' || targetPlatform === 'android') {
  verifyAndroidConfiguration();
}

console.log(
  `Generated native configuration verified for ${targetPlatform === 'all' ? 'Android and iOS' : targetPlatform}.`,
);
