# morse_me

CLI et bibliothèque Node.js/TypeScript pour encoder du texte en code Morse, le décoder, et le
jouer en audio. Sans dépendance native.

Node.js ≥ 20.

## Installation

```bash
npm install -g @aubain-nicolas/morse-me
morse_it encode --text "SOS"
```

## CLI

Les trois commandes acceptent les mêmes sources d'entrée, dans cet ordre de priorité :
`--text`, puis les fichiers passés en argument, puis stdin.

```bash
morse_it encode --text "SOS MORSE ME"          # ... --- ... / -- --- .-. ... . / -- .
morse_it decode --text "... --- ..."           # SOS
echo "SOS" | morse_it encode
morse_it play fichier.txt                      # joue le Morse
morse_it play --text "SOS" --out morse.wav     # joue ET conserve le WAV
```

Options de `play` :

| Option                 | Alias | Défaut | Rôle                                                   |
| ---------------------- | ----- | ------ | ------------------------------------------------------ |
| `--out`                | `-o`  | —      | Chemin du WAV à conserver.                             |
| `--play` / `--no-play` | —     | `true` | Tenter (ou non) la lecture audio.                      |
| `--frequency`          | `-f`  | `800`  | Fréquence du bip, en Hz.                               |
| `--unitMs`             | `-u`  | `80`   | Durée d'une unité Morse, en ms (point = 1, trait = 3). |

La lecture passe par un outil système : PowerShell sur Windows, `afplay` sur macOS, `paplay` /
`aplay` / `ffplay` sur Linux. Si aucun n'est disponible, exporte un WAV avec `--no-play --out`.

## Bibliothèque

Le point d'entrée du paquet n'exécute pas le CLI : il n'expose que l'API.

```ts
import {
  translateTextToMorse,
  translateMorseToText,
  playMorseFromText,
} from '@aubain-nicolas/morse-me';

translateTextToMorse('SOS'); // { output: '... --- ...', skipped: [] }
translateMorseToText('... --- ...'); // { output: 'SOS', skipped: [] }

await playMorseFromText('SOS', { outFile: 'sos.wav', play: false });
// { wavPath: '/chemin/absolu/sos.wav', played: false }
```

Autres exports : `buildBeepSchedule`, `renderMorseWavSamples`, `encodeWavPcm16Mono`, `readFiles`,
`resolveInputs`, `MORSE_CODE`, `MORSE_PATTERNS`, `MORSE_BY_PATTERN`, `TIMING`.

## Documentation complète

Table Morse, timings, dépannage audio, développement et contribution :
**[github.com/Aubain-web/morse_me](https://github.com/Aubain-web/morse_me#readme)**

## Licence

ISC — voir [LICENSE](https://github.com/Aubain-web/morse_me/blob/main/LICENSE).
