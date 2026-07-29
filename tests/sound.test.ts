import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { TIMING } from '../library.js';
import {
  buildBeepSchedule,
  encodeWavPcm16Mono,
  playMorseFromText,
  renderMorseWavSamples,
} from '../morse.sound.js';

const UNIT = 10;

function silenceUnitsBetweenTones(text: string): number[] {
  return buildBeepSchedule(text, UNIT)
    .filter((step) => !step.on)
    .map((step) => step.ms / UNIT);
}

test('buildBeepSchedule: intra-character gap is 1 unit', () => {
  // I = ".." -> tone, 1-unit gap, tone
  assert.deepEqual(buildBeepSchedule('I', UNIT), [
    { on: true, ms: 10 },
    { on: false, ms: 10 },
    { on: true, ms: 10 },
  ]);
});

test('buildBeepSchedule: letter gap is exactly 3 units', () => {
  assert.deepEqual(silenceUnitsBetweenTones('EE'), [TIMING.LETTER_SPACE]);
});

test('buildBeepSchedule: word gap is exactly 7 units, not letter + word', () => {
  // Regression: the letter gap used to stack onto the word gap, giving 10.
  assert.deepEqual(silenceUnitsBetweenTones('E E'), [TIMING.WORD_SPACE]);
  assert.deepEqual(buildBeepSchedule('E E', UNIT), [
    { on: true, ms: 10 },
    { on: false, ms: 70 },
    { on: true, ms: 10 },
  ]);
});

test('buildBeepSchedule: repeated whitespace still counts as one word gap', () => {
  assert.deepEqual(silenceUnitsBetweenTones('E   E'), [TIMING.WORD_SPACE]);
  assert.deepEqual(silenceUnitsBetweenTones('E \t E'), [TIMING.WORD_SPACE]);
});

test('buildBeepSchedule: a newline is a word gap', () => {
  assert.deepEqual(silenceUnitsBetweenTones('E\nE'), [TIMING.WORD_SPACE]);
  assert.deepEqual(silenceUnitsBetweenTones('E\r\nE'), [TIMING.WORD_SPACE]);
});

test('buildBeepSchedule: never starts or ends on silence', () => {
  const schedule = buildBeepSchedule('  SOS  ', UNIT);

  assert.ok(schedule.length > 0);
  assert.equal(schedule[0]?.on, true, 'must not start with silence');
  assert.equal(schedule[schedule.length - 1]?.on, true, 'must not end with silence');
});

test('buildBeepSchedule: unsupported characters do not add a gap', () => {
  // "E@E" should sound exactly like "EE".
  assert.deepEqual(buildBeepSchedule('E@E', UNIT), buildBeepSchedule('EE', UNIT));
});

test('buildBeepSchedule: empty or unsupported-only input yields nothing', () => {
  assert.deepEqual(buildBeepSchedule('', UNIT), []);
  assert.deepEqual(buildBeepSchedule('@@@', UNIT), []);
  assert.deepEqual(buildBeepSchedule('   ', UNIT), []);
});

test('renderMorseWavSamples: a single dot is exactly one unit long', () => {
  const samples = renderMorseWavSamples('E', { frequencyHz: 100, unitMs: 10, sampleRateHz: 1000 });

  // No trailing letter gap: 10ms at 1000 Hz = 10 samples.
  assert.equal(samples.length, 10);
  assert.ok(
    samples.some((value) => value !== 0),
    'tone segment should contain non-zero samples'
  );
});

test('renderMorseWavSamples: silence between words is actually silent', () => {
  const samples = renderMorseWavSamples('E E', {
    frequencyHz: 100,
    unitMs: 10,
    sampleRateHz: 1000,
  });

  // dot(10ms) + word gap(70ms) + dot(10ms) = 90ms => 90 samples
  assert.equal(samples.length, 90);
  assert.ok(
    samples.slice(10, 80).every((value) => value === 0),
    'word gap must be silent'
  );
  assert.ok(
    samples.slice(80).some((value) => value !== 0),
    'second dot must be audible'
  );
});

test('renderMorseWavSamples: empty input yields no samples', () => {
  assert.equal(
    renderMorseWavSamples('', { frequencyHz: 100, unitMs: 10, sampleRateHz: 1000 }).length,
    0
  );
});

test('encodeWavPcm16Mono: writes a valid PCM16 mono WAV header', () => {
  const pcm = new Int16Array([0, 1, -1]);
  const wav = encodeWavPcm16Mono(pcm, 8000);

  assert.equal(wav.length, 44 + 6);
  assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
  assert.equal(wav.toString('ascii', 8, 12), 'WAVE');
  assert.equal(wav.toString('ascii', 12, 16), 'fmt ');
  assert.equal(wav.readUInt16LE(20), 1); // PCM
  assert.equal(wav.readUInt16LE(22), 1); // mono
  assert.equal(wav.readUInt32LE(24), 8000);
  assert.equal(wav.readUInt16LE(34), 16); // bits per sample
  assert.equal(wav.toString('ascii', 36, 40), 'data');
  assert.equal(wav.readUInt32LE(40), 6);

  assert.equal(wav.readInt16LE(44), 0);
  assert.equal(wav.readInt16LE(46), 1);
  assert.equal(wav.readInt16LE(48), -1);
});

test('playMorseFromText: does not write files when play=false and no outFile', async () => {
  const result = await playMorseFromText('E', { play: false });
  assert.deepEqual(result, { wavPath: '', played: false });
});

test('playMorseFromText: writes file only when outFile is provided', async () => {
  const outFile = path.join(await fs.mkdtemp(path.join(os.tmpdir(), 'morse-')), 'out.wav');

  try {
    const result = await playMorseFromText('E', { play: false, outFile });

    assert.equal(result.played, false);
    assert.equal(result.wavPath, path.resolve(outFile));

    const buffer = await fs.readFile(outFile);
    assert.equal(buffer.toString('ascii', 0, 4), 'RIFF');
  } finally {
    await fs.rm(path.dirname(outFile), { recursive: true, force: true });
  }
});
