import { MORSE_BY_PATTERN, MORSE_CODE } from './library.js';

interface TranslateResult {
  output: string;
  skipped: string[];
}

interface DecodeResult {
  output: string;
  skipped: string[];
}

/** Token emitted between two words on the same line. */
const WORD_SEPARATOR = '/';

/**
 * Sort by code point rather than `localeCompare`, whose ordering of punctuation
 * depends on the host's ICU data — the same input must report the same order on
 * every platform.
 */
function sortUnique(values: Set<string>): string[] {
  return Array.from(values).sort();
}

function translateTextToMorse(text: string): TranslateResult {
  const skipped = new Set<string>();
  const lines: string[] = [];
  let currentLineWords: string[] = [];
  let currentWord: string[] = [];

  const flushWord = () => {
    if (currentWord.length > 0) {
      currentLineWords.push(currentWord.join(' '));
      currentWord = [];
    }
  };

  const flushLine = () => {
    flushWord();
    if (currentLineWords.length > 0) {
      lines.push(currentLineWords.join(` ${WORD_SEPARATOR} `));
      currentLineWords = [];
    } else if (lines.length > 0) {
      // Preserve blank lines between blocks
      lines.push('');
    }
  };

  for (const rawChar of text) {
    if (rawChar === '\r') {
      continue;
    }

    if (rawChar === '\n') {
      flushLine();
      continue;
    }

    if (rawChar === ' ' || rawChar === '\t') {
      flushWord();
      continue;
    }

    const entry = MORSE_CODE[rawChar.toUpperCase()];

    if (entry) {
      currentWord.push(entry.pattern);
    } else {
      skipped.add(rawChar);
    }
  }

  flushLine();

  const output = lines
    .map((line) => line.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return { output, skipped: sortUnique(skipped) };
}

/**
 * Decode Morse back into text.
 *
 * Letters are separated by whitespace and words by `/` (or `|`) — the shape
 * produced by `translateTextToMorse`. Tokens matching no known pattern are
 * dropped and reported through `skipped`.
 */
function translateMorseToText(morse: string): DecodeResult {
  const skipped = new Set<string>();

  const lines = morse.split(/\r?\n/).map((line) => {
    const tokens = line.trim().split(/\s+/).filter(Boolean);
    let decoded = '';

    for (const token of tokens) {
      if (token === WORD_SEPARATOR || token === '|') {
        decoded += ' ';
        continue;
      }

      const char = MORSE_BY_PATTERN[token];

      if (char) {
        decoded += char;
      } else {
        skipped.add(token);
      }
    }

    return decoded.replace(/ {2,}/g, ' ').trim();
  });

  const output = lines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return { output, skipped: sortUnique(skipped) };
}

export {
  translateTextToMorse,
  translateMorseToText,
  WORD_SEPARATOR,
  type TranslateResult,
  type DecodeResult,
};
