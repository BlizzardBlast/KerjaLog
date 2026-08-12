const {
  applyDatabaseBackupExclusion,
} = require('../plugins/with-ios-database-backup-exclusion');

const appDelegateTemplate = `internal import Expo
import React
import ReactAppDependencyProvider

@main
class AppDelegate: ExpoAppDelegate {
  var reactNativeFactory: RCTReactNativeFactory?

  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let factory = ExpoReactNativeFactory(delegate: ReactNativeDelegate())
    reactNativeFactory = factory

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}
`;

describe('withIosDatabaseBackupExclusion', () => {
  test('marks the Expo SQLite directory as excluded from iOS backup without launch-time traps', () => {
    const result = applyDatabaseBackupExclusion(appDelegateTemplate);

    expect(result).toContain('import Foundation');
    expect(result).toContain('excludeKerjaLogDatabaseFromBackup()');
    expect(result).toContain('"SQLite"');
    expect(result).toContain('resourceValues.isExcludedFromBackup = true');
    expect(result).toContain('try sqliteDirectory.setResourceValues(resourceValues)');
    expect(result).toContain('NSLog(');
    expect(result).not.toContain('preconditionFailure(');
  });

  test('is idempotent when prebuild applies the plugin again', () => {
    const once = applyDatabaseBackupExclusion(appDelegateTemplate);
    const twice = applyDatabaseBackupExclusion(once);

    expect(twice).toBe(once);
  });
});
