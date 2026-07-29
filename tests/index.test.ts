import test from 'node:test';
import assert from 'node:assert/strict';

test('package entry point exposes the library without running the CLI', async () => {
  // Importing the entry point used to execute yargs, print help and set a
  // non-zero exit code. It must now be inert.
  const previousExitCode = process.exitCode;
  const api = await import('../index.js');

  assert.equal(process.exitCode, previousExitCode, 'importing must not change the exit code');

  for (const name of [
    'translateTextToMorse',
    'translateMorseToText',
    'playMorseFromText',
    'buildBeepSchedule',
    'renderMorseWavSamples',
    'encodeWavPcm16Mono',
    'readFiles',
    'resolveInputs',
  ]) {
    assert.equal(typeof (api as Record<string, unknown>)[name], 'function', `missing ${name}`);
  }

  assert.equal(typeof api.MORSE_CODE, 'object');
  assert.equal(typeof api.MORSE_BY_PATTERN, 'object');
  assert.equal(api.TIMING.WORD_SPACE, 7);
});
