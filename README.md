# morse_me

CLI et bibliothèque Node.js/TypeScript pour encoder du texte en code Morse, le décoder, et le jouer en audio.

## 🚀 Aperçu

- CLI `morse_it` basée sur `yargs`, avec trois commandes : `encode`, `decode`, `play`.
- Entrée au choix : fichiers, option `--text`, ou texte redirigé sur stdin.
- Table Morse complète (lettres, chiffres, accents, ponctuation) définie dans `library.ts`.
- Signalement des caractères non pris en charge, à l'encodage comme à la lecture audio.
- Génération de WAV PCM 16 bits mono, sans dépendance native.
- Utilisable aussi comme bibliothèque : `import { translateTextToMorse } from '@aubain-nicolas/morse-me'`.

## 📦 Prérequis

- Node.js ≥ 20
- npm ≥ 10

```bash
node --version
npm --version
```

## 🔧 Installation

Depuis npm :

```bash
npm install -g @aubain-nicolas/morse-me
morse_it encode --text "SOS"
```

Depuis les sources :

```bash
git clone https://github.com/Aubain-web/morse_me.git
cd morse_me
npm install
npm run build
node cli.mjs encode --text "SOS"
```

## 🔁 Utilisation du CLI

Les trois commandes acceptent les mêmes sources d'entrée, dans cet ordre de priorité :
`--text`, puis les fichiers passés en argument, puis stdin.

### `encode` — texte → Morse

```bash
morse_it encode fichier.txt
morse_it encode --text "SOS MORSE ME"
echo "SOS" | morse_it encode
```

Les mots sont séparés par `/`, les lettres par une espace, et la structure des lignes est
préservée. Les caractères absents de la table sont ignorés dans la sortie et listés sur stderr
(`Skipped characters: …`).

### `decode` — Morse → texte

```bash
morse_it decode --text "... --- ... / -- --- .-. ... ."
# SOS MORSE
```

`/` et `|` sont acceptés comme séparateurs de mots. Les motifs inconnus sont ignorés et listés
sur stderr.

### `play` — lecture audio

```bash
morse_it play fichier.txt                       # joue le Morse, sans rien laisser sur le disque
morse_it play --text "SOS" --out morse.wav      # joue ET conserve le WAV
morse_it play fichier.txt --no-play --out m.wav # génère le WAV sans le jouer
```

| Option                 | Alias | Défaut | Rôle                                                   |
| ---------------------- | ----- | ------ | ------------------------------------------------------ |
| `--out`                | `-o`  | —      | Chemin du WAV à conserver.                             |
| `--play` / `--no-play` | —     | `true` | Tenter (ou non) la lecture audio.                      |
| `--frequency`          | `-f`  | `800`  | Fréquence du bip, en Hz.                               |
| `--unitMs`             | `-u`  | `80`   | Durée d'une unité Morse, en ms (point = 1, trait = 3). |

Sans `--out`, le WAV est temporaire et supprimé après lecture. Avec plusieurs fichiers en entrée,
`--out morse.wav` produit `morse-1.wav`, `morse-2.wav`, … afin qu'aucune sortie n'en écrase une autre.

#### Dépannage audio (selon l'OS)

La lecture passe par un outil système :

- **Windows** : PowerShell `System.Media.SoundPlayer` (disponible par défaut).
- **macOS** : `afplay` (fourni par défaut).
- **Linux** : `paplay`, puis `aplay`, puis `ffplay`.

Sur Linux, installe au moins l'un d'entre eux : `pulseaudio-utils` (`paplay`), `alsa-utils`
(`aplay`) ou `ffmpeg` (`ffplay`). En cas de doute, exporte un WAV et ouvre-le avec ton lecteur
habituel :

```bash
morse_it play fichier.txt --no-play --out morse.wav
```

## 📚 Utilisation comme bibliothèque

Le point d'entrée du paquet n'exécute pas le CLI : il n'expose que l'API.

```ts
import {
  translateTextToMorse,
  translateMorseToText,
  playMorseFromText,
  MORSE_CODE,
} from '@aubain-nicolas/morse-me';

translateTextToMorse('SOS');
// { output: '... --- ...', skipped: [] }

translateMorseToText('... --- ...');
// { output: 'SOS', skipped: [] }

await playMorseFromText('SOS', { outFile: 'sos.wav', play: false });
// { wavPath: '/chemin/absolu/sos.wav', played: false }
```

Principaux exports : `translateTextToMorse`, `translateMorseToText`, `playMorseFromText`,
`buildBeepSchedule`, `renderMorseWavSamples`, `encodeWavPcm16Mono`, `readFiles`, `resolveInputs`,
`MORSE_CODE`, `MORSE_PATTERNS`, `MORSE_BY_PATTERN`, `TIMING`.

### Timings

Les durées suivent le standard Morse, exprimées en unités (`TIMING`) :

| Élément                                  | Unités |
| ---------------------------------------- | ------ |
| Point                                    | 1      |
| Trait                                    | 3      |
| Silence entre symboles d'une même lettre | 1      |
| Silence entre deux lettres               | 3      |
| Silence entre deux mots                  | 7      |

Les silences ne s'additionnent pas : la séparation entre deux mots vaut exactement 7 unités, pas
3 + 7. Une séquence ne commence ni ne se termine par du silence.

## 🛠️ Scripts npm

| Script                   | Description                                                     |
| ------------------------ | --------------------------------------------------------------- |
| `npm run build`          | Nettoie `dist/` puis compile TypeScript via `tsc`.              |
| `npm run clean`          | Supprime `dist/`.                                               |
| `npm start`              | Lance le CLI (`node cli.mjs`).                                  |
| `npm run lint`           | Analyse le code avec ESLint (config plate `eslint.config.mts`). |
| `npm run lint:fix`       | Analyse et corrige automatiquement ce qui peut l'être.          |
| `npm run format`         | Formate le code avec Prettier.                                  |
| `npm run format:check`   | Vérifie le formatage sans modifier les fichiers.                |
| `npm test`               | Compile puis exécute la suite de tests via `node --test`.       |
| `npm run prepublishOnly` | Compile automatiquement avant une publication npm.              |

## 🧪 Tests

```bash
npm test
```

La suite couvre la table Morse et sa cohérence, l'encodage, le décodage, les aller-retours
texte → Morse → texte, la planification des bips, la génération WAV, la lecture de fichiers et le
CLI de bout en bout (via `child_process`).

## 🐳 Dev Container

Fichier : `.devcontainer/devcontainer.json` (Node 22, extensions ESLint/Prettier/TS).

1. Ouvre le dossier dans VS Code.
2. Command Palette → « Dev Containers: Reopen in Container ».
3. `npm install` est lancé automatiquement.

## 🔄 Intégration continue

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) s'exécute sur chaque push et chaque PR,
avec une matrice Node 20/22/24 sur Linux plus macOS et Windows :

1. `npm ci`
2. `npm run format:check`
3. `npm run lint`
4. `npm run build`
5. `npm test`
6. Un smoke test du CLI, qui vérifie aussi que l'import du point d'entrée n'exécute pas le CLI.

## 📦 Publication

[`.github/workflows/publish.yml`](.github/workflows/publish.yml) publie sur npm avec provenance
lorsqu'un tag `v*` est poussé. Le workflow refuse de publier si le tag ne correspond pas à
`package.json`. Pour publier une version :

```bash
npm version <patch|minor|major>
git push --follow-tags
```

## 📁 Structure

| Chemin               | Rôle                                                           |
| -------------------- | -------------------------------------------------------------- |
| `index.ts`           | Point d'entrée de la bibliothèque (ré-exports uniquement).     |
| `cli.ts`             | Définition du CLI et des commandes `encode`, `decode`, `play`. |
| `cli.mjs`            | Shim Node utilisé par le binaire publié `morse_it`.            |
| `library.ts`         | Table Morse : motifs, timings dérivés et table inverse.        |
| `translate.files.ts` | Encodage texte → Morse et décodage Morse → texte.              |
| `read.files.ts`      | Lecture des fichiers, avec erreurs rapportées par fichier.     |
| `input.ts`           | Résolution de la source d'entrée (`--text`, fichiers, stdin).  |
| `morse.sound.ts`     | Planification des bips, rendu WAV et lecture multiplateforme.  |
| `tests/`             | Suite de tests `node --test`.                                  |

## 📄 Licence

ISC — voir [LICENSE](LICENSE).
