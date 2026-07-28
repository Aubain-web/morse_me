interface MorseCode {
  char: string;
  pattern: string;
  timing: number[];
}

const TIMING = {
  DOT: 1,
  DASH: 3,
  INTRA_CHAR_SPACE: 1,
  LETTER_SPACE: 3,
  WORD_SPACE: 7,
} as const;

/**
 * Source of truth: one Morse pattern per character.
 *
 * Timings are derived from these patterns (see `buildTiming`) rather than
 * written by hand, so the two representations cannot drift apart.
 */
const MORSE_PATTERNS: Record<string, string> = {
  A: '.-',
  B: '-...',
  C: '-.-.',
  D: '-..',
  E: '.',
  F: '..-.',
  G: '--.',
  H: '....',
  I: '..',
  J: '.---',
  K: '-.-',
  L: '.-..',
  M: '--',
  N: '-.',
  O: '---',
  P: '.--.',
  Q: '--.-',
  R: '.-.',
  S: '...',
  T: '-',
  U: '..-',
  V: '...-',
  W: '.--',
  X: '-..-',
  Y: '-.--',
  Z: '--..',
  Á: '.--.-',
  Ä: '.-.-',
  É: '..-..',
  Ñ: '--.--',
  Ö: '---.',
  Ü: '..--',
  '0': '-----',
  '1': '.----',
  '2': '..---',
  '3': '...--',
  '4': '....-',
  '5': '.....',
  '6': '-....',
  '7': '--...',
  '8': '---..',
  '9': '----.',
  ',': '--..--',
  '.': '.-.-.-',
  '?': '..--..',
  '"': '.-..-.',
  ':': '---...',
  "'": '.----.',
  '-': '-....-',
  '/': '-..-.',
  '(': '-.--.',
  ')': '-.--.-',
};

/** Duration, in Morse units, of a single `.` or `-` symbol. */
function symbolUnits(symbol: string): number {
  return symbol === '-' ? TIMING.DASH : TIMING.DOT;
}

/** Expand a pattern into alternating symbol / intra-character gap durations. */
function buildTiming(pattern: string): number[] {
  const timing: number[] = [];

  for (let index = 0; index < pattern.length; index += 1) {
    timing.push(symbolUnits(pattern[index] as string));

    if (index < pattern.length - 1) {
      timing.push(TIMING.INTRA_CHAR_SPACE);
    }
  }

  return timing;
}

const MORSE_CODE: Record<string, MorseCode> = Object.fromEntries(
  Object.entries(MORSE_PATTERNS).map(([char, pattern]) => [
    char,
    { char, pattern, timing: buildTiming(pattern) },
  ])
);

/** Reverse lookup used by the decoder. Patterns are unique across the table. */
const MORSE_BY_PATTERN: Record<string, string> = Object.fromEntries(
  Object.entries(MORSE_PATTERNS).map(([char, pattern]) => [pattern, char])
);

export { MORSE_CODE, MORSE_PATTERNS, MORSE_BY_PATTERN, TIMING, buildTiming, type MorseCode };
