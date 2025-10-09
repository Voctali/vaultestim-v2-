# 🚀 Guide de Déploiement Vercel - VaultEstim v2

## 📋 Pré-requis

- ✅ Git initialisé et premier commit créé
- ✅ Build de production testé et fonctionnel
- ✅ Variables d'environnement configurées
- ✅ Compte Vercel gratuit créé

---

## 🎯 Méthodes de Déploiement

### **Option 1 : Déploiement via CLI (Recommandé)**

#### **Étape 1 : Installer Vercel CLI**

```bash
npm install -g vercel
```

#### **Étape 2 : Se connecter à Vercel**

```bash
cd "F:\Logiciels\Appli Vaultestim\vaultestim-v2"
vercel login
```

Suivez les instructions pour vous connecter.

#### **Étape 3 : Déployer**

```bash
vercel
```

**Questions posées par Vercel** :

1. `Set up and deploy "vaultestim-v2"?` → **Y** (Oui)
2. `Which scope do you want to deploy to?` → Sélectionnez votre compte
3. `Link to existing project?` → **N** (Non, c'est un nouveau projet)
4. `What's your project's name?` → **vaultestim** (ou laissez par défaut)
5. `In which directory is your code located?` → **./** (racine)
6. `Want to override the settings?` → **N** (Vercel détecte automatiquement Vite)

#### **Étape 4 : Configurer les variables d'environnement**

Une fois déployé, allez dans les paramètres du projet sur Vercel :

1. **Dashboard Vercel** → **Votre Projet** → **Settings** → **Environment Variables**
2. Ajoutez ces variables :

```
VITE_POKEMON_TCG_API_KEY=6fbee8f7-f9f8-4844-aa81-349777320243
VITE_SUPABASE_URL=https://ubphwlmnfjdaiarbihcx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVicGh3bG1uZmpkYWlhcmJpaGN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NDAwMDIsImV4cCI6MjA3NTUxNjAwMn0.7d0303MNw__AVC9wkS7BodK2WG8Rvb2IY2V-0wv0l7Q
```

3. **Redéployez** après avoir ajouté les variables :

```bash
vercel --prod
```

---

### **Option 2 : Déploiement via GitHub (Automatique)**

#### **Étape 1 : Créer un repo GitHub**

1. Allez sur **https://github.com/new**
2. Créez un repository (public ou privé)
3. **NE PAS** initialiser avec README/gitignore (on a déjà fait)

#### **Étape 2 : Pusher votre code**

```bash
cd "F:\Logiciels\Appli Vaultestim\vaultestim-v2"

# Ajouter le remote GitHub
git remote add origin https://github.com/VOTRE_USERNAME/vaultestim-v2.git

# Pusher le code
git branch -M main
git push -u origin main
```

#### **Étape 3 : Connecter à Vercel**

1. Allez sur **https://vercel.com/new**
2. Cliquez sur **Import Git Repository**
3. Sélectionnez votre repo **vaultestim-v2**
4. Vercel détecte automatiquement Vite
5. Ajoutez les variables d'environnement :
   - `VITE_POKEMON_TCG_API_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Cliquez sur **Deploy**

🎉 **Votre application sera automatiquement redéployée à chaque push !**

---

## 🌐 Accéder à votre Application

Une fois déployé, Vercel vous donnera une URL :

```
https://vaultestim.vercel.app
```

ou

```
https://vaultestim-v2-XXXXXXX.vercel.app
```

### **Configurer un domaine personnalisé (optionnel)**

1. **Dashboard Vercel** → **Votre Projet** → **Settings** → **Domains**
2. Ajoutez votre domaine personnalisé (ex: `vaultestim.com`)
3. Suivez les instructions pour configurer le DNS

---

## 🔧 Commandes Utiles

### **Déploiement de production**
```bash
vercel --prod
```

### **Voir les logs**
```bash
vercel logs
```

### **Ouvrir le dashboard Vercel**
```bash
vercel inspect
```

### **Redéployer automatiquement**

Après chaque modification :

```bash
git add .
git commit -m "Description des changements"
git push
```

→ Vercel redéploie automatiquement !

---

## ✅ Vérifications Post-Déploiement

- [ ] L'application s'ouvre correctement
- [ ] La connexion Supabase fonctionne
- [ ] Les recherches de cartes Pokémon fonctionnent
- [ ] Les images s'affichent correctement
- [ ] L'application est accessible depuis votre téléphone
- [ ] HTTPS est activé automatiquement (🔒)

---

## 🐛 Dépannage

### **Erreur de build**

Vérifiez les logs :
```bash
vercel logs
```

### **Variables d'environnement manquantes**

Allez dans **Settings** → **Environment Variables** et ajoutez-les.

### **Proxy CORS ne fonctionne pas**

Le `vercel.json` gère déjà les rewrites pour l'API Pokemon TCG.

### **Page blanche après déploiement**

Vérifiez la console du navigateur et les logs Vercel pour les erreurs.

---

## 📱 Accès Mobile

Une fois déployé, vous pourrez accéder à votre application :

- **Depuis n'importe quel réseau WiFi**
- **Depuis les données mobiles**
- **Depuis n'importe quel pays**
- **PC éteint** ✅

L'URL sera accessible 24/7 gratuitement !

---

## 🎉 Félicitations !

Votre application VaultEstim v2 est maintenant en ligne et accessible depuis n'importe où dans le monde !

**URL de production** : `https://votre-projet.vercel.app`

---

## 📞 Support

- **Documentation Vercel** : https://vercel.com/docs
- **Support Vercel** : https://vercel.com/support
- **Dashboard** : https://vercel.com/dashboard

---

**Bon déploiement ! 🚀**
