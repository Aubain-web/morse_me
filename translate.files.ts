import { MORSE_CODE } from './library.js';

interface TranslateResult {
  output: string;
  skipped: string[];
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
      lines.push(currentLineWords.join(' / '));
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

  return {
    output,
    skipped: Array.from(skipped).sort((a, b) => a.localeCompare(b)),
  };
}

export { translateTextToMorse, type TranslateResult };
