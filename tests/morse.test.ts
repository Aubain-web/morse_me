import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';

import { translateTextToMorse } from '../translate.files.js';
import { buildBeepSchedule, encodeWavPcm16Mono, playMorseFromText, renderMorseWavSamples } from '../morse.sound.js';

test('translateTextToMorse: encodes basic text', () => {
  const { output, skipped } = translateTextToMorse('SOS');
  assert.equal(output, '... --- ...');
  assert.deepEqual(skipped, []);
});

test('translateTextToMorse: word separator and skipped chars', () => {
  const { output, skipped } = translateTextToMorse('A B @');
  assert.equal(output, '.- / -...');
  assert.deepEqual(skipped, ['@']);
});

test('buildBeepSchedule: uses TIMING units and merges gaps', () => {
  const schedule = buildBeepSchedule('E E', 10);
  assert.deepEqual(schedule, [
    { on: true, ms: 10 },
    { on: false, ms: 100 },
    { on: true, ms: 10 },
    { on: false, ms: 30 },
  ]);
});

test('renderMorseWavSamples: produces tone then silence', () => {
  const samples = renderMorseWavSamples('E', { frequencyHz: 100, unitMs: 10, sampleRateHz: 1000 });
  // DOT (10ms) + LETTER_SPACE (30ms) = 40ms => 40 samples at 1000 Hz
  assert.equal(samples.length, 40);

  const tone = samples.slice(0, 10);
  const silence = samples.slice(10);

  assert.ok(tone.some((v) => v !== 0), 'tone segment should contain non-zero samples');
  assert.ok(silence.every((v) => v === 0), 'silence segment should be all zeros');
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
  const outFile = 'test-output.wav';
  await fs.rm(outFile, { force: true });

  const result = await playMorseFromText('E', { play: false, outFile });
  assert.equal(result.played, false);
  assert.ok(result.wavPath.endsWith(outFile));

  const buf = await fs.readFile(outFile);
  assert.equal(buf.toString('ascii', 0, 4), 'RIFF');

  await fs.rm(outFile, { force: true });
});
