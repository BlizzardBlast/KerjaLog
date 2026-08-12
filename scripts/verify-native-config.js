const fs = require('node:fs');
const path = require('node:path');

function assertIncludes(value, expected, label) {
  if (!value.includes(expected)) {
    throw new Error(`${label} is missing expected configuration: ${expected}`);
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

const appDelegate = fs.readFileSync(appDelegatePath, 'utf8');
const iosPodProperties = JSON.parse(
  fs.readFileSync(path.resolve('ios/Podfile.properties.json'), 'utf8'),
);
const androidGradleProperties = fs.readFileSync(
  path.resolve('android/gradle.properties'),
  'utf8',
);

assertIncludes(
  appDelegate,
  'resourceValues.isExcludedFromBackup = true',
  'iOS AppDelegate',
);
assertIncludes(appDelegate, 'NSLog(', 'iOS AppDelegate');

if (iosPodProperties['expo.sqlite.useSQLCipher'] !== 'true') {
  throw new Error('Generated iOS SQLCipher configuration is not enabled.');
}

assertIncludes(
  androidGradleProperties,
  'expo.sqlite.useSQLCipher=true',
  'Android Gradle properties',
);

console.log('Generated native configuration verified.');
