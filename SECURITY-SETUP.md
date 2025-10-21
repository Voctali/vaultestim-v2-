# Configuration Sécurisée du Token Vercel

## ⚠️ URGENT : Révoquer le Token Compromis

Votre token Vercel a été exposé dans le repository. Suivez ces étapes **immédiatement** :

### 1. Révoquer l'Ancien Token

1. Allez sur https://vercel.com/account/tokens
2. Trouvez le token compromis
3. Cliquez sur **"Delete"** ou **"Revoke"**

### 2. Créer un Nouveau Token

1. Sur la même page, cliquez sur **"Create Token"**
2. Donnez-lui un nom : `VaultEstim CLI`
3. Sélectionnez le scope approprié (Full Account ou Project-specific)
4. **Copiez le token** et gardez-le en sécurité (il ne sera affiché qu'une fois !)

### 3. Configurer la Variable d'Environnement

#### Sur Windows (PowerShell) :

**Méthode 1 : Variable Permanente (Recommandé)**
1. Tapez `Windows + R`, puis `sysdm.cpl`
2. Onglet "Avancé" → "Variables d'environnement"
3. Dans "Variables utilisateur", cliquez "Nouvelle"
4. Nom : `VERCEL_TOKEN`
5. Valeur : Collez votre nouveau token
6. Cliquez OK
7. **REDÉMARREZ votre terminal/Claude Code** pour appliquer les changements

**Méthode 2 : Variable de Session (Temporaire)**
```powershell
$env:VERCEL_TOKEN = "VOTRE_NOUVEAU_TOKEN_ICI"
```
⚠️ Cette méthode ne persiste que pour la session en cours !

#### Vérifier que ça fonctionne :

```powershell
# Tester que la variable est définie
echo $env:VERCEL_TOKEN

# Tester le déploiement Vercel
cd "F:\Logiciels\Appli Vaultestim\vaultestim-v2"
vercel --prod --token $env:VERCEL_TOKEN
```

### 4. Nettoyer l'Historique Git (Optionnel mais Recommandé)

Même si le token est révoqué, il est dans l'historique Git. Pour un nettoyage complet :

```bash
# ⚠️ ATTENTION : Cela réécrit l'historique - à faire avec précaution
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch CLAUDE.md src/.claude/settings.local.json" \
  --prune-empty --tag-name-filter cat -- --all

# Forcer le push (après backup !)
git push github main --force
```

**Alternative plus simple** : Laisser l'historique tel quel puisque le token sera révoqué de toute façon.

### 5. Vérification Finale

✅ Token révoqué sur Vercel
✅ Nouveau token créé
✅ Variable d'environnement `VERCEL_TOKEN` configurée
✅ Fichiers nettoyés (plus de token en dur dans le code)
✅ `.gitignore` mis à jour pour protéger les fichiers sensibles

## 🔒 Bonnes Pratiques de Sécurité

### Ce qu'il NE FAUT JAMAIS faire :

- ❌ Mettre des tokens dans le code source
- ❌ Commiter des fichiers `.env` ou `.env.local`
- ❌ Partager des tokens dans des messages/emails
- ❌ Utiliser le même token pour plusieurs projets

### Ce qu'il FAUT faire :

- ✅ Utiliser des variables d'environnement
- ✅ Révoquer immédiatement les tokens exposés
- ✅ Créer des tokens avec des scopes limités
- ✅ Ajouter tous les fichiers sensibles au `.gitignore`
- ✅ Utiliser le déploiement automatique via GitHub (pas besoin de token local !)

## 📌 Note sur le Déploiement Automatique

**Bonne nouvelle** : Vous utilisez déjà le déploiement automatique via GitHub !

Vercel se connecte directement à votre repository GitHub et déploie automatiquement à chaque push sur `main`. Vous n'avez donc **PAS BESOIN** du token Vercel pour les déploiements normaux !

Le token est uniquement nécessaire pour :
- Déploiements manuels depuis la CLI
- Scripts d'automatisation locaux
- Debugging de déploiements

**Recommandation** : Continuez à utiliser le workflow automatique :
```bash
git add .
git commit -m "Description"
git push github main
# Vercel déploie automatiquement !
```

## 🆘 Besoin d'Aide ?

Si vous avez des questions sur la sécurité ou la configuration :
- Documentation Vercel Tokens : https://vercel.com/docs/rest-api#authentication
- Variables d'environnement Windows : https://docs.microsoft.com/en-us/windows/win32/procthread/environment-variables

---

**Dernière mise à jour** : 2025-10-21
