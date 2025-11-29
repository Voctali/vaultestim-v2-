const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function analyze() {
  // Demander l'email pour identifier l'utilisateur
  const email = process.argv[2];

  if (!email) {
    console.log('Usage: node analyze-duplicates.cjs <email>');
    console.log('Exemple: node analyze-duplicates.cjs mon@email.com');
    return;
  }

  console.log(`\nRecherche de l'utilisateur: ${email}\n`);

  // Trouver l'utilisateur par email via la table auth.users n'est pas accessible
  // On va plutôt récupérer toutes les collections et grouper

  // Récupérer TOUTES les cartes de user_collection (sans filtre user_id car on n'y a pas accès)
  let allCards = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  console.log('Chargement des données...');

  while (hasMore) {
    const { data, error } = await supabase
      .from('user_collection')
      .select('*')
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.log('Erreur:', error.message);
      return;
    }

    if (data.length === 0) {
      hasMore = false;
    } else {
      allCards = allCards.concat(data);
      page++;
      if (data.length < pageSize) hasMore = false;
    }
  }

  console.log(`Total cartes chargées: ${allCards.length}\n`);

  if (allCards.length === 0) {
    console.log('Aucune carte trouvée. RLS peut bloquer l\'accès sans authentification.');
    console.log('\nAlternative: Exécutez cette requête SQL dans Supabase Dashboard:');
    console.log('----------------------------------------');
    console.log(`
SELECT
  name,
  card_id,
  version,
  COUNT(*) as count
FROM user_collection
WHERE name ILIKE '%bulbasaur%'
GROUP BY name, card_id, version
ORDER BY name, card_id, version;
    `);
    return;
  }

  // Analyser Bulbasaur
  console.log('=== ANALYSE BULBASAUR ===\n');
  const bulbasaur = allCards.filter(c =>
    c.name?.toLowerCase().includes('bulbasaur')
  );

  console.log(`Trouvé: ${bulbasaur.length} carte(s) Bulbasaur\n`);

  if (bulbasaur.length > 0) {
    // Grouper par card_id + version
    const groups = {};
    bulbasaur.forEach(card => {
      const version = card.version || 'Normale';
      const cardId = card.card_id || 'SANS_CARD_ID';
      const key = `${cardId}|||${version}`;

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(card);
    });

    console.log('Groupement par card_id + version:\n');
    Object.entries(groups).forEach(([key, cards]) => {
      const [cardId, version] = key.split('|||');
      console.log(`  ${cardId} (${version}): ${cards.length} instance(s)`);
      cards.forEach(c => {
        console.log(`    - DB ID: ${c.id} | Condition: ${c.condition} | Qty: ${c.quantity || 1}`);
      });
    });
  }

  // Analyser tous les doublons potentiels
  console.log('\n\n=== CARTES AVEC PLUSIEURS ENTRÉES (même card_id + version) ===\n');

  const allGroups = {};
  allCards.forEach(card => {
    const version = card.version || 'Normale';
    const cardId = card.card_id || `NO_ID_${card.id}`;
    const key = `${cardId}|||${version}`;

    if (!allGroups[key]) {
      allGroups[key] = [];
    }
    allGroups[key].push(card);
  });

  const duplicateGroups = Object.entries(allGroups)
    .filter(([, cards]) => cards.length > 1)
    .sort((a, b) => b[1].length - a[1].length);

  console.log(`Trouvé: ${duplicateGroups.length} groupe(s) avec plusieurs entrées\n`);

  duplicateGroups.slice(0, 20).forEach(([key, cards]) => {
    const [cardId, version] = key.split('|||');
    const name = cards[0].name;
    console.log(`${name} | ${cardId} | ${version}: ${cards.length} entrées DB`);
  });

  if (duplicateGroups.length > 20) {
    console.log(`\n... et ${duplicateGroups.length - 20} autres groupes`);
  }
}

analyze();
