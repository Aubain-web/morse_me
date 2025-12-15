import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
const argv = yargs(hideBin(process.argv)).parse()


yargs(hideBin(process.argv))
  .command('encode <text>', 'Convert text to Morse code', {}, (argv) => {
    console.log('Encoding:', argv.text);
  })
  .parse();

