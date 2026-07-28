import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CLI_PATH = fileURLToPath(new URL('../cli.js', import.meta.url));

interface CliResult {
  code: number;
  stdout: string;
  stderr: string;
}

function runCli(args: string[], stdin = ''): Promise<CliResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [CLI_PATH, ...args], { stdio: 'pipe' });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => (stdout += chunk));
    child.stderr.on('data', (chunk) => (stderr += chunk));
    child.on('error', reject);
    child.on('close', (code) => resolve({ code: code ?? 0, stdout, stderr }));

    child.stdin.end(stdin);
  });
}

async function withTempDir(run: (dir: string) => Promise<void>): Promise<void> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'morse-cli-'));
  try {
    await run(dir);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}

test('cli: encodes a file', async () => {
  await withTempDir(async (dir) => {
    const file = path.join(dir, 'sos.txt');
    await fs.writeFile(file, 'SOS');

    const { code, stdout } = await runCli(['encode', file]);

    assert.equal(code, 0);
    assert.equal(stdout.trim(), '... --- ...');
  });
});

test('cli: encodes --text without touching the filesystem', async () => {
  const { code, stdout } = await runCli(['encode', '--text', 'SOS']);

  assert.equal(code, 0);
  assert.equal(stdout.trim(), '... --- ...');
});

test('cli: encodes text piped on stdin', async () => {
  const { code, stdout } = await runCli(['encode'], 'SOS');

  assert.equal(code, 0);
  assert.equal(stdout.trim(), '... --- ...');
});

test('cli: decodes back to text', async () => {
  const { code, stdout } = await runCli(['decode', '--text', '... --- ... / -- .']);

  assert.equal(code, 0);
  assert.equal(stdout.trim(), 'SOS ME');
});

test('cli: labels output only when several inputs are given', async () => {
  await withTempDir(async (dir) => {
    const a = path.join(dir, 'a.txt');
    const b = path.join(dir, 'b.txt');
    await fs.writeFile(a, 'E');
    await fs.writeFile(b, 'T');

    const single = await runCli(['encode', a]);
    assert.ok(!single.stdout.includes('---'), 'single input should not be labelled');

    const multiple = await runCli(['encode', a, b]);
    assert.ok(multiple.stdout.includes(`--- ${a} ---`));
    assert.ok(multiple.stdout.includes(`--- ${b} ---`));
  });
});

test('cli: a missing file fails cleanly without a stack trace', async () => {
  const { code, stderr } = await runCli(['encode', 'definitely-missing.txt']);

  assert.equal(code, 1);
  assert.match(stderr, /no such file/);
  assert.ok(!stderr.includes('at async'), 'must not leak a stack trace');
});

test('cli: keeps processing readable files when one fails', async () => {
  await withTempDir(async (dir) => {
    const good = path.join(dir, 'good.txt');
    await fs.writeFile(good, 'SOS');

    const { code, stdout, stderr } = await runCli(['encode', path.join(dir, 'missing.txt'), good]);

    assert.equal(code, 1, 'a failed input must still be reflected in the exit code');
    assert.match(stderr, /no such file/);
    assert.ok(stdout.includes('... --- ...'), 'the readable file must still be encoded');
  });
});

test('cli: reports skipped characters for play, like encode does', async () => {
  await withTempDir(async (dir) => {
    const out = path.join(dir, 'out.wav');
    const { code, stderr } = await runCli(['play', '--text', 'E@E', '--no-play', '--out', out]);

    assert.equal(code, 0);
    assert.match(stderr, /Skipped characters/);
    assert.match(stderr, /@/);
  });
});

test('cli: play writes one WAV per input instead of overwriting', async () => {
  await withTempDir(async (dir) => {
    const a = path.join(dir, 'a.txt');
    const b = path.join(dir, 'b.txt');
    await fs.writeFile(a, 'E');
    await fs.writeFile(b, 'SOS');

    const out = path.join(dir, 'out.wav');
    const { code } = await runCli(['play', a, b, '--no-play', '--out', out]);

    assert.equal(code, 0);

    const first = await fs.stat(path.join(dir, 'out-1.wav'));
    const second = await fs.stat(path.join(dir, 'out-2.wav'));

    assert.ok(first.size > 44);
    assert.ok(second.size > first.size, 'SOS is longer than E, so its WAV must be bigger');
  });
});

test('cli: play with a single input honours --out verbatim', async () => {
  await withTempDir(async (dir) => {
    const out = path.join(dir, 'exact.wav');
    const { code, stdout } = await runCli(['play', '--text', 'E', '--no-play', '--out', out]);

    // --no-play is a deliberate choice, not a playback failure.
    assert.ok(
      !stdout.includes('Could not auto-play'),
      'must not report a playback failure when playback was not requested'
    );

    assert.equal(code, 0);
    assert.ok(stdout.includes(out));
    await fs.stat(out);
  });
});

test('cli: play rejects a run that would neither play nor save', async () => {
  const { code, stderr } = await runCli(['play', '--text', 'E', '--no-play']);

  assert.equal(code, 1);
  assert.match(stderr, /Nothing to do/);
});

test('cli: rejects invalid numeric options', async () => {
  const frequency = await runCli(['play', '--text', 'E', '--no-play', '-o', 'x.wav', '-f', '0']);
  assert.equal(frequency.code, 1);
  assert.match(frequency.stderr, /Invalid --frequency/);

  const unit = await runCli(['play', '--text', 'E', '--no-play', '-o', 'x.wav', '-u', '-5']);
  assert.equal(unit.code, 1);
  assert.match(unit.stderr, /Invalid --unitMs/);
});

test('cli: unknown command fails with usage, not a stack trace', async () => {
  const { code, stderr } = await runCli(['nope']);

  assert.equal(code, 1);
  assert.ok(!stderr.includes('at Object'), 'must not leak a stack trace');
  assert.match(stderr, /encode/);
});

test('cli: --help exits successfully', async () => {
  const { code, stdout } = await runCli(['--help']);

  assert.equal(code, 0);
  for (const command of ['encode', 'decode', 'play']) {
    assert.ok(stdout.includes(command), `help should mention ${command}`);
  }
});
