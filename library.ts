interface MorseCode {
  char: string;
  pattern: string;
  timing: number[];
}

const MORSE_CODE: Record<string, MorseCode> = {
  'A': { char: 'A', pattern: '•—', timing: [1, 1, 3] },
  'B': { char: 'B', pattern: '—•••', timing: [3, 1, 1, 1, 1, 1, 1] },
  'C': { char: 'C', pattern: '—•—•', timing: [3, 1, 1, 1, 3, 1, 1] },
  'D': { char: 'D', pattern: '—••', timing: [3, 1, 1, 1, 1, 1] },
  'E': { char: 'E', pattern: '•', timing: [1] },
  'F': { char: 'F', pattern: '••—•', timing: [1, 1, 1, 1, 3, 1, 1] },
  'G': { char: 'G', pattern: '——•', timing: [3, 1, 3, 1, 1] },
  'H': { char: 'H', pattern: '••••', timing: [1, 1, 1, 1, 1, 1, 1] },
  'I': { char: 'I', pattern: '••', timing: [1, 1, 1] },
  'J': { char: 'J', pattern: '•———', timing: [1, 1, 3, 1, 3, 1, 3] },
  'K': { char: 'K', pattern: '—•—', timing: [3, 1, 1, 1, 3] },
  'L': { char: 'L', pattern: '•—••', timing: [1, 1, 3, 1, 1, 1, 1] },
  'M': { char: 'M', pattern: '——', timing: [3, 1, 3] },
  'N': { char: 'N', pattern: '—•', timing: [3, 1, 1] },
  'O': { char: 'O', pattern: '———', timing: [3, 1, 3, 1, 3] },
  'P': { char: 'P', pattern: '•——•', timing: [1, 1, 3, 1, 3, 1, 1] },
  'Q': { char: 'Q', pattern: '——•—', timing: [3, 1, 3, 1, 1, 1, 3] },
  'R': { char: 'R', pattern: '•—•', timing: [1, 1, 3, 1, 1] },
  'S': { char: 'S', pattern: '•••', timing: [1, 1, 1, 1, 1] },
  'T': { char: 'T', pattern: '—', timing: [3] },
  'U': { char: 'U', pattern: '••—', timing: [1, 1, 1, 1, 3] },
  'V': { char: 'V', pattern: '•••—', timing: [1, 1, 1, 1, 1, 1, 3] },
  'W': { char: 'W', pattern: '•——', timing: [1, 1, 3, 1, 3] },
  'X': { char: 'X', pattern: '—••—', timing: [3, 1, 1, 1, 1, 1, 3] },
  'Y': { char: 'Y', pattern: '—•——', timing: [3, 1, 1, 1, 3, 1, 3] },
  'Z': { char: 'Z', pattern: '——••', timing: [3, 1, 3, 1, 1, 1, 1] },
  'Á': { char: 'Á', pattern: '•——•—', timing: [1, 1, 3, 1, 3, 1, 1, 1, 3] },
  'Ä': { char: 'Ä', pattern: '•—•—', timing: [1, 1, 3, 1, 1, 1, 3] },
  'É': { char: 'É', pattern: '••—••', timing: [1, 1, 1, 1, 3, 1, 1, 1, 1] },
  'Ñ': { char: 'Ñ', pattern: '——•——', timing: [3, 1, 3, 1, 1, 1, 3, 1, 3] },
  'Ö': { char: 'Ö', pattern: '———•', timing: [3, 1, 3, 1, 3, 1, 1] },
  'Ü': { char: 'Ü', pattern: '••——', timing: [1, 1, 1, 1, 3, 1, 3] },
  '0': { char: '0', pattern: '—————', timing: [3, 1, 3, 1, 3, 1, 3, 1, 3] },
  '1': { char: '1', pattern: '•————', timing: [1, 1, 3, 1, 3, 1, 3, 1, 3] },
  '2': { char: '2', pattern: '••———', timing: [1, 1, 1, 1, 3, 1, 3, 1, 3] },
  '3': { char: '3', pattern: '•••——', timing: [1, 1, 1, 1, 1, 1, 3, 1, 3] },
  '4': { char: '4', pattern: '••••—', timing: [1, 1, 1, 1, 1, 1, 1, 1, 3] },
  '5': { char: '5', pattern: '•••••', timing: [1, 1, 1, 1, 1, 1, 1, 1, 1] },
  '6': { char: '6', pattern: '—••••', timing: [3, 1, 1, 1, 1, 1, 1, 1, 1] },
  '7': { char: '7', pattern: '——•••', timing: [3, 1, 3, 1, 1, 1, 1, 1, 1] },
  '8': { char: '8', pattern: '———••', timing: [3, 1, 3, 1, 3, 1, 1, 1, 1] },
  '9': { char: '9', pattern: '————•', timing: [3, 1, 3, 1, 3, 1, 3, 1, 1] },
  ',': { char: ',', pattern: '——••——', timing: [3, 1, 3, 1, 1, 1, 1, 1, 3, 1, 3] },
  '.': { char: '.', pattern: '•—•—•—', timing: [1, 1, 3, 1, 1, 1, 3, 1, 1, 1, 3] },
  '?': { char: '?', pattern: '••——••', timing: [1, 1, 1, 1, 3, 1, 3, 1, 1, 1, 1] },
  '"': { char: '"', pattern: '•—••—•', timing: [1, 1, 3, 1, 1, 1, 1, 1, 3, 1, 1] },
  ':': { char: ':', pattern: '———•••', timing: [3, 1, 3, 1, 3, 1, 1, 1, 1, 1, 1] },
  "'": { char: "'", pattern: '•————•', timing: [1, 1, 3, 1, 3, 1, 3, 1, 3, 1, 1] },
  '-': { char: '-', pattern: '—••••—', timing: [3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3] },
  '/': { char: '/', pattern: '—••—•', timing: [3, 1, 1, 1, 1, 1, 3, 1, 1] },
  '(': { char: '(', pattern: '—•——•', timing: [3, 1, 1, 1, 3, 1, 3, 1, 1] },
  ')': { char: ')', pattern: '—•——•—', timing: [3, 1, 1, 1, 3, 1, 3, 1, 1, 1, 3] }
};

const TIMING = {
  DOT: 1,
  DASH: 3,
  INTRA_CHAR_SPACE: 1,    
  LETTER_SPACE: 3,         
  WORD_SPACE: 7            
} as const;

export { MORSE_CODE, TIMING, type MorseCode };