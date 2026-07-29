import test from 'node:test';
import assert from 'node:assert/strict';

import { translateMorseToText, translateTextToMorse } from '../translate.files.js';

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

test('translateTextToMorse: is case insensitive', () => {
  assert.equal(translateTextToMorse('sos').output, translateTextToMorse('SOS').output);
});

test('translateTextToMorse: handles accented characters', () => {
  const { output, skipped } = translateTextToMorse('ÉTÉ');
  assert.equal(output, '..-.. - ..-..');
  assert.deepEqual(skipped, []);
});

test('translateTextToMorse: preserves line structure', () => {
  assert.equal(translateTextToMorse('A\nB').output, '.-\n-...');
  assert.equal(translateTextToMorse('A\n\nB').output, '.-\n\n-...');
});

test('translateTextToMorse: reports each unsupported character once, sorted', () => {
  const { skipped } = translateTextToMorse('@#@#%');
  assert.deepEqual(skipped, ['#', '%', '@']);
});

test('translateTextToMorse: empty input yields empty output', () => {
  assert.deepEqual(translateTextToMorse(''), { output: '', skipped: [] });
});

test('translateMorseToText: decodes letters and words', () => {
  const { output, skipped } = translateMorseToText('... --- ... / -- . ');
  assert.equal(output, 'SOS ME');
  assert.deepEqual(skipped, []);
});

test('translateMorseToText: reports unknown patterns', () => {
  const { output, skipped } = translateMorseToText('... ..--..-- ---');
  assert.equal(output, 'SO');
  assert.deepEqual(skipped, ['..--..--']);
});

test('translateMorseToText: accepts | as a word separator', () => {
  assert.equal(translateMorseToText('.- | -...').output, 'A B');
});

test('translateMorseToText: tolerates irregular spacing', () => {
  assert.equal(translateMorseToText('   ...   ---    ...   ').output, 'SOS');
});

test('translateMorseToText: empty input yields empty output', () => {
  assert.deepEqual(translateMorseToText('   \n  '), { output: '', skipped: [] });
});

test('encode then decode round-trips text', () => {
  const original = 'SOS MORSE ME 123';
  const { output: encoded } = translateTextToMorse(original);
  const { output: decoded, skipped } = translateMorseToText(encoded);

  assert.equal(decoded, original);
  assert.deepEqual(skipped, []);
});

test('encode then decode round-trips punctuation and accents', () => {
  const original = "ÉTÉ 2026, C'EST (BIEN)?";
  const { output: encoded, skipped: encodeSkipped } = translateTextToMorse(original);
  const { output: decoded, skipped: decodeSkipped } = translateMorseToText(encoded);

  assert.deepEqual(encodeSkipped, []);
  assert.deepEqual(decodeSkipped, []);
  assert.equal(decoded, original);
});
