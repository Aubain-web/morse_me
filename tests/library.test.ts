import test from 'node:test';
import assert from 'node:assert/strict';

import { MORSE_BY_PATTERN, MORSE_CODE, MORSE_PATTERNS, TIMING, buildTiming } from '../library.js';

test('MORSE_CODE: every timing matches its own pattern', () => {
  for (const [char, entry] of Object.entries(MORSE_CODE)) {
    const expected: number[] = [];

    for (let index = 0; index < entry.pattern.length; index += 1) {
      expected.push(entry.pattern[index] === '-' ? TIMING.DASH : TIMING.DOT);
      if (index < entry.pattern.length - 1) {
        expected.push(TIMING.INTRA_CHAR_SPACE);
      }
    }

    assert.deepEqual(entry.timing, expected, `timing mismatch for ${char}`);
  }
});

test('MORSE_CODE: entries are self-consistent', () => {
  for (const [key, entry] of Object.entries(MORSE_CODE)) {
    assert.equal(entry.char, key);
    assert.equal(entry.pattern, MORSE_PATTERNS[key]);
    assert.match(entry.pattern, /^[.-]+$/, `${key} must only use . and -`);
  }
});

test('MORSE_BY_PATTERN: patterns are unique so decoding is unambiguous', () => {
  const patterns = Object.values(MORSE_PATTERNS);
  assert.equal(new Set(patterns).size, patterns.length);
  assert.equal(Object.keys(MORSE_BY_PATTERN).length, patterns.length);
});

test('MORSE_BY_PATTERN: round-trips every character', () => {
  for (const [char, pattern] of Object.entries(MORSE_PATTERNS)) {
    assert.equal(MORSE_BY_PATTERN[pattern], char);
  }
});

test('buildTiming: interleaves symbols with single-unit gaps', () => {
  assert.deepEqual(buildTiming('.'), [1]);
  assert.deepEqual(buildTiming('-'), [3]);
  assert.deepEqual(buildTiming('.-'), [1, 1, 3]);
  // Regression: D used to carry a trailing gap that no other letter had.
  assert.deepEqual(buildTiming('-..'), [3, 1, 1, 1, 1]);
});

test('MORSE_CODE: covers letters, digits, accents and punctuation', () => {
  for (const char of 'ABCXYZ0159ÁÄÉÑÖÜ,.?":\'-/()') {
    assert.ok(MORSE_CODE[char], `missing table entry for ${char}`);
  }
});
