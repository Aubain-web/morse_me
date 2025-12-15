import {MORSE_CODE, TIMING, type MorseCode} from './library';
import readfiles from './readfiles';


async function TranslateToMorse (filePaths: string[]): Promise<(MorseCode | ' ')[ ]> {
  const contents = await readfiles(filePaths);
  const result: (MorseCode | ' ')[ ] = [];  
    for (const content of contents) {
        for (const char of content.toUpperCase()) {
            if (char === ' ') {
                result.push(' ');
            } else if (MORSE_CODE[char]) {
                result.push(MORSE_CODE[char]);
            }           
        }
    }       
    return result;
}
