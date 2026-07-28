import path from 'node:path';
import yargs, { type Argv } from 'yargs';
import { hideBin } from 'yargs/helpers';
import { resolveInputs, type InputSource } from './input.js';
import { translateMorseToText, translateTextToMorse } from './translate.files.js';
import { playMorseFromText } from './morse.sound.js';

const NO_INPUT_MESSAGE = 'No input: pass one or more files, use --text "…", or pipe text on stdin.';

/** Arguments shared by every command. */
interface CommonArgs {
  files?: unknown;
  text?: string;
}

interface PlayArgs extends CommonArgs {
  out?: string;
  play?: boolean;
  frequency?: number;
  unitMs?: number;
}

/**
 * yargs' positional/option generics do not survive being threaded through a
 * helper, so commands read their arguments through these narrow views instead.
 */
function asCommonArgs(argv: unknown): CommonArgs {
  return argv as CommonArgs;
}

function asPlayArgs(argv: unknown): PlayArgs {
  return argv as PlayArgs;
}

/** Shared `--text` option so every command accepts inline input. */
function withTextOption(builder: Argv): Argv {
  return builder.option('text', {
    alias: 't',
    describe: 'Read input from this string instead of files or stdin',
    type: 'string',
  });
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string' && value.length > 0) return [value];
  return [];
}

/**
 * Print read failures and return only the usable sources. A failed source never
 * aborts the others; it only affects the exit code.
 */
function reportFailures(sources: InputSource[]): InputSource[] {
  const usable: InputSource[] = [];

  for (const source of sources) {
    if (source.error !== null || source.text === null) {
      console.error(`Error: ${source.error ?? `${source.label}: unreadable`}`);
      process.exitCode = 1;
    } else {
      usable.push(source);
    }
  }

  return usable;
}

async function collectInputs(argv: unknown): Promise<InputSource[] | null> {
  const args = asCommonArgs(argv);
  const sources = await resolveInputs({ files: toStringArray(args.files), text: args.text });

  if (sources.length === 0) {
    console.error(NO_INPUT_MESSAGE);
    process.exitCode = 1;
    return null;
  }

  return reportFailures(sources);
}

/** Only label output when there is more than one source to disambiguate. */
function printSection(label: string, body: string, showLabel: boolean): void {
  if (showLabel) {
    console.log(`--- ${label} ---`);
  }
  console.log(body);
}

/**
 * Give each input its own WAV path so a multi-file run does not overwrite
 * itself: `out.wav` becomes `out-1.wav`, `out-2.wav`, …
 */
function outPathFor(outFile: string, index: number, total: number): string {
  if (total <= 1) return outFile;

  const extension = path.extname(outFile);
  const base = outFile.slice(0, outFile.length - extension.length);

  return `${base}-${index + 1}${extension || '.wav'}`;
}

await yargs(hideBin(process.argv))
  .scriptName('morse_it')
  .command(
    'encode [files..]',
    'Convert text to Morse code',
    (builder) =>
      withTextOption(builder.positional('files', { describe: 'Files to encode', type: 'string' })),
    async (argv) => {
      const sources = await collectInputs(argv);
      if (!sources) return;

      const showLabels = sources.length > 1;

      for (const source of sources) {
        const { output, skipped } = translateTextToMorse(source.text as string);

        printSection(source.label, output || '[empty or unsupported characters]', showLabels);

        if (skipped.length > 0) {
          console.warn(`Skipped characters in ${source.label}: ${skipped.join(', ')}`);
        }
      }
    }
  )
  .command(
    'decode [files..]',
    'Convert Morse code back to text',
    (builder) =>
      withTextOption(builder.positional('files', { describe: 'Files to decode', type: 'string' })),
    async (argv) => {
      const sources = await collectInputs(argv);
      if (!sources) return;

      const showLabels = sources.length > 1;

      for (const source of sources) {
        const { output, skipped } = translateMorseToText(source.text as string);

        printSection(source.label, output || '[no decodable Morse found]', showLabels);

        if (skipped.length > 0) {
          console.warn(`Unknown Morse patterns in ${source.label}: ${skipped.join(', ')}`);
        }
      }
    }
  )
  .command(
    'play [files..]',
    'Play text as Morse code audio',
    (builder) =>
      withTextOption(
        builder
          .positional('files', { describe: 'Files to play as Morse code', type: 'string' })
          .option('out', {
            alias: 'o',
            describe:
              'Write a WAV file to this path (kept even if playback succeeds). ' +
              'With several inputs, a -1, -2, … suffix is added.',
            type: 'string',
          })
          .option('play', {
            describe: 'Attempt to play the generated WAV (best-effort, cross-platform)',
            type: 'boolean',
            default: true,
          })
          .option('frequency', {
            alias: 'f',
            describe: 'Beep frequency in Hz',
            type: 'number',
            default: 800,
          })
          .option('unitMs', {
            alias: 'u',
            describe: 'Morse time unit in milliseconds (dot = 1 unit, dash = 3 units)',
            type: 'number',
            default: 80,
          })
      ),
    async (argv) => {
      const args = asPlayArgs(argv);
      const shouldPlay = args.play !== false;
      const frequencyHz = args.frequency ?? 800;
      const unitMs = args.unitMs ?? 80;

      if (!shouldPlay && !args.out) {
        console.error('Nothing to do: use playback (default) or provide --out to save a WAV file.');
        process.exitCode = 1;
        return;
      }

      if (!Number.isFinite(frequencyHz) || frequencyHz <= 0) {
        console.error('Invalid --frequency: expected a positive number of hertz.');
        process.exitCode = 1;
        return;
      }

      if (!Number.isFinite(unitMs) || unitMs <= 0) {
        console.error('Invalid --unitMs: expected a positive number of milliseconds.');
        process.exitCode = 1;
        return;
      }

      const sources = await collectInputs(argv);
      if (!sources) return;

      const showLabels = sources.length > 1;

      for (let index = 0; index < sources.length; index += 1) {
        const source = sources[index] as InputSource;
        const text = source.text as string;

        if (showLabels) {
          console.log(`--- ${source.label} ---`);
        }

        // Same table as `encode`, so both commands agree on what is unsupported.
        const { skipped } = translateTextToMorse(text);
        if (skipped.length > 0) {
          console.warn(`Skipped characters in ${source.label}: ${skipped.join(', ')}`);
        }

        const result = await playMorseFromText(text, {
          frequencyHz,
          unitMs,
          outFile: args.out ? outPathFor(args.out, index, sources.length) : undefined,
          play: shouldPlay,
        });

        if (result.wavPath) {
          // Only blame playback when playback was actually attempted.
          console.log(
            !shouldPlay || result.played
              ? `WAV saved to: ${result.wavPath}`
              : `Could not auto-play audio. WAV saved to: ${result.wavPath}`
          );
        } else if (shouldPlay && !result.played) {
          console.warn(
            'Could not auto-play audio. No file was kept on disk. ' +
              'Install an audio player (macOS: afplay, Linux: paplay/aplay, or ffplay) or use --out.'
          );
        }
      }
    }
  )
  .demandCommand(1, 'Pick a command: encode, decode or play.')
  .strict()
  .fail((message, error, instance) => {
    // Keep failures readable: usage on argument errors, a single line otherwise.
    if (error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error(instance.help());
      console.error(`\n${message}`);
    }
    process.exit(1);
  })
  .help()
  .parseAsync();
