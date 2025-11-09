# 🎴 VaultEstim v2

Application de gestion de collections de cartes Pokémon avec estimation de valeur en temps réel.

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![Cache](https://img.shields.io/badge/cache-2.0.0-green)
![Cartes](https://img.shields.io/badge/cartes-17,432-yellow)
![React](https://img.shields.io/badge/react-18.2.0-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/vite-7.1.7-646CFF?logo=vite)

---

## 📋 Table des Matières

- [Fonctionnalités Principales](#-fonctionnalités-principales)
- [Technologies Utilisées](#-technologies-utilisées)
- [Installation](#-installation)
- [Commandes Disponibles](#-commandes-disponibles)
- [Structure du Projet](#-structure-du-projet)
- [Documentation](#-documentation)
- [Déploiement](#-déploiement)

---

## ✨ Fonctionnalités Principales

### 🎨 Interface & UX
- **Thème sombre/doré** avec police Cinzel sophistiquée
- **Navigation responsive** desktop/mobile
- **Animations fluides** et transitions élégantes
- **Interface 100% française**

### 🗃️ Gestion de Collection
- **Base de données commune** : 17,432+ cartes partagées
- **Collection personnelle** : Gérez vos cartes possédées
- **Favoris & Wishlist** : Marquez vos cartes préférées
- **Doublons intelligents** : Détection automatique
- **Produits scellés** : Gestion des boosters et ETB

### 💰 Estimation de Valeur
- **Prix CardMarket** (EUR) et **TCGPlayer** (USD)
- **Actualisation automatique** quotidienne (150 cartes/jour)
- **Historique des prix** avec graphiques
- **Calcul valeur collection** instantané

### 🔍 Recherche Avancée
- **Recherche bilingue** FR/EN automatique
- **1060+ Pokémon** traduits (Gen 1-9)
- **230+ Dresseurs** traduits avec variantes
- **Filtrage par** : Bloc, Extension, Type, Rareté

### ⚡ Performance
- **Cache IndexedDB** avec chargement instantané (< 1s)
- **Versioning automatique** du cache
- **Synchronisation delta** des nouvelles cartes
- **Sync forcée manuelle** disponible

### 🔐 Authentification
- **Supabase Auth** sécurisé
- **Gestion de session** persistante
- **Profils utilisateurs** avec statistiques
- **Système de niveaux** (6 niveaux)

---

## 🛠️ Technologies Utilisées

| Catégorie | Technologies |
|-----------|--------------|
| **Frontend** | React 18, Vite 7, React Router v7 |
| **Styling** | Tailwind CSS, shadcn/ui (Radix UI) |
| **Backend** | Supabase (PostgreSQL, Auth, Storage) |
| **Cache** | IndexedDB avec versioning |
| **APIs** | Pokemon TCG API, CardMarket, TCGPlayer |
| **Déploiement** | Vercel (auto-deploy) |

---

## 📦 Installation

### Prérequis
- Node.js 18+ et npm
- Compte Supabase (gratuit)

### Étapes

1. **Cloner le repository**
```bash
git clone https://github.com/Voctali/vaultestim-v2-.git
cd vaultestim-v2
```

2. **Installer les dépendances**
```bash
npm install --legacy-peer-deps
```

3. **Configuration environnement**
Créer `.env` à la racine :
```env
VITE_POKEMON_TCG_API_KEY=votre_clé_api  # Optionnel
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_clé_anon_supabase
```

4. **Lancer le serveur de développement**
```bash
npm run dev
```

L'application sera disponible sur `http://localhost:5174`

---

## 🚀 Commandes Disponibles

### Développement
```bash
npm run dev          # Serveur de développement (port 5174)
npm run build        # Build production
npm run preview      # Prévisualiser le build
npm run lint         # Vérification ESLint
```

### Gestion du Cache
```bash
npm run check-cache-version      # Vérifier si CACHE_VERSION doit être incrémenté
npm run increment-cache-version  # Incrémenter automatiquement (minor)
npm run precommit                # Vérification avant commit
```

### Gestion des Données
```bash
npm run db:export    # Exporter les données
npm run db:import    # Importer les données
npm run db:verify    # Vérifier l'export
npm run db:backup    # Créer un backup
```

### Gestion des Traductions
```bash
npm run version:pokemon        # Incrémenter version traductions Pokémon (patch)
npm run version:trainer        # Incrémenter version traductions Dresseurs (patch)
npm run version:both           # Incrémenter les deux (patch)
```

---

## 📁 Structure du Projet

```
vaultestim-v2/
├── src/
│   ├── components/
│   │   ├── ui/                  # shadcn/ui composants de base
│   │   └── features/            # Composants métier par domaine
│   ├── pages/                   # Pages de l'application
│   ├── hooks/                   # Custom hooks (useAuth, useCollection, etc.)
│   ├── services/                # Services API et métier
│   ├── utils/                   # Traductions et utilitaires
│   └── lib/                     # Helpers (cn function)
├── scripts/                     # Scripts automation
│   ├── check-cache-version.cjs  # Détection changements cache
│   └── increment-cache-version.cjs  # Incrémentation auto
├── CLAUDE.md                    # Guide pour Claude Code
├── CHANGELOG.md                 # Historique complet (86 features)
└── README.md                    # Ce fichier
```

---

## 📚 Documentation

### Guides Principaux
- **[CLAUDE.md](./CLAUDE.md)** - Guide de référence pour Claude Code
- **[CHANGELOG.md](./CHANGELOG.md)** - Historique détaillé (86 fonctionnalités)
- **[scripts/README.md](./scripts/README.md)** - Documentation des scripts

### Workflow Git
```bash
# Vérifier si CACHE_VERSION doit être incrémenté
npm run check-cache-version

# Si nécessaire, incrémenter
npm run increment-cache-version minor

# Commit et push (Vercel déploie automatiquement)
git add .
git commit -m "feat: Description"
git push github main  # ⚠️ Utiliser remote "github"
```

---

## 🌐 Déploiement

- **URL Production** : https://vaultestim-v2.vercel.app
- **Déploiement** : Automatique sur push vers `main`
- **Platform** : Vercel

---

## 📄 Licence

MIT License

---

**Dernière mise à jour** : 2025-01-09 | **Version** : 2.0.0
