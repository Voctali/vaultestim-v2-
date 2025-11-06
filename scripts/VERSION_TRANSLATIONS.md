# Scripts d'Incrémentation des Versions de Traductions

## 📖 Vue d'ensemble

Script pour **incrémenter automatiquement** les versions des dictionnaires de traductions (Pokémon et Dresseurs).

L'incrémentation de version invalide automatiquement le cache de recherche, garantissant que les nouvelles traductions sont immédiatement prises en compte.

## 🚀 Utilisation rapide

### Via NPM (recommandé)

\`\`\`bash
# Incrémenter les traductions de Dresseurs/Objets (patch: +0.0.1)
npm run version:trainer

# Incrémenter les traductions de Pokémon (patch: +0.0.1)
npm run version:pokemon

# Incrémenter les deux (patch: +0.0.1)
npm run version:both

# Incrémentation minor (+0.1.0) pour beaucoup de traductions
npm run version:trainer:minor
npm run version:pokemon:minor
npm run version:both:minor
\`\`\`

### Via Node directement

\`\`\`bash
# Format: node scripts/increment-translation-version.cjs [cible] [type]
node scripts/increment-translation-version.cjs trainer patch
node scripts/increment-translation-version.cjs pokemon minor
\`\`\`

## 📊 Types d'incrémentation

| Type | Quand | Exemple | Résultat |
|------|-------|---------|----------|
| **patch** | 1-5 traductions | \`1.1.0\` | \`1.1.1\` |
| **minor** | 10+ traductions | \`1.1.0\` | \`1.2.0\` |
| **major** | Refonte | \`1.1.0\` | \`2.0.0\` |

## 📝 Workflow

1. Ajoutez vos traductions
2. \`npm run version:trainer\`
3. \`git commit -m "feat: Ajout traductions"\`
4. Le cache sera invalidé automatiquement ! 🎉
