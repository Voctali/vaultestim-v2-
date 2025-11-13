const fs = require('fs');
const path = require('path');

console.log('✨ Implémentation complète du support Holo Cosmos...\n');

const modifications = [];

// 1. Ajouter has_cosmos_holo dans le SELECT de SupabaseService
console.log('1️⃣ Mise à jour SupabaseService SELECT...');
const supabasePath = path.join(__dirname, 'src', 'services', 'SupabaseService.js');
let supabaseContent = fs.readFileSync(supabasePath, 'utf8');

// Ajouter has_cosmos_holo dans le SELECT
const oldSelect = `.select('id, name, name_fr, types, hp, number, artist, rarity, rarity_fr, images, set, set_id, _source, cardmarket, tcgplayer, attacks, abilities, weaknesses, resistances, retreat_cost')`;
const newSelect = `.select('id, name, name_fr, types, hp, number, artist, rarity, rarity_fr, images, set, set_id, _source, cardmarket, tcgplayer, attacks, abilities, weaknesses, resistances, retreat_cost, has_cosmos_holo')`;

if (supabaseContent.includes(oldSelect)) {
  supabaseContent = supabaseContent.replace(oldSelect, newSelect);
  fs.writeFileSync(supabasePath, supabaseContent, 'utf8');
  console.log('   ✅ has_cosmos_holo ajouté au SELECT');
  modifications.push('SupabaseService: SELECT mis à jour');
} else {
  console.log('   ⚠️  SELECT déjà à jour ou introuvable');
}

// 2. Ajouter méthode updateCardCosmosStatus dans SupabaseService
console.log('\n2️⃣ Ajout méthode updateCardCosmosStatus...');
const updateMethod = `
  /**
   * Mettre à jour le statut Holo Cosmos d'une carte
   * @param {string} cardId - ID de la carte
   * @param {boolean} hasCosmosHolo - true si la carte existe en version cosmos
   */
  static async updateCardCosmosStatus(cardId, hasCosmosHolo) {
    try {
      const { data, error } = await supabase
        .from('discovered_cards')
        .update({ has_cosmos_holo: hasCosmosHolo })
        .eq('id', cardId)
        .select()
        .single()

      if (error) throw error

      console.log(\`✅ Carte \${cardId} marquée comme \${hasCosmosHolo ? 'ayant' : 'n\\\\'ayant pas'} version Holo Cosmos\`)
      return data
    } catch (error) {
      console.error('❌ Erreur mise à jour statut cosmos:', error)
      throw error
    }
  }
`;

if (!supabaseContent.includes('updateCardCosmosStatus')) {
  // Ajouter avant la fermeture de la classe
  supabaseContent = supabaseContent.replace(
    /}\s*export { SupabaseService }/,
    updateMethod + '\n}\n\nexport { SupabaseService }'
  );
  fs.writeFileSync(supabasePath, supabaseContent, 'utf8');
  console.log('   ✅ Méthode updateCardCosmosStatus ajoutée');
  modifications.push('SupabaseService: méthode updateCardCosmosStatus');
} else {
  console.log('   ⚠️  Méthode déjà présente');
}

console.log('\n✅ Implémentation terminée!');
console.log('\n📋 Modifications appliquées:');
modifications.forEach((mod, i) => console.log(`   ${i + 1}. ${mod}`));

console.log('\n🎯 Prochaines étapes manuelles:');
console.log('   1. Ajouter UI admin dans AdminDatabaseEditor.jsx');
console.log('   2. Ajouter checkbox dans AddToCollectionModal.jsx');
console.log('   3. Afficher badge CosmosHoloBadge dans les vues');
console.log('   4. Tester et déployer');
