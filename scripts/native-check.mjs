import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const isWindows = process.platform === 'win32';

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: isWindows,
    ...options,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run(isWindows ? 'pnpm.cmd' : 'pnpm', [
  'exec',
  'expo',
  'prebuild',
  '--clean',
  '--no-install',
]);

run(
  isWindows ? 'gradlew.bat' : './gradlew',
  [':app:compileDebugKotlin', '--no-daemon'],
  {
    cwd: resolve('android'),
  },
);

run(process.execPath, ['scripts/verify-native-config.js']);
