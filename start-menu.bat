@echo off
title VaultEstim v2 - Menu de demarrage
color 0B

:MENU
cls
echo ========================================================
echo           VaultEstim v2 - Menu de Demarrage
echo ========================================================
echo.
echo   [1] Lancer l'application (Supabase)
echo   [2] Ouvrir la page de migration Supabase
echo   [3] Lancer avec backend SQLite (ancien mode)
echo   [4] Installer/Mettre a jour les dependances
echo   [5] Ouvrir Supabase Dashboard
echo   [6] Quitter
echo.
echo ========================================================
echo.

set /p choice="Votre choix (1-6) : "

if "%choice%"=="1" goto START_SUPABASE
if "%choice%"=="2" goto OPEN_MIGRATION
if "%choice%"=="3" goto START_OLD_MODE
if "%choice%"=="4" goto INSTALL_DEPS
if "%choice%"=="5" goto OPEN_SUPABASE
if "%choice%"=="6" goto END

echo.
echo [ERREUR] Choix invalide. Veuillez reessayer.
timeout /t 2 >nul
goto MENU

:START_SUPABASE
cls
echo ========================================================
echo   Lancement de VaultEstim v2 avec Supabase
echo ========================================================
echo.
echo Frontend : https://localhost:5174
echo.
cd /d "%~dp0"
start /B npm run dev
timeout /t 5 /nobreak >nul
start https://localhost:5174
echo.
echo [OK] Application demarree!
echo [INFO] Connectez-vous avec vos identifiants Supabase
echo.
echo Appuyez sur une touche pour revenir au menu...
pause >nul
goto MENU

:OPEN_MIGRATION
cls
echo ========================================================
echo   Migration deja effectuee!
echo ========================================================
echo.
echo La migration vers Supabase a ete completee.
echo Vos 8515 cartes sont maintenant dans Supabase.
echo.
echo Utilisez l'option 1 pour lancer l'application.
echo.
timeout /t 3
goto MENU

:START_OLD_MODE
cls
echo ========================================================
echo   Lancement en mode ancien (Backend SQLite)
echo ========================================================
echo.
echo Frontend : http://localhost:5174
echo Backend  : http://localhost:3001
echo.
cd /d "%~dp0"

:: Lancer le backend
start "VaultEstim Backend" cmd /k "cd backend && node server.js"
timeout /t 2 /nobreak >nul

:: Lancer le frontend
start /B npm run dev
timeout /t 3 /nobreak >nul

start http://localhost:5174
echo.
echo [OK] Application demarree en mode SQLite!
echo.
echo Appuyez sur une touche pour revenir au menu...
pause >nul
goto MENU

:INSTALL_DEPS
cls
echo ========================================================
echo   Installation des dependances
echo ========================================================
echo.
cd /d "%~dp0"
echo [INFO] Installation des dependances frontend...
call npm install --legacy-peer-deps
echo.
echo [INFO] Installation des dependances backend...
cd backend
call npm install
cd ..
echo.
echo [OK] Dependances installees!
echo.
timeout /t 2
goto MENU

:OPEN_SUPABASE
cls
echo ========================================================
echo   Ouverture du Dashboard Supabase
echo ========================================================
echo.
start https://supabase.com/dashboard/project/ubphwlmnfjdaiarbihcx
echo.
echo [INFO] Dashboard Supabase ouvert dans le navigateur
echo.
timeout /t 2
goto MENU

:END
cls
echo ========================================================
echo   Merci d'avoir utilise VaultEstim v2!
echo ========================================================
echo.
timeout /t 2
exit
