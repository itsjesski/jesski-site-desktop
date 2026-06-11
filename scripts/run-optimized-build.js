import { spawnSync } from 'node:child_process';
import process from 'node:process';

const isWindows = process.platform === 'win32';
const command = isWindows ? 'powershell' : 'bash';
const args = isWindows
  ? ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', 'scripts/optimize-build.ps1']
  : ['scripts/optimize-build.sh'];

const result = spawnSync(command, args, { stdio: 'inherit' });

if (result.error) {
  console.error(`Failed to run optimized build: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
