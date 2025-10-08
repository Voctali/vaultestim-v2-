@echo off
title VaultEstim v2 - Edition Supabase
color 0A

echo ================================================
echo    VaultEstim v2 - Edition Supabase
echo ================================================
echo.
echo [INFO] Demarrage de l'application...
echo.
echo Frontend : https://localhost:5174
echo.
echo ================================================
echo.

cd /d "%~dp0"

:: Vérifier si node_modules existe
if not exist "node_modules\" (
    echo [WARN] Installation des dependances...
    call npm install --legacy-peer-deps
    echo.
)

:: Lancer le serveur de développement Vite
echo [INFO] Lancement du serveur Vite...
echo.
start /B npm run dev

:: Attendre que le serveur démarre (5 secondes)
echo [INFO] Attente du demarrage du serveur...
timeout /t 5 /nobreak >nul

:: Ouvrir automatiquement le navigateur
echo [INFO] Ouverture du navigateur...
start https://localhost:5174

echo.
echo ================================================
echo Application demarree avec succes!
echo ================================================
echo.
echo Connectez-vous avec vos identifiants Supabase
echo Email: vaultestim@gmail.com
echo.
echo Appuyez sur Ctrl+C pour arreter l'application
echo ================================================
echo.

:: Garder la fenêtre ouverte
pause
