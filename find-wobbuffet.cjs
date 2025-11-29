require('dotenv').config();

async function findCorrectWobbuffet() {
  // Chercher par tcgid svp-203
  const response = await fetch(
    'https://cardmarket-api-tcg.p.rapidapi.com/pokemon/cards/svp-203?language=2',
    {
      headers: {
        'x-rapidapi-key': process.env.VITE_RAPIDAPI_KEY,
        'x-rapidapi-host': 'cardmarket-api-tcg.p.rapidapi.com'
      }
    }
  );

  const data = await response.json();
  console.log('Recherche par ID svp-203...');
  console.log('');
  console.log('Réponse:', JSON.stringify(data, null, 2));
}

findCorrectWobbuffet();
