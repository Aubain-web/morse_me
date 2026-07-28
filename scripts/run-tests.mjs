/**
 * Portable test launcher.
 *
 * `node --test` cannot take one argument shape that works everywhere: glob
 * patterns need Node 22+, while passing a directory fails on Node 22. Explicit
 * file paths work on every supported version, so resolve them here rather than
 * relying on the shell (npm runs scripts through cmd.exe on Windows, which does
 * not expand globs at all).
 */
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const TEST_DIR = path.join('dist', 'tests');

let entries;
try {
  entries = readdirSync(TEST_DIR, { recursive: true });
} catch {
  console.error(`No compiled tests found in ${TEST_DIR}. Run "npm run build" first.`);
  process.exit(1);
}

const files = entries
  .map((entry) => String(entry))
  .filter((entry) => entry.endsWith('.test.js'))
  .map((entry) => path.join(TEST_DIR, entry))
  .sort();

// A silent zero-test run would look like a pass; fail loudly instead.
if (files.length === 0) {
  console.error(`No *.test.js files found in ${TEST_DIR}. Run "npm run build" first.`);
  process.exit(1);
}

const result = spawnSync(process.execPath, ['--test', ...files], { stdio: 'inherit' });

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
