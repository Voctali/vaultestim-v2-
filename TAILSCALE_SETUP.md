# 🔐 Configuration Tailscale pour VaultEstim

## Pourquoi Tailscale ?

Tailscale vous permet d'accéder à votre backend VaultEstim depuis n'importe où dans le monde, comme si vous étiez sur votre réseau local, **sans exposer votre serveur à Internet** et **gratuitement**.

## 📋 Installation

### 1️⃣ Sur votre PC (Windows)

**A. Télécharger Tailscale**
1. Aller sur https://tailscale.com/download/windows
2. Télécharger l'installateur
3. Exécuter `tailscale-setup.exe`

**B. Se connecter**
1. Lancer Tailscale (icône dans la barre des tâches)
2. Cliquer sur "Log in"
3. Choisir votre méthode (Google/GitHub/Email recommandé)
4. Autoriser dans le navigateur

**C. Noter l'IP Tailscale**
1. Ouvrir Tailscale dans la barre des tâches
2. Votre IP commence par `100.x.x.x`
3. **Exemple** : `100.64.123.45`
4. ✏️ **Notez cette IP** → Vous en aurez besoin !

### 2️⃣ Sur votre téléphone (Android/iOS)

**A. Installer l'application**
- **Android** : https://play.google.com/store/apps/details?id=com.tailscale.ipn
- **iOS** : https://apps.apple.com/app/tailscale/id1470499037

**B. Se connecter**
1. Ouvrir Tailscale
2. Cliquer sur "Log in"
3. Utiliser le **MÊME compte** que sur le PC
4. Autoriser l'application

**C. Activer le VPN**
1. Toggle "Connected" → ON
2. Une icône VPN apparaît en haut de l'écran
3. ✅ Vous êtes connecté !

### 3️⃣ Mettre à jour l'URL de l'API

**A. Trouver l'IP Tailscale de votre PC**

Sur votre PC, ouvrir PowerShell et taper :
```powershell
tailscale ip -4
```
Vous obtenez quelque chose comme : `100.64.123.45`

**B. Mettre à jour `.env` (sur votre PC)**

Éditer `F:\Logiciels\Appli Vaultestim\vaultestim-v2\.env` :
```env
# Ajouter l'IP Tailscale
VITE_API_URL_TAILSCALE=https://100.64.123.45:3000/api

# Garder aussi l'IP locale pour utilisation à la maison
VITE_API_URL_LOCAL=https://192.168.50.137:3000/api
```

**C. Mettre à jour le frontend pour détecter automatiquement**

Créer un fichier de configuration :
`src/config/api.js`
```javascript
// Détection automatique du meilleur endpoint
export const getApiUrl = () => {
  // Si Tailscale est actif (IP commence par 100.)
  const isTailscale = window.location.hostname.startsWith('100.')

  if (isTailscale) {
    return import.meta.env.VITE_API_URL_TAILSCALE || 'https://100.64.123.45:3000/api'
  }

  // Sinon utiliser IP locale
  return import.meta.env.VITE_API_URL_LOCAL || 'https://192.168.50.137:3000/api'
}

export const API_URL = getApiUrl()
```

## 🚀 Utilisation

### À la maison (WiFi local)
```
1. Tailscale : ❌ OFF (optionnel)
2. URL utilisée : https://192.168.50.137:3000/api
3. Avantage : Connexion directe ultra-rapide
```

### À l'extérieur (travail, vacances, 4G/5G)
```
1. Tailscale : ✅ ON
2. URL utilisée : https://100.64.123.45:3000/api
3. Avantage : Connexion sécurisée de partout
```

## 🔒 Sécurité

### Certificats SSL avec Tailscale

Tailscale fournit des certificats SSL automatiques pour HTTPS :

**Option 1 : Utiliser Tailscale Cert (recommandé)**
```bash
# Sur votre PC
tailscale cert votre-pc-name.tailnet-xxx.ts.net
```

**Option 2 : Activer MagicDNS (plus simple)**
1. Aller sur https://login.tailscale.com/admin/dns
2. Activer "MagicDNS"
3. Votre PC aura un nom : `votre-pc.tailnet-xxx.ts.net`
4. Utiliser `https://votre-pc.tailnet-xxx.ts.net:3000/api`

## 🛠️ Configuration backend pour Tailscale

### Autoriser l'IP Tailscale dans CORS

**backend/server.js**
```javascript
// Configuration CORS pour autoriser Tailscale
app.use(cors({
  origin: [
    'https://192.168.50.137:5174',  // Local
    'https://localhost:5174',        // Localhost
    /^https:\/\/100\./,              // Toutes les IPs Tailscale (100.x.x.x)
  ],
  credentials: true
}))
```

### S'assurer que le serveur écoute sur toutes les interfaces

**backend/server.js** (déjà fait ✅)
```javascript
https.createServer(sslOptions, app).listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur backend HTTPS démarré sur https://0.0.0.0:${PORT}`)
  console.log(`📱 Accessible localement : https://192.168.50.137:${PORT}`)

  // Afficher l'IP Tailscale si disponible
  exec('tailscale ip -4', (error, stdout) => {
    if (!error && stdout.trim()) {
      console.log(`🔐 Accessible via Tailscale : https://${stdout.trim()}:${PORT}`)
    }
  })
})
```

## 🧪 Test de la connexion

### Sur votre téléphone (via Tailscale)

1. **Activer Tailscale** sur le téléphone
2. **Ouvrir le navigateur** mobile
3. **Tester l'API** : https://100.64.123.45:3000/api/health
4. Vous devriez voir : `{"status":"OK","message":"Backend VaultEstim opérationnel"}`

### Vérifier que tout fonctionne

```bash
# Sur votre PC
# Lister les appareils connectés
tailscale status

# Devrait afficher :
# 100.64.123.45  votre-pc         ...
# 100.64.123.67  votre-telephone  ...
```

## 📊 Statistiques d'utilisation

### Consommation de données

- **À la maison (WiFi)** : 0 Mo (connexion locale directe)
- **À l'extérieur (Tailscale)** :
  - Requête API : ~1-5 KB
  - Image de carte : ~50-200 KB
  - **Estimation** : ~10-20 MB/jour d'utilisation normale

### Vitesse de connexion

- **Local (WiFi)** : ⚡ <10ms latence
- **Tailscale (4G/5G)** : 🚀 30-100ms latence (très bon)
- **Tailscale (WiFi public)** : 🚀 20-80ms latence

## 🆘 Dépannage

### Problème : "Cannot connect to server"

**Solution 1 - Vérifier Tailscale**
```bash
# Sur PC
tailscale status

# Devrait afficher "active"
```

**Solution 2 - Vérifier le backend**
```bash
# Sur PC, vérifier que le serveur tourne
netstat -ano | findstr ":3000"
```

**Solution 3 - Redémarrer Tailscale**
```bash
# Sur PC (PowerShell admin)
tailscale down
tailscale up
```

### Problème : "SSL Certificate error"

**Solution - Accepter le certificat**
1. Ouvrir https://100.64.123.45:3000/api/health
2. Cliquer "Avancé" → "Accepter le risque"
3. Le navigateur mémorisera l'exception

**OU utiliser MagicDNS** (certificats automatiques)

### Problème : "Slow connection"

**Vérifier le mode de connexion**
```bash
# Sur PC
tailscale status --active

# Si "relay" → Mauvais (passe par serveur Tailscale)
# Si "direct" → Bon (connexion directe P2P)
```

**Solution - Forcer connexion directe**
Désactiver le pare-feu temporairement pour tester

## 💰 Coût

- ✅ **Plan gratuit** : 1 utilisateur, 100 appareils, illimité
- ✅ **Aucun abonnement requis** pour usage personnel
- ✅ **Pas de limite de données**

## 🎯 Avantages vs autres solutions

| Solution | Coût | Setup | Sécurité | Accès distant |
|----------|------|-------|----------|---------------|
| **Tailscale** | 0€ | 5 min | ⭐⭐⭐⭐⭐ | ✅ Partout |
| VPN perso (OpenVPN) | 0€ | 1h+ | ⭐⭐⭐⭐ | ✅ Partout |
| Port forwarding | 0€ | 30 min | ⭐⭐ | ⚠️ IP publique |
| Cloud (Railway) | 5€/mois | 30 min | ⭐⭐⭐⭐⭐ | ✅ Partout |

## ✅ Checklist finale

Après installation, vérifiez :

- [ ] Tailscale installé sur PC
- [ ] Tailscale installé sur téléphone
- [ ] Même compte sur les deux appareils
- [ ] IP Tailscale notée (100.x.x.x)
- [ ] .env mis à jour avec IP Tailscale
- [ ] Backend accessible via https://100.x.x.x:3000/api/health
- [ ] App mobile fonctionne avec Tailscale activé
- [ ] App mobile fonctionne en WiFi local (Tailscale OFF)

## 🎓 Ressources

- Documentation Tailscale : https://tailscale.com/kb/
- Support communauté : https://github.com/tailscale/tailscale/discussions
- Status Tailscale : https://status.tailscale.com/

---

✅ **Avec Tailscale, vous avez un accès sécurisé à VaultEstim de n'importe où, GRATUITEMENT !** 🎉
