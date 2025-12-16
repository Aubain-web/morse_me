# morse_me

CLI Node.js/TypeScript pour encoder du texte en code Morse.

## Prérequis

- Node.js 20 ou version supérieure
- npm 10 ou version supérieure

## Installation

```bash
git clone <repo-url>
cd morse_me
npm install
```

## Compilation

```bash
npm run build
```

Le code compilé est placé dans `dist/` et publié via la commande `npm publish`.

## Utilisation du CLI

Après compilation, exécute la commande suivante :

```bash
npx morse_it encode "HELLO"
# ou
node dist/index.js encode "HELLO"
```

Le binaire `morse_it` sera disponible dans le dossier `node_modules/.bin` après installation. Les options additionnelles seront documentées au fur et à mesure de leur implémentation.

## Tests

Ajoute tes tests (ex. Jest, Mocha) puis exécute :

```bash
npm test
```

Par défaut, la commande est un placeholder ; adapte-la selon le framework que tu intègres.

## Développement

- Lint : `npm run lint` (ou `npm run lint:fix` si tu ajoutes un script correspondant)
- Build : `npm run build`
- Watch : ajoute un script `npm run dev` si besoin

## Devcontainer VS Code

Un devcontainer est disponible dans `.devcontainer/devcontainer.json`.

1. Ouvre le dossier dans VS Code.
2. Commande palette > "Dev Containers: Reopen in Container".
3. `npm install` est déclenché automatiquement dans le conteneur.

## Intégration Continue

Le workflow `.github/workflows/ci.yml` :

1. Installe les dépendances (`npm ci`).
2. Exécute le lint.
3. Compile le projet (`npm run build`).
4. Lance `npm test`.
5. Exécute un smoke test du CLI.

## Licence

ISC. Remplace cette section si tu utilises une autre licence.