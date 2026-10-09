import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const jestBin = require.resolve('jest/bin/jest');

const result = spawnSync(
  process.execPath,
  ['--experimental-vm-modules', jestBin, '--runInBand', '--detectOpenHandles', '--forceExit', ...process.argv.slice(2)],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_OPTIONS: '--experimental-vm-modules',
    },
  },
);

process.exit(result.status ?? 0);
