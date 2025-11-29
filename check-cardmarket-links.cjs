/**
 * Script pour vérifier et analyser les liens CardMarket dans Supabase
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkLinks() {
  console.log('=== Analyse des liens CardMarket ===\n');

  // 1. Statistiques globales
  const { count: totalCards } = await supabase
    .from('discovered_cards')
    .select('*', { count: 'exact', head: true });

  const { count: withUrl } = await supabase
    .from('discovered_cards')
    .select('*', { count: 'exact', head: true })
    .not('cardmarket_url', 'is', null);

  const { count: withoutUrl } = await supabase
    .from('discovered_cards')
    .select('*', { count: 'exact', head: true })
    .is('cardmarket_url', null);

  console.log('📊 Statistiques globales:');
  console.log(`   Total cartes: ${totalCards}`);
  console.log(`   Avec lien: ${withUrl} (${((withUrl/totalCards)*100).toFixed(1)}%)`);
  console.log(`   Sans lien: ${withoutUrl} (${((withoutUrl/totalCards)*100).toFixed(1)}%)`);

  // 2. Cartes SV sans lien
  const { data: svNoLink } = await supabase
    .from('discovered_cards')
    .select('id, name')
    .like('id', 'sv%')
    .is('cardmarket_url', null)
    .limit(100);

  console.log(`\n🔴 Cartes Scarlet & Violet SANS lien: ${svNoLink?.length || 0}`);
  if (svNoLink && svNoLink.length > 0) {
    // Grouper par extension
    const byExt = {};
    svNoLink.forEach(c => {
      const ext = c.id.split('-')[0];
      if (!byExt[ext]) byExt[ext] = 0;
      byExt[ext]++;
    });
    Object.entries(byExt).sort((a,b) => b[1] - a[1]).forEach(([ext, count]) => {
      console.log(`   ${ext}: ${count} cartes`);
    });
  }

  // 3. Cartes ME sans lien
  const { data: meNoLink } = await supabase
    .from('discovered_cards')
    .select('id, name')
    .like('id', 'me%')
    .is('cardmarket_url', null)
    .limit(100);

  console.log(`\n🔴 Cartes Mega Evolution SANS lien: ${meNoLink?.length || 0}`);
  if (meNoLink && meNoLink.length > 0) {
    meNoLink.slice(0, 5).forEach(c => console.log(`   ${c.id}: ${c.name}`));
  }

  // 4. Vérifier les URLs sans ?language=2
  const { data: withoutLang } = await supabase
    .from('discovered_cards')
    .select('id, cardmarket_url')
    .not('cardmarket_url', 'is', null)
    .not('cardmarket_url', 'ilike', '%language=2%')
    .limit(100);

  console.log(`\n⚠️  URLs SANS paramètre ?language=2: ${withoutLang?.length || 0}`);
  if (withoutLang && withoutLang.length > 0) {
    withoutLang.slice(0, 3).forEach(c => {
      console.log(`   ${c.id}: ${c.cardmarket_url}`);
    });
  }

  // 5. Exemples de liens existants
  const { data: examples } = await supabase
    .from('discovered_cards')
    .select('id, name, cardmarket_url')
    .not('cardmarket_url', 'is', null)
    .like('id', 'sv%')
    .limit(5);

  console.log('\n✅ Exemples de liens existants (SV):');
  if (examples) {
    examples.forEach(c => {
      console.log(`   ${c.id}: ${c.cardmarket_url}`);
    });
  }
}

checkLinks().catch(console.error);
