import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const isWindows = process.platform === 'win32';
const nativeCheckEnvironment = {
  ...process.env,
  NODE_ENV: process.env.NODE_ENV ?? 'development',
};

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    env: nativeCheckEnvironment,
    stdio: 'inherit',
    ...options,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function runPlatformCommand({
  unixCommand,
  windowsCommand,
  args,
  options = {},
}) {
  if (!isWindows) {
    run(unixCommand, args, options);
    return;
  }

  const commandLine = [windowsCommand, ...args].join(' ');
  run(
    process.env.ComSpec ?? 'cmd.exe',
    ['/d', '/s', '/c', commandLine],
    options,
  );
}

runPlatformCommand({
  unixCommand: 'pnpm',
  windowsCommand: 'pnpm.cmd',
  args: ['exec', 'expo', 'prebuild', '--clean', '--no-install'],
});

runPlatformCommand({
  unixCommand: './gradlew',
  windowsCommand: 'gradlew.bat',
  args: [':app:compileDebugKotlin', '--no-daemon'],
  options: {
    cwd: resolve('android'),
  },
});

run(process.execPath, ['scripts/verify-native-config.js']);
