import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { readFiles } from './read.files.js';
import { translateTextToMorse } from './translate.files.js';

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
  .demandCommand(1)
  .strict()
  .help()
  .parse();
