const fs = require('fs');
const path = require('path');

console.log('✨ Ajout "Holo Cosmos" dans les versions...\n');

// 1. AddToCollectionModal - Ajouter dans le Select
const modalPath = path.join(__dirname, 'src', 'components', 'features', 'collection', 'AddToCollectionModal.jsx');
let modalContent = fs.readFileSync(modalPath, 'utf8');

const oldVersions = `<SelectItem value="Holo">Holo</SelectItem>
                      <SelectItem value="Tampon (logo extension)">Tampon (logo extension)</SelectItem>`;

const newVersions = `<SelectItem value="Holo">Holo</SelectItem>
                      <SelectItem value="Holo Cosmos">✨ Holo Cosmos</SelectItem>
                      <SelectItem value="Tampon (logo extension)">Tampon (logo extension)</SelectItem>`;

if (modalContent.includes('Holo Cosmos')) {
  console.log('⚠️  "Holo Cosmos" déjà présent dans AddToCollectionModal');
} else if (modalContent.includes(oldVersions)) {
  modalContent = modalContent.replace(oldVersions, newVersions);
  fs.writeFileSync(modalPath, modalContent, 'utf8');
  console.log('✅ "Holo Cosmos" ajouté dans le sélecteur de versions');
} else {
  console.log('❌ Pattern non trouvé dans AddToCollectionModal');
}

// 2. AdminDatabaseEditor - Ajouter checkbox Holo Cosmos
console.log('\n2️⃣ AdminDatabaseEditor - Ajout checkbox...');
const adminPath = path.join(__dirname, 'src', 'pages', 'AdminDatabaseEditor.jsx');
let adminContent = fs.readFileSync(adminPath, 'utf8');

const adminOld = `              </div>

              {/* Type et Sous-types */}
              <div className="grid grid-cols-2 gap-4">`;

const adminNew = `              </div>

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

if (adminContent.includes('has-cosmos-holo')) {
  console.log('⚠️  Checkbox déjà présente dans AdminDatabaseEditor');
} else if (adminContent.includes(adminOld)) {
  adminContent = adminContent.replace(adminOld, adminNew);
  fs.writeFileSync(adminPath, adminContent, 'utf8');
  console.log('✅ Checkbox Holo Cosmos ajoutée dans AdminDatabaseEditor');
} else {
  console.log('❌ Pattern non trouvé dans AdminDatabaseEditor');
}

console.log('\n✅ Modifications terminées!');
console.log('\n📋 Résumé:');
console.log('  • AddToCollectionModal: "✨ Holo Cosmos" dans versions');
console.log('  • AdminDatabaseEditor: Checkbox pour marquer cartes');
console.log('\n🎯 Plus logique:');
console.log('  • Holo Cosmos = une VERSION (comme Reverse Holo, Full Art)');
console.log('  • Pas besoin de checkbox séparée!');
console.log('\n🔄 Le badge affichera automatiquement si version = "Holo Cosmos"');
