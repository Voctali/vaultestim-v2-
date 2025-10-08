@echo off
echo 🎮 VaultEstim Test Setup
echo ========================

echo.
echo 📋 Etape 1: Installation des dépendances
cd server
call npm install
if errorlevel 1 (
    echo ❌ Erreur installation NPM
    pause
    exit /b 1
)

echo.
echo 📋 Etape 2: Verification des services
echo Verification PostgreSQL...
pg_isready -h localhost -p 5432
if errorlevel 1 (
    echo ⚠️ PostgreSQL non démarré. Veuillez le démarrer et relancer ce script.
    pause
    exit /b 1
)

echo Verification Redis...
redis-cli ping > nul 2>&1
if errorlevel 1 (
    echo ⚠️ Redis non démarré. Tentative de démarrage...
    start redis-server
    timeout /t 3 > nul
)

echo.
echo 📋 Etape 3: Configuration de la base de données
echo Création de la base de test...
createdb -h localhost -U postgres vaultestim_test 2> nul
echo Base de données prête.

echo.
echo 📋 Etape 4: Setup initial
call npm run setup-db
if errorlevel 1 (
    echo ❌ Erreur setup base de données
    pause
    exit /b 1
)

echo.
echo ✅ Setup terminé! Vous pouvez maintenant:
echo   1. Démarrer le serveur: npm run dev
echo   2. Tester l'API: voir test-api.bat
echo   3. Lancer une sync: npm run sync
echo.
pause