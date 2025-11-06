# Dossier .scripts

Scripts utilitaires et de maintenance pour le projet.

## Structure

- **fixes/** : Scripts de corrections et patches
  - `fix-*.cjs` : Scripts Node.js pour corriger des bugs
  - `fix-*.patch` : Fichiers de patch Git
  - `apply-*.cjs` : Scripts d'application de corrections automatiques
  - `add-*.cjs` : Scripts d'ajout de fonctionnalités

- **deployment/** : Scripts de déploiement
  - `deploy.bat` : Script de déploiement Windows

- **Racine** : Scripts de test et utilitaires
  - `test-*.js` : Scripts de test de fonctionnalités
  - `fetch-*.js` : Scripts de récupération de données
  - `trainer-translations-template.js` : Template de traductions

## Usage

Exécuter avec Node.js :
```bash
node .scripts/nom-du-script.js
```

Ou avec `cjs` extension :
```bash
node .scripts/fixes/nom-du-fix.cjs
```
