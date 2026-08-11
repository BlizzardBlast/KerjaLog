const { withAppDelegate } = require('expo/config-plugins');

const CALL = '    excludeKerjaLogDatabaseFromBackup()\n';
const CALL_ANCHOR = '    reactNativeFactory = factory\n';
const HELPER_MARKER = 'private func excludeKerjaLogDatabaseFromBackup()';
const HELPER = `
private func excludeKerjaLogDatabaseFromBackup() {
  guard let documentsDirectory = FileManager.default.urls(
    for: .documentDirectory,
    in: .userDomainMask
  ).first else {
    preconditionFailure("KerjaLog could not resolve its documents directory.")
  }

  var sqliteDirectory = documentsDirectory.appendingPathComponent(
    "SQLite",
    isDirectory: true
  )

  do {
    try FileManager.default.createDirectory(
      at: sqliteDirectory,
      withIntermediateDirectories: true
    )
    var resourceValues = URLResourceValues()
    resourceValues.isExcludedFromBackup = true
    try sqliteDirectory.setResourceValues(resourceValues)
  } catch {
    preconditionFailure(
      "KerjaLog could not exclude its encrypted database from backup: \\(error.localizedDescription)"
    )
  }
}
`;

function applyDatabaseBackupExclusion(contents) {
  let nextContents = contents;

  if (!nextContents.includes('import Foundation')) {
    const importAnchor = 'internal import Expo\n';
    if (!nextContents.includes(importAnchor)) {
      throw new Error('Unable to add Foundation import to the iOS AppDelegate.');
    }
    nextContents = nextContents.replace(importAnchor, `import Foundation\n${importAnchor}`);
  }

  if (!nextContents.includes(CALL.trim())) {
    if (!nextContents.includes(CALL_ANCHOR)) {
      throw new Error('Unable to locate the KerjaLog iOS AppDelegate launch anchor.');
    }
    nextContents = nextContents.replace(CALL_ANCHOR, `${CALL_ANCHOR}\n${CALL}`);
  }

  if (!nextContents.includes(HELPER_MARKER)) {
    const mainAnchor = '@main\n';
    if (!nextContents.includes(mainAnchor)) {
      throw new Error('Unable to locate the KerjaLog iOS AppDelegate class.');
    }
    nextContents = nextContents.replace(mainAnchor, `${HELPER}\n${mainAnchor}`);
  }

  return nextContents;
}

const withIosDatabaseBackupExclusion = (config) =>
  withAppDelegate(config, (appDelegateConfig) => {
    if (appDelegateConfig.modResults.language !== 'swift') {
      throw new Error('KerjaLog requires a Swift iOS AppDelegate.');
    }

    appDelegateConfig.modResults.contents = applyDatabaseBackupExclusion(
      appDelegateConfig.modResults.contents,
    );

    return appDelegateConfig;
  });

module.exports = withIosDatabaseBackupExclusion;
module.exports.applyDatabaseBackupExclusion = applyDatabaseBackupExclusion;
