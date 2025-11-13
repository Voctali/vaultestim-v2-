const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'features', 'admin', 'PriceRefreshPanel.jsx');

console.log('📝 Mise à jour des références à BATCH_SIZE...');

// Lire le fichier
let content = fs.readFileSync(filePath, 'utf8');

// Remplacer les 4 occurrences de "150" par PriceRefreshService.BATCH_SIZE
const replacements = [
  {
    old: 'Mise à jour intelligente quotidienne : 150 cartes/jour, cycle complet en ~{Math.ceil(stats.total / 150)} jours',
    new: 'Mise à jour intelligente quotidienne : {PriceRefreshService.BATCH_SIZE} cartes/jour, cycle complet en ~{Math.ceil(stats.total / PriceRefreshService.BATCH_SIZE)} jours'
  },
  {
    old: '<li>• <strong>Automatique</strong> : 150 cartes/jour au démarrage (si {\'>\'} 24h)</li>',
    new: '<li>• <strong>Automatique</strong> : {PriceRefreshService.BATCH_SIZE} cartes/jour au démarrage (si {\'>\'} 24h)</li>'
  },
  {
    old: '<li>• <strong>Cycle complet</strong> : {Math.ceil(stats.total / 150)} jours pour actualiser toutes les cartes</li>',
    new: '<li>• <strong>Cycle complet</strong> : {Math.ceil(stats.total / PriceRefreshService.BATCH_SIZE)} jours pour actualiser toutes les cartes</li>'
  },
  {
    old: 'Actualiser Batch Quotidien (150 cartes)',
    new: 'Actualiser Batch Quotidien ({PriceRefreshService.BATCH_SIZE} cartes)'
  }
];

let changeCount = 0;
replacements.forEach((replacement, index) => {
  if (content.includes(replacement.old)) {
    content = content.replace(replacement.old, replacement.new);
    changeCount++;
    console.log(`✅ Remplacement ${index + 1}/4 effectué`);
  } else {
    console.log(`⚠️ Remplacement ${index + 1}/4 - Pattern non trouvé`);
  }
});

// Écrire le fichier modifié
fs.writeFileSync(filePath, content, 'utf8');

console.log(`\n✅ Fichier mis à jour avec ${changeCount}/4 remplacements`);
console.log('📊 Les logs afficheront maintenant 1500 cartes au lieu de 150');
