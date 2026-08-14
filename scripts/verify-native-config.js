const fs = require('node:fs');
const path = require('node:path');

function assertIncludes(value, expected, label) {
  if (!value.includes(expected)) {
    throw new Error(`${label} is missing expected configuration: ${expected}`);
  }
}

function assertMatches(value, expected, label) {
  if (!expected.test(value)) {
    throw new Error(`${label} is missing expected configuration.`);
  }
}

function assertNotIncludes(value, unexpected, label) {
  if (value.includes(unexpected)) {
    throw new Error(`${label} includes forbidden configuration: ${unexpected}`);
  }
}

const iosDirectory = path.resolve('ios');
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
  appDelegate,
  'resourceValues.isExcludedFromBackup = true',
  'iOS AppDelegate',
);
assertIncludes(appDelegate, 'NSLog(', 'iOS AppDelegate');
assertMatches(
  infoPlist,
  /<key>ITSAppUsesNonExemptEncryption<\/key>\s*<false\/>/u,
  'iOS Info.plist',
);

if (iosPodProperties['expo.sqlite.useSQLCipher'] !== 'true') {
  throw new Error('Generated iOS SQLCipher configuration is not enabled.');
}

assertIncludes(
  androidGradleProperties,
  'expo.sqlite.useSQLCipher=true',
  'Android Gradle properties',
);
assertNotIncludes(
  androidManifest,
  'android.permission.SCHEDULE_EXACT_ALARM',
  'Android app manifest',
);
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

console.log('Generated native configuration verified.');
