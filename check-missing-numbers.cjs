const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkCards() {
  // Chercher Echange et Forgerette par nom
  console.log('=== Recherche par nom ===');

  const { data: echange, error: e1 } = await supabase
    .from('user_collection')
    .select('id, card_id, name, number, version, extension, set')
    .ilike('name', '%switch%');

  console.log('\nSwitch/Echange:', echange?.length || 0);
  if (echange) console.log(JSON.stringify(echange, null, 2));

  const { data: forgerette, error: e2 } = await supabase
    .from('user_collection')
    .select('id, card_id, name, number, version, extension, set')
    .ilike('name', '%tinkatink%');

  console.log('\nTinkatink/Forgerette:', forgerette?.length || 0);
  if (forgerette) console.log(JSON.stringify(forgerette, null, 2));

  // Aussi chercher toutes les cartes ME sans numéro
  const { data: meCards, error: e3 } = await supabase
    .from('user_collection')
    .select('id, card_id, name, number, version')
    .or('card_id.ilike.me1%,card_id.ilike.me2%,card_id.ilike.mep%');

  console.log('\n=== Toutes cartes ME ===');
  console.log('Total:', meCards?.length || 0);

  if (meCards) {
    const sansNumero = meCards.filter(c => !c.number || c.number === '');
    console.log('Sans numéro:', sansNumero.length);
    if (sansNumero.length > 0) {
      console.log(JSON.stringify(sansNumero, null, 2));
    }
  }
}

checkCards();
