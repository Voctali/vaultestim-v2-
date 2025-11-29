const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  // Chercher Switch et Tinkatink dans discovered_cards (ME1)
  console.log('=== Recherche dans discovered_cards ===\n');

  // Switch (Echange) - carte 130
  const { data: switch1, error: e1 } = await supabase
    .from('discovered_cards')
    .select('id, name, number, set')
    .ilike('id', 'me1-130%');

  console.log('ME1-130 (Switch/Echange):');
  console.log(JSON.stringify(switch1, null, 2));

  // Tinkatink (Forgerette) - carte 96
  const { data: tink, error: e2 } = await supabase
    .from('discovered_cards')
    .select('id, name, number, set')
    .or('id.eq.me1-96,id.eq.me1-096');

  console.log('\nME1-96/096 (Tinkatink/Forgerette):');
  console.log(JSON.stringify(tink, null, 2));

  // Chercher par nom
  const { data: switchByName } = await supabase
    .from('discovered_cards')
    .select('id, name, number')
    .ilike('name', '%switch%')
    .ilike('id', 'me%');

  console.log('\nSwitch par nom (ME*):');
  console.log(JSON.stringify(switchByName, null, 2));

  const { data: tinkByName } = await supabase
    .from('discovered_cards')
    .select('id, name, number')
    .ilike('name', '%tinkatink%')
    .ilike('id', 'me%');

  console.log('\nTinkatink par nom (ME*):');
  console.log(JSON.stringify(tinkByName, null, 2));
}

check();
