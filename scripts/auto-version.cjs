#!/usr/bin/env node

/**
 * Script d'auto-versioning pour hook pre-commit
 * Incrémente automatiquement la version à chaque commit
 *
 * Détecte le type d'incrément depuis le message de commit (si disponible)
 * ou utilise patch par défaut
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Fichiers à mettre à jour
const VERSION_FILE = path.join(__dirname, '..', 'src', 'version.js')
const PACKAGE_FILE = path.join(__dirname, '..', 'package.json')

// Lire la version actuelle depuis version.js
function getCurrentVersion() {
  const content = fs.readFileSync(VERSION_FILE, 'utf8')
  const match = content.match(/export const APP_VERSION = '(\d+\.\d+\.\d+)'/)
  if (!match) {
    console.error('❌ Impossible de trouver la version dans src/version.js')
    process.exit(1)
  }
  return match[1]
}

// Incrémenter la version
function incrementVersion(version, type) {
  const [major, minor, patch] = version.split('.').map(Number)

  switch (type) {
    case 'major':
      return `${major + 1}.0.0`
    case 'minor':
      return `${major}.${minor + 1}.0`
    case 'patch':
    default:
      return `${major}.${minor}.${patch + 1}`
  }
}

// Mettre à jour version.js
function updateVersionFile(oldVersion, newVersion) {
  let content = fs.readFileSync(VERSION_FILE, 'utf8')

  // Mettre à jour APP_VERSION
  content = content.replace(
    /export const APP_VERSION = '\d+\.\d+\.\d+'/,
    `export const APP_VERSION = '${newVersion}'`
  )

  // Mettre à jour BUILD_DATE
  const today = new Date().toISOString().split('T')[0]
  content = content.replace(
    /export const BUILD_DATE = '\d{4}-\d{2}-\d{2}'/,
    `export const BUILD_DATE = '${today}'`
  )

  fs.writeFileSync(VERSION_FILE, content)
}

// Mettre à jour package.json
function updatePackageJson(newVersion) {
  const packageJson = JSON.parse(fs.readFileSync(PACKAGE_FILE, 'utf8'))
  packageJson.version = newVersion
  fs.writeFileSync(PACKAGE_FILE, JSON.stringify(packageJson, null, 2) + '\n')
}

// Déterminer le type d'incrément
function getIncrementType() {
  // Par défaut: patch
  let type = 'patch'

  // Essayer de lire le message de commit préparé
  try {
    const commitMsgFile = path.join(__dirname, '..', '.git', 'COMMIT_EDITMSG')
    if (fs.existsSync(commitMsgFile)) {
      const commitMsg = fs.readFileSync(commitMsgFile, 'utf8').toLowerCase()

      if (commitMsg.includes('breaking:') || commitMsg.includes('major:')) {
        type = 'major'
      } else if (commitMsg.includes('feat:') || commitMsg.includes('feature:')) {
        type = 'minor'
      }
    }
  } catch (e) {
    // Ignorer les erreurs de lecture
  }

  return type
}

// Exécution
const currentVersion = getCurrentVersion()
const incrementType = getIncrementType()
const newVersion = incrementVersion(currentVersion, incrementType)

console.log(`📦 Auto-versioning (${incrementType}): ${currentVersion} → ${newVersion}`)

updateVersionFile(currentVersion, newVersion)
updatePackageJson(newVersion)

// Ajouter les fichiers modifiés au commit
try {
  execSync('git add src/version.js package.json', { stdio: 'inherit' })
  console.log(`✅ Version ${newVersion} ajoutée au commit`)
} catch (e) {
  console.error('⚠️ Impossible d\'ajouter les fichiers au commit')
}
