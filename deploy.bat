@echo off
REM Script de déploiement sécurisé pour Vercel
REM S'assure que le déploiement se fait toujours depuis la racine du projet

echo ========================================
echo   VaultEstim - Déploiement Vercel
echo ========================================
echo.

REM Vérifier qu'on est à la racine du projet
if not exist "vercel.json" (
    echo ERREUR: Vous n'êtes pas à la racine du projet !
    echo Ce script doit être exécuté depuis F:\Logiciels\Appli Vaultestim\vaultestim-v2\
    pause
    exit /b 1
)

echo Répertoire: %CD%
echo.

REM Vérifier les modifications non commitées
git status --short
if errorlevel 1 (
    echo ERREUR: Problème avec Git
    pause
    exit /b 1
)

echo.
echo Voulez-vous déployer en PRODUCTION ? (O/N)
set /p CONFIRM=

if /i not "%CONFIRM%"=="O" (
    echo Déploiement annulé.
    pause
    exit /b 0
)

echo.
echo Déploiement en cours...
vercel --prod --yes

if errorlevel 1 (
    echo.
    echo ERREUR: Le déploiement a échoué !
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Déploiement réussi !
echo ========================================
pause
