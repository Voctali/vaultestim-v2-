const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'services', 'SupabaseCollectionService.js');

console.log('📝 Lecture du fichier SupabaseCollectionService.js...');
let content = fs.readFileSync(filePath, 'utf8');

console.log('➕ Ajout des champs number et set...');

// Ajouter les champs dans addToCollection (ligne 103-124)
const oldInsert = `      const insertData = {
        user_id: userId,
        card_id: card.id,
        name: card.name,
        series: card.series,
        extension: card.extension,
        rarity: card.rarity,`;

const newInsert = `      const insertData = {
        user_id: userId,
        card_id: card.id,
        name: card.name,
        number: card.number || null, // Numéro de carte (ex: "97") - REQUIS pour liens CardMarket
        series: card.series,
        extension: card.extension,
        set: card.set || null, // Infos de l'extension (set.name, set.id) - REQUIS pour liens CardMarket
        rarity: card.rarity,`;

content = content.replace(oldInsert, newInsert);

console.log('💾 Écriture des modifications...');
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Champs number et set ajoutés !');
console.log('⚠️  IMPORTANT : Vous devez maintenant créer les colonnes en base Supabase :');
console.log('   - ALTER TABLE user_collection ADD COLUMN number TEXT;');
console.log('   - ALTER TABLE user_collection ADD COLUMN set JSONB;');
