#!/usr/bin/env node

/**
 * Script pour incrémenter la version de l'application
 *
 * Usage:
 *   node scripts/increment-version.cjs [major|minor|patch]
 *   npm run version:patch
 *   npm run version:minor
 *   npm run version:major
 */

const fs = require('fs')
const path = require('path')

// Fichiers à mettre à jour
const VERSION_FILE = path.join(__dirname, '..', 'src', 'version.js')
const PACKAGE_FILE = path.join(__dirname, '..', 'package.json')

// Type d'incrément (major, minor, patch)
const incrementType = process.argv[2] || 'patch'

if (!['major', 'minor', 'patch'].includes(incrementType)) {
  console.error('❌ Type d\'incrément invalide. Utilisez: major, minor, ou patch')
  process.exit(1)
}

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
      return `${major}.${minor}.${patch + 1}`
    default:
      return version
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
  console.log(`✅ src/version.js mis à jour: ${oldVersion} → ${newVersion}`)
}

// Mettre à jour package.json
function updatePackageJson(newVersion) {
  const packageJson = JSON.parse(fs.readFileSync(PACKAGE_FILE, 'utf8'))
  const oldVersion = packageJson.version
  packageJson.version = newVersion
  fs.writeFileSync(PACKAGE_FILE, JSON.stringify(packageJson, null, 2) + '\n')
  console.log(`✅ package.json mis à jour: ${oldVersion} → ${newVersion}`)
}

// Exécution
const currentVersion = getCurrentVersion()
const newVersion = incrementVersion(currentVersion, incrementType)

console.log(`\n📦 Incrémentation de version (${incrementType})`)
console.log(`   ${currentVersion} → ${newVersion}\n`)

updateVersionFile(currentVersion, newVersion)
updatePackageJson(newVersion)

console.log(`\n🎉 Version incrémentée avec succès !`)
console.log(`   Nouvelle version: ${newVersion}`)
console.log(`\nN'oubliez pas de commiter ces changements:`)
console.log(`   git add src/version.js package.json`)
console.log(`   git commit -m "chore: bump version to ${newVersion}"`)
