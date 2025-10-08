@echo off
echo 🧪 VaultEstim API Tests
echo ======================

set API_BASE=http://localhost:3001/api

echo.
echo 📋 Test 1: Health Check
curl -s %API_BASE%/health | jq .
if errorlevel 1 (
    echo ❌ Serveur non disponible. Démarrez-le avec: npm run dev
    pause
    exit /b 1
)

echo.
echo 📋 Test 2: Statistiques générales
curl -s %API_BASE%/stats | jq .general

echo.
echo 📋 Test 3: Liste des extensions
curl -s "%API_BASE%/sets?limit=5" | jq ".data[0]"

echo.
echo 📋 Test 4: Recherche de cartes (Pikachu)
curl -s "%API_BASE%/cards?q=Pikachu&limit=3" | jq ".data[0]"

echo.
echo 📋 Test 5: Autocomplétion
curl -s "%API_BASE%/cards/autocomplete?q=pika" | jq .

echo.
echo 📋 Test 6: Prix trending
curl -s "%API_BASE%/prices/trending?limit=3" | jq ".trending[0]"

echo.
echo 📋 Test 7: Statut synchronisation
curl -s %API_BASE%/sync/status | jq .

echo.
echo ✅ Tests API terminés!
echo.
echo 📝 Pour des tests plus détaillés:
echo   - Ouvrez http://localhost:3001/api/health dans votre navigateur
echo   - Utilisez Postman avec la collection fournie
echo   - Consultez les logs: tail -f server/logs/server.log
echo.
pause