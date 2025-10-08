@echo off
echo ========================================
echo   VaultEstim - Démarrage Complet
echo ========================================
echo.
echo Démarrage du backend et du frontend...
echo.

REM Démarrer le backend dans une nouvelle fenêtre
start "VaultEstim Backend" cmd /k "cd backend && npm start"

REM Attendre 3 secondes que le backend démarre
timeout /t 3 /nobreak >nul

REM Démarrer le frontend
echo Démarrage du frontend...
npm run dev
