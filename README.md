# morse_me

CLI Node.js/TypeScript pour convertir des fichiers texte en code Morse.

## 🚀 Aperçu

- Interface de ligne de commande basée sur `yargs` (`morse_it`).
- Conversion caractère par caractère grâce à la table complète définie dans `library.ts`.
- Signalement des caractères non pris en charge pour faciliter le nettoyage des données.

## 📦 Prérequis

- Node.js ≥ 20
- npm ≥ 10

Vérifie tes versions :

```bash
node --version
npm --version
```

## 🔧 Installation

```bash
git clone <repo-url>
cd morse_me
npm install
```

## 🛠️ Scripts npm

| Script | Description |
|--------|-------------|
| `npm run build` | Compile TypeScript vers `dist/` via `tsc`. |
| `npm start` | Exécute la version compilée (`node dist/index.js`). |
| `npm test` | Placeholder qui affiche un message (à remplacer par ta suite de tests). |
| `npm run prepublishOnly` | Compile automatiquement avant une publication npm. |

## 🔁 Utilisation du CLI

1. Compile d’abord :
	```bash
	npm run build
	```
2. Exemple de traduction d’un fichier :
	```bash
	node dist/index.js encode README.md
	```
	Le résultat affiche un bloc par fichier et indique les caractères ignorés (`Skipped characters`).
3. Lecture audio (génère un WAV et tente de le jouer) :
	```bash
	node dist/index.js play README.md
	```
	Pour garder le fichier WAV :
	```bash
	node dist/index.js play README.md --out morse.wav
	```

### Alias binaire `morse_it`

- Installation locale : `npm link`
- Utilisation :
  ```bash
  morse_it encode chemin/vers/fichier.txt
  ```

### Remarques

- Les caractères non présents dans `library.ts` sont signalés mais ignorés dans la sortie.
- Pour un format pur texte, la table Morse emploie déjà `.` et `-`.

## 🧪 Tests

`npm test` renvoie pour l’instant « No automated tests defined yet ». Remplace la commande par Jest, Vitest ou tout autre framework lorsque tu ajoutes des tests.

## 🐳 Dev Container

Fichier : `.devcontainer/devcontainer.json`

1. Ouvre le dossier dans VS Code.
2. Menu Command Palette → « Dev Containers: Reopen in Container ».
3. `npm install` est lancé automatiquement (Node 20, extensions ESLint/Prettier/TS incluses).

## 🔄 Intégration Continue

Le workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) effectue :

1. `npm ci`
2. `npm run lint:fix` (en mode tolérant)
3. `npm run build`
4. `npm test`
5. Un smoke test du CLI

Adapter `npm test` pour refléter ta vraie suite avant de faire confiance aux pipelines.

## 📁 Structure rapide

| Chemin | Rôle |
|--------|------|
| `index.ts` | Point d’entrée du CLI et définition de la commande `encode`. |
| `read.files.ts` | Lecture asynchrone des fichiers à encoder. |
| `translate.files.ts` | Conversion du texte en séquences Morse et rapport des caractères ignorés. |
| `library.ts` | Table Morse (pattern et timings). |
| `cli.mjs` | Shim Node utilisé par le binaire publié `morse_it`. |

## 📄 Licence

ISC