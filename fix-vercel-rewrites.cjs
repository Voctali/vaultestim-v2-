const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'vercel.json');

console.log('🔧 Correction des rewrites Vercel...');

const config = {
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/pokemontcg/:match*",
      "destination": "https://api.pokemontcg.io/:match*"
    },
    {
      "source": "/((?!api).*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization"
        }
      ]
    }
  ]
};

fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf8');

console.log('✅ vercel.json corrigé:');
console.log('  - Changé :path* → :match* (plus explicite)');
console.log('  - Simplifié regex pour fallback SPA');
console.log('\n🎯 Le proxy API Pokemon TCG devrait maintenant fonctionner');
