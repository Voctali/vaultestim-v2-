const fs = require('fs');
const path = require('path');

console.log('✨ Ajout du champ has_cosmos_holo dans SupabaseService...\n');

const filePath = path.join(__dirname, 'src', 'services', 'SupabaseService.js');

let content = fs.readFileSync(filePath, 'utf8');

// Ajouter has_cosmos_holo dans ALLOWED_CARD_FIELDS
const oldFields = `    'retreat_cost', // Coût de retraite
    '_price_updated_at', // Timestamp dernière actualisation des prix
    '_last_viewed'  // Timestamp dernière consultation (pour priorisation actualisation)
  ]`;

const newFields = `    'retreat_cost', // Coût de retraite
    'has_cosmos_holo', // Indique si la carte existe en version Holo Cosmos
    '_price_updated_at', // Timestamp dernière actualisation des prix
    '_last_viewed'  // Timestamp dernière consultation (pour priorisation actualisation)
  ]`;

if (content.includes('has_cosmos_holo')) {
  console.log('⚠️  Le champ has_cosmos_holo existe déjà');
} else {
  content = content.replace(oldFields, newFields);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Champ has_cosmos_holo ajouté à ALLOWED_CARD_FIELDS');
}

console.log('\n📋 Résumé:');
console.log('  • SupabaseService: has_cosmos_holo dans whitelist');
console.log('  • Les cartes avec ce champ seront synchronisées');
console.log('\n✅ Modification terminée!');
