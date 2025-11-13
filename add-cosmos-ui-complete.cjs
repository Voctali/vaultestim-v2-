const fs = require('fs');
const path = require('path');

console.log('✨ Ajout UI Holo Cosmos...\n');

const modifications = [];

// 1. AdminDatabaseEditor.jsx - Ajouter checkbox
console.log('1️⃣ AdminDatabaseEditor.jsx - Ajout checkbox...');
const adminPath = path.join(__dirname, 'src', 'pages', 'AdminDatabaseEditor.jsx');
let adminContent = fs.readFileSync(adminPath, 'utf8');

const cosmosCheckbox = `                </div>
              </div>

              {/* Version Holo Cosmos */}
              <div className="space-y-2 p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="has-cosmos-holo"
                    checked={formData.has_cosmos_holo || false}
                    onChange={(e) => setFormData(prev => ({ ...prev, has_cosmos_holo: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="has-cosmos-holo" className="text-sm font-medium cursor-pointer">
                    Cette carte existe en version Holo Cosmos ✨
                  </label>
                </div>
                <p className="text-xs text-muted-foreground ml-6">
                  Cochez si cette carte existe avec une finition Holo Cosmos (motif cosmique spécial)
                </p>
              </div>

              {/* Type et Sous-types */}
              <div className="grid grid-cols-2 gap-4">`;

const oldAdminPattern = `                </div>
              </div>

              {/* Type et Sous-types */}
              <div className="grid grid-cols-2 gap-4">`;

if (adminContent.includes('has-cosmos-holo')) {
  console.log('   ⚠️  Checkbox déjà présente');
} else if (adminContent.includes(oldAdminPattern)) {
  adminContent = adminContent.replace(oldAdminPattern, cosmosCheckbox);
  fs.writeFileSync(adminPath, adminContent, 'utf8');
  console.log('   ✅ Checkbox ajoutée');
  modifications.push('AdminDatabaseEditor: checkbox Holo Cosmos');
} else {
  console.log('   ⚠️  Pattern non trouvé, skip');
}

// 2. AddToCollectionModal.jsx - Ajouter import et checkbox
console.log('\n2️⃣ AddToCollectionModal.jsx - Ajout checkbox...');
const modalPath = path.join(__dirname, 'src', 'components', 'features', 'collection', 'AddToCollectionModal.jsx');
let modalContent = fs.readFileSync(modalPath, 'utf8');

// Ajouter import
if (!modalContent.includes('CosmosHoloBadge')) {
  modalContent = modalContent.replace(
    "import { useCardDatabase } from '@/hooks/useCardDatabase.jsx'",
    `import { useCardDatabase } from '@/hooks/useCardDatabase.jsx'
import { CosmosHoloBadge } from './CosmosHoloBadge'`
  );
  console.log('   ✅ Import CosmosHoloBadge ajouté');
  modifications.push('AddToCollectionModal: import CosmosHoloBadge');
} else {
  console.log('   ⚠️  Import déjà présent');
}

// Ajouter state
if (!modalContent.includes('isCosmosHolo')) {
  modalContent = modalContent.replace(
    /const \[quantity, setQuantity\] = useState\(1\)/,
    `const [quantity, setQuantity] = useState(1)
  const [isCosmosHolo, setIsCosmosHolo] = useState(false)`
  );
  console.log('   ✅ State isCosmosHolo ajouté');
  modifications.push('AddToCollectionModal: state isCosmosHolo');
} else {
  console.log('   ⚠️  State déjà présent');
}

// Ajouter dans l'objet addToCollection
if (!modalContent.includes('is_cosmos_holo:')) {
  // Chercher le pattern addToCollection avec quantity
  modalContent = modalContent.replace(
    /quantity:\s*quantity,/,
    `quantity: quantity,
        is_cosmos_holo: isCosmosHolo,`
  );
  console.log('   ✅ Champ is_cosmos_holo ajouté');
  modifications.push('AddToCollectionModal: champ is_cosmos_holo');
} else {
  console.log('   ⚠️  Champ déjà présent');
}

fs.writeFileSync(modalPath, modalContent, 'utf8');

console.log('\n✅ Modifications UI appliquées!');
console.log('\n📋 Modifications:');
modifications.forEach((mod, i) => console.log(`   ${i + 1}. ${mod}`));

console.log('\n⚠️  Note: La checkbox UI dans AddToCollectionModal doit être ajoutée manuellement');
console.log('   Car elle nécessite de trouver l\'emplacement exact dans le JSX');
console.log('\n🎯 Prochaines étapes:');
console.log('   1. Ajouter UI checkbox dans AddToCollectionModal (JSX)');
console.log('   2. Ajouter badges dans Collection.jsx et Explore.jsx');
console.log('   3. Tester');
console.log('   4. Déployer');
