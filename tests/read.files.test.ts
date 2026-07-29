import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';

import { readFiles } from '../read.files.js';
import { resolveInputs } from '../input.js';

async function withTempDir(run: (dir: string) => Promise<void>): Promise<void> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'morse-read-'));
  try {
    await run(dir);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}

/** Minimal stdin stand-in: a readable stream plus the isTTY flag we branch on. */
function fakeStdin(content: string | null): NodeJS.ReadStream {
  const stream = content === null ? Readable.from([]) : Readable.from([Buffer.from(content)]);
  return Object.assign(stream, { isTTY: content === null }) as unknown as NodeJS.ReadStream;
}

test('readFiles: reads contents in the order requested', async () => {
  await withTempDir(async (dir) => {
    const a = path.join(dir, 'a.txt');
    const b = path.join(dir, 'b.txt');
    await fs.writeFile(a, 'AAA');
    await fs.writeFile(b, 'BBB');

    const results = await readFiles([a, b]);

    assert.deepEqual(
      results.map((result) => result.content),
      ['AAA', 'BBB']
    );
    assert.ok(results.every((result) => result.error === null));
  });
});

test('readFiles: a missing file does not sink the whole batch', async () => {
  await withTempDir(async (dir) => {
    const good = path.join(dir, 'good.txt');
    const missing = path.join(dir, 'missing.txt');
    await fs.writeFile(good, 'OK');

    const results = await readFiles([missing, good]);

    assert.equal(results[0]?.content, null);
    assert.match(results[0]?.error ?? '', /no such file/);
    assert.equal(results[1]?.content, 'OK');
    assert.equal(results[1]?.error, null);
  });
});

test('readFiles: reports a directory without throwing', async () => {
  await withTempDir(async (dir) => {
    const results = await readFiles([dir]);

    assert.equal(results[0]?.content, null);
    // Windows reports EPERM rather than EISDIR when opening a directory.
    assert.match(results[0]?.error ?? '', /is a directory|permission denied/);
  });
});

test('readFiles: no paths yields no results', async () => {
  assert.deepEqual(await readFiles([]), []);
});

test('resolveInputs: --text wins over files and stdin', async () => {
  const sources = await resolveInputs({
    files: ['ignored.txt'],
    text: 'SOS',
    stdin: fakeStdin('piped'),
  });

  assert.equal(sources.length, 1);
  assert.equal(sources[0]?.label, '<text>');
  assert.equal(sources[0]?.text, 'SOS');
});

test('resolveInputs: files win over stdin', async () => {
  await withTempDir(async (dir) => {
    const file = path.join(dir, 'a.txt');
    await fs.writeFile(file, 'FROM FILE');

    const sources = await resolveInputs({ files: [file], stdin: fakeStdin('piped') });

    assert.equal(sources.length, 1);
    assert.equal(sources[0]?.label, file);
    assert.equal(sources[0]?.text, 'FROM FILE');
  });
});

test('resolveInputs: falls back to piped stdin', async () => {
  const sources = await resolveInputs({ stdin: fakeStdin('piped text') });

  assert.equal(sources.length, 1);
  assert.equal(sources[0]?.label, '<stdin>');
  assert.equal(sources[0]?.text, 'piped text');
});

test('resolveInputs: returns nothing when stdin is a TTY and no input is given', async () => {
  assert.deepEqual(await resolveInputs({ stdin: fakeStdin(null) }), []);
});
