const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  // Récupérer TOUTES les cartes de la collection
  let allUserCards = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('user_collection')
      .select('*')
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.log('Error:', error);
      break;
    }

    if (data.length === 0) {
      hasMore = false;
    } else {
      allUserCards = allUserCards.concat(data);
      page++;
      if (data.length < pageSize) hasMore = false;
    }
  }

  console.log('Total cartes dans collection:', allUserCards.length);

  // Analyser les Bulbasaur / Bulbizarre
  console.log('\n=== ANALYSE BULBASAUR / BULBIZARRE ===');
  const bulbasaurCards = allUserCards.filter(c => {
    const name = (c.name || '').toLowerCase();
    return name.includes('bulbasaur') || name.includes('bulbizarre');
  });

  console.log('Total cartes Bulbasaur/Bulbizarre:', bulbasaurCards.length);

  // Afficher tous les détails
  bulbasaurCards.forEach((c, idx) => {
    console.log(`\n  ${idx + 1}. ID: ${c.id}`);
    console.log(`     Nom: ${c.name}`);
    console.log(`     card_id: ${c.card_id}`);
    console.log(`     Version: ${c.version || 'Normale'}`);
    console.log(`     Quantité: ${c.quantity || 1}`);
    console.log(`     Condition: ${c.condition || 'N/A'}`);
    console.log(`     set.id: ${c.set?.id || 'N/A'}`);
    console.log(`     set.name: ${c.set?.name || 'N/A'}`);
    console.log(`     extension: ${c.extension || 'N/A'}`);
    console.log(`     series: ${c.series || 'N/A'}`);
  });

  // Grouper par card_id + version
  console.log('\n=== GROUPEMENT PAR CARD_ID + VERSION ===');
  const groups = {};
  bulbasaurCards.forEach(c => {
    const version = (c.version && c.version.trim()) ? c.version.trim() : 'Normale';
    const cardId = c.card_id || 'no-id';
    const key = `${cardId}-${version}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(c);
  });

  Object.entries(groups).forEach(([key, cards]) => {
    console.log(`\n  ${key}: ${cards.length} carte(s)`);
    cards.forEach(c => {
      console.log(`    - ID: ${c.id} | Condition: ${c.condition} | Quantité: ${c.quantity || 1}`);
    });
  });

  // Analyse Tangela / Saquedeneu
  console.log('\n\n=== ANALYSE TANGELA / SAQUEDENEU ===');
  const tangelaCards = allUserCards.filter(c => {
    const name = (c.name || '').toLowerCase();
    return name.includes('tangela') || name.includes('saquedeneu');
  });

  console.log('Total cartes Tangela/Saquedeneu:', tangelaCards.length);

  tangelaCards.forEach((c, idx) => {
    console.log(`\n  ${idx + 1}. ID: ${c.id}`);
    console.log(`     Nom: ${c.name}`);
    console.log(`     card_id: ${c.card_id}`);
    console.log(`     Version: ${c.version || 'Normale'}`);
    console.log(`     Quantité: ${c.quantity || 1}`);
    console.log(`     Condition: ${c.condition || 'N/A'}`);
  });

  // Grouper par card_id + version
  console.log('\n=== GROUPEMENT PAR CARD_ID + VERSION ===');
  const tangelaGroups = {};
  tangelaCards.forEach(c => {
    const version = (c.version && c.version.trim()) ? c.version.trim() : 'Normale';
    const cardId = c.card_id || 'no-id';
    const key = `${cardId}-${version}`;
    if (!tangelaGroups[key]) tangelaGroups[key] = [];
    tangelaGroups[key].push(c);
  });

  Object.entries(tangelaGroups).forEach(([key, cards]) => {
    console.log(`\n  ${key}: ${cards.length} carte(s)`);
    cards.forEach(c => {
      console.log(`    - ID: ${c.id} | Condition: ${c.condition} | Quantité: ${c.quantity || 1}`);
    });
  });
}

test();
