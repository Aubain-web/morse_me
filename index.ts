import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { readFiles } from './read.files.js';
import { translateTextToMorse } from './translate.files.js';
import { playMorseFromText } from './morse.sound.js';

yargs(hideBin(process.argv))
  .command(
    'encode <files..>',
    'Convert file contents to Morse code',
    (yargs) =>
      yargs.positional('files', {
        describe: 'Files to encode',
        type: 'string',
      }),
    async (argv) => {
      const files = Array.isArray(argv.files) ? argv.files : (argv.files ? [argv.files] : []);
      const targetFiles = files as string[];
      const contents = await readFiles(targetFiles);

      contents.forEach((text, index) => {
        const file = targetFiles[index];
        const { output, skipped } = translateTextToMorse(text);

        console.log(`--- ${file} ---`);
        if (output) {
          console.log(output);
        } else {
          console.log('[empty or unsupported characters]');
        }

        if (skipped.length > 0) {
          console.warn(`Skipped characters in ${file}: ${skipped.join(', ')}`);
        }
      });
    }
  )
  .command(
    'play <files..>',
    'Play file contents as Morse code audio',
    (yargs) =>
      yargs
        .positional('files', {
          describe: 'Files to play as Morse code',
          type: 'string',
        })
        .option('out', {
          alias: 'o',
          describe: 'Write a WAV file to this path (kept even if playback succeeds)',
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
        }),
    async (argv) => {
      const files = Array.isArray(argv.files) ? argv.files : (argv.files ? [argv.files] : []);
      const targetFiles = files as string[];
      const contents = await readFiles(targetFiles);

      for (let index = 0; index < contents.length; index += 1) {
        const file = targetFiles[index];
        const text = contents[index] ?? '';

        console.log(`--- ${file} ---`);
        const result = await playMorseFromText(text, {
          frequencyHz: argv.frequency as number,
          unitMs: argv.unitMs as number,
          outFile: (argv.out as string | undefined) || undefined,
          play: argv.play as boolean,
        });

        if (result.wavPath && (argv.play as boolean) === false) {
          console.log(`WAV saved to: ${result.wavPath}`);
        } else if (!result.played) {
          if (result.wavPath) {
            console.warn(`Could not auto-play audio. WAV saved to: ${result.wavPath}`);
          } else {
            console.warn('Nothing to play (empty or unsupported characters).');
          }
        }
      }
    }
  )
  .demandCommand(1)
  .strict()
  .help()
  .parse();
