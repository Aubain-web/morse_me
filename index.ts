/**
 * Public entry point of the package.
 *
 * This module only re-exports the library surface — importing it must never
 * run the CLI. The command line lives in `cli.ts` and is exposed through the
 * `morse_it` bin.
 */
export {
  MORSE_CODE,
  MORSE_PATTERNS,
  MORSE_BY_PATTERN,
  TIMING,
  buildTiming,
  type MorseCode,
} from './library.js';

export {
  translateTextToMorse,
  translateMorseToText,
  WORD_SEPARATOR,
  type TranslateResult,
  type DecodeResult,
} from './translate.files.js';

export { readFiles, describeReadError, type ReadResult } from './read.files.js';

export { resolveInputs, readStdin, type InputSource, type ResolveInputsOptions } from './input.js';

export {
  playMorseFromText,
  buildBeepSchedule,
  encodeWavPcm16Mono,
  renderMorseWavSamples,
  type BeepStep,
  type PlayOptions,
  type PlayResult,
} from './morse.sound.js';
