# Fonctionnalité de Progression par Extension

## Vue d'ensemble

Système de suivi de progression pour les extensions Pokémon, inspiré de Pokecardex, avec deux modes de comptage :
- **Mode Base** : 1 exemplaire suffit (peu importe la version)
- **Mode Masterset** : Toutes les versions nécessaires (Normale, Holo, Reverse, etc.)

## Composants créés

### 1. SetProgressBar.jsx
`src/components/features/collection/SetProgressBar.jsx`

**Fonctionnalités** :
- Barre de progression avec gradient doré (`from-amber-500 via-yellow-400 to-amber-300`)
- Compteur format `owned/total` + pourcentage
- Support des modes Base et Masterset
- 3 tailles : small, medium, large

**Props** :
```javascript
{
  setId: string,              // ID de l'extension (ex: "sv8")
  collection: Array,          // Collection utilisateur
  discoveredCards: Array,     // Base de données complète
  mastersetMode: boolean,     // Mode Masterset activé
  size: 'small' | 'medium' | 'large'
}
```

**Calcul** :
- **Mode Base** : Compte les cartes uniques possédées (1 Pikachu = 1 carte)
- **Mode Masterset** : Compte toutes les versions de chaque carte
  - Pikachu avec 5 versions disponibles = besoin de 5 versions pour 5/5

### 2. RarityProgressIcons.jsx
`src/components/features/collection/RarityProgressIcons.jsx`

**Fonctionnalités** :
- Icônes de rareté avec compteurs individuels
- Affichées UNIQUEMENT dans la vue détaillée d'une extension
- Groupement automatique par rareté
- **Contrôlable par admin** : Peut être masqué via Admin → Gestion de l'Interface

**Raretés supportées** :
- 🔵 Common (Commune)
- 💎 Uncommon (Peu commune)
- ⭐ Rare
- ⭐ Rare Holo (rempli)
- ✨ Ultra Rare (Illustration Rare, Special Illustration)
- ✨ Secret Rare (Rainbow, Gold, Hyper Rare) (rempli)
- 💗 Promo

**Props** :
```javascript
{
  setId: string,
  collection: Array,
  discoveredCards: Array,
  mastersetMode: boolean
}
```

## Paramètres

### Toggle Mode Masterset
`src/pages/Settings.jsx` - Nouvelle section "Affichage Collection"

**Emplacement** : Paramètres → Affichage Collection → Mode Masterset

**Hook** : `useSettings()` - nouveau paramètre `settings.mastersetMode`

**Persistance** : localStorage par utilisateur (`vaultestim_settings_{userId}`)

### Toggle Icônes de Rareté (Admin)
`src/pages/AdminInterface.jsx` - Contrôle administrateur de l'interface

**Emplacement** : Admin → Gestion de l'Interface → Afficher les icônes de rareté

**Hook** : `useSettings()` - nouveau paramètre `settings.showRarityIcons`

**Comportement** :
- `true` (défaut) : Affiche les icônes de rareté (●◆★) dans la progression
- `false` : Cache complètement le composant RarityProgressIcons

**Persistance** : localStorage par utilisateur (`vaultestim_settings_{userId}`)

## Interface Administrateur

### Page Gestion de l'Interface
`src/pages/AdminInterface.jsx` - Contrôle administrateur des options visuelles

**Accès** : Navigation → Administration → Gestion de l'Interface

**Fonctionnalités** :
- Toggle "Afficher les icônes de rareté"
- Bouton retour vers le tableau de bord admin
- Card avec explications détaillées de chaque option

**Route** : `/admin/interface` (configurée dans `src/App.jsx:83`)

**Navigation** : Ajouté dans `src/constants/navigation.js:77` avec icône Palette

## Intégrations

### 1. Explorer les Séries (Explore.jsx)
**Emplacement** : Sous le nom de chaque extension dans la liste

**Code** :
```javascript
<SetProgressBar
  setId={extension.id}
  collection={collection}
  discoveredCards={discoveredCards}
  mastersetMode={settings.mastersetMode}
  size="small"
/>
```

**Localisation** : `src/pages/Explore.jsx:690-696`

### 2. Vue Détaillée d'Extension (SeriesDetailView.jsx)
**Emplacements** :
- Barre de progression dans l'en-tête de chaque extension
- Icônes de rareté sous la barre de progression

**Code** :
```javascript
{/* Barre de progression */}
<SetProgressBar
  setId={set.id}
  collection={collection}
  discoveredCards={discoveredCards}
  mastersetMode={settings.mastersetMode}
  size="medium"
/>

{/* Icônes de rareté */}
<RarityProgressIcons
  setId={set.id}
  collection={collection}
  discoveredCards={discoveredCards}
  mastersetMode={settings.mastersetMode}
/>
```

**Localisation** : `src/components/features/explore/SeriesDetailView.jsx:228-242`

### 3. Ma Collection (Collection.jsx)
**Emplacement** : Sous l'en-tête de chaque extension (centré)

**Code** :
```javascript
<div className="max-w-md mx-auto">
  <SetProgressBar
    setId={extension.cards[0]?.set?.id || extension.cards[0]?.extension}
    collection={collection}
    discoveredCards={discoveredCards}
    mastersetMode={settings.mastersetMode}
    size="small"
  />
</div>
```

**Localisation** : `src/pages/Collection.jsx:345-353`

## Utilisation

### Pour l'utilisateur

1. **Mode Base (défaut)** :
   - Aller dans Paramètres → Affichage Collection
   - Toggle "Mode Masterset" désactivé
   - Progression : Avoir 1 exemplaire de chaque carte suffit

2. **Mode Masterset** :
   - Aller dans Paramètres → Affichage Collection
   - Activer le toggle "Mode Masterset"
   - Progression : Besoin de toutes les versions de chaque carte

### Pour l'administrateur

1. **Afficher/Masquer les icônes de rareté** :
   - Aller dans Admin → Gestion de l'Interface
   - Toggle "Afficher les icônes de rareté"
   - Activé (défaut) : Icônes ●◆★ visibles avec compteurs
   - Désactivé : Seule la barre de progression reste visible

### Exemple de calcul

**Extension avec 10 cartes** :
- 5 cartes normales (5 versions chacune : Normale, Reverse, Holo, Holo Cosmos, Tampon)
- 3 cartes EX (1 version unique)
- 2 cartes Full Art (1 version unique)

**Mode Base** :
- Total : 10 cartes
- Si vous possédez 7 cartes différentes : 7/10 = 70%

**Mode Masterset** :
- Total : (5 × 5) + (3 × 1) + (2 × 1) = 30 versions
- Si vous possédez :
  - 3 cartes normales avec toutes les versions : 3 × 5 = 15
  - 2 cartes normales avec 3 versions chacune : 2 × 3 = 6
  - 2 cartes EX : 2
  - 1 carte Full Art : 1
  - Total : 24/30 = 80%

## Design

### Barre de progression
- **Gradient** : `from-amber-500 via-yellow-400 to-amber-300` (cohérent avec le thème doré)
- **Fond** : `bg-secondary/50`
- **Animation** : Transition smooth 500ms
- **Compteur** : Aligné à droite avec `owned/total` + `percentage%`

### Icônes de rareté
- **Disposition** : Flexbox avec wrap
- **Style** : Fond `bg-secondary/30`, padding 2, rounded-md
- **Icônes** : lucide-react (Circle, Gem, Star, Sparkles)
- **Couleurs** : Codes couleur par rareté (gray, green, blue, purple, yellow, amber, pink)

## Tests recommandés

1. **Mode Base** :
   - [ ] Vérifier que 1 exemplaire d'une carte compte pour 1/1
   - [ ] Vérifier que plusieurs versions de la même carte comptent toujours pour 1/1

2. **Mode Masterset** :
   - [ ] Vérifier que chaque version compte séparément
   - [ ] Vérifier que les cartes spéciales (EX, Full Art) comptent pour 1 version unique
   - [ ] Vérifier que les cartes normales comptent pour 5 versions possibles

3. **Persistance** :
   - [ ] Vérifier que le toggle Masterset persiste après rafraîchissement
   - [ ] Vérifier que le mode est bien sauvegardé par utilisateur

4. **Affichage** :
   - [ ] Vérifier l'affichage dans Explore → Liste extensions
   - [ ] Vérifier l'affichage dans Explore → Détail extension (avec icônes rareté)
   - [ ] Vérifier l'affichage dans Ma Collection → En-têtes extensions

5. **Performance** :
   - [ ] Vérifier que les calculs ne ralentissent pas l'interface
   - [ ] Tester avec une grosse collection (>1000 cartes)

## Améliorations futures possibles

1. **Animations** :
   - Animation de remplissage de la barre au chargement
   - Confettis à 100% de complétion

2. **Statistiques** :
   - Graphique de progression globale (tous blocs)
   - Classement des extensions les mieux complétées

3. **Filtres** :
   - Filtrer par taux de complétion (0-25%, 25-50%, 50-75%, 75-100%)
   - Filtrer par raretés manquantes

4. **Notifications** :
   - Alerte quand une extension atteint 100%
   - Suggestions de cartes à rechercher pour compléter

## Notes techniques

### Gestion des versions
La fonction `getAvailableVersionsForCard()` dans `SetProgressBar.jsx` est une version simplifiée.
Pour une logique complète, utiliser `getAvailableVersions()` depuis `src/utils/cardVersions.js`.

### Performance
Les calculs utilisent `useMemo` pour éviter les recalculs inutiles.
Les dépendances sont : `setId`, `collection`, `discoveredCards`, `mastersetMode`.

### Compatibilité
Testé avec React 18 + Vite. Compatible avec tous les navigateurs modernes.

---

## Fichiers Modifiés

### Composants Créés
- `src/components/features/collection/SetProgressBar.jsx` - Barre de progression
- `src/components/features/collection/RarityProgressIcons.jsx` - Icônes de rareté
- `src/pages/AdminInterface.jsx` - Page admin pour contrôler l'affichage

### Fichiers Modifiés
- `src/pages/Settings.jsx` - Ajout toggle Mode Masterset
- `src/pages/Explore.jsx` - Intégration barres de progression + icônes rareté
- `src/components/features/explore/SeriesDetailView.jsx` - Intégration dans vue détaillée
- `src/pages/Collection.jsx` - Intégration dans Ma Collection
- `src/pages/Admin.jsx` - Ajout module "Gestion de l'Interface" + grille 4 colonnes
- `src/App.jsx` - Ajout route `/admin/interface`
- `src/constants/navigation.js` - Ajout item "Gestion de l'Interface" dans sidebar
- `src/hooks/useSettings.jsx` - Ajout paramètres `mastersetMode` et `showRarityIcons`

### Base de Données
- Aucune modification Supabase requise
- Utilise uniquement les colonnes existantes (`rarity`, `set`, `extension`)

---

**Dernière mise à jour** : 2025-11-24
**Version** : 1.0.0
**Statut** : ✅ Complet et fonctionnel
