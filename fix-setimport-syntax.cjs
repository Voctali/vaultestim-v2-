const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'features', 'admin', 'SetImportPanel.jsx');

console.log('🔧 Correction de la syntaxe JSX...\n');

// Lire le fichier
let content = fs.readFileSync(filePath, 'utf8');

// Le problème: le bloc "Recherche par ID" est placé ENTRE le filtre série et la sélection
// Il faut réorganiser proprement

// Trouver et extraire le bloc de recherche par ID
const searchByIdBlock = `        {/* Recherche par ID d'extension */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Ou rechercher par ID (ex: me02, sv08)</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={setIdInput}
              onChange={(e) => setSetIdInput(e.target.value.toLowerCase())}
              placeholder="me02"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleSearchById()}
            />
            <Button
              onClick={handleSearchById}
              disabled={!setIdInput.trim() || isLoadingSets}
              variant="outline"
            >
              🔍 Rechercher
            </Button>
          </div>
        </div>

`;

// Supprimer temporairement le bloc mal placé
content = content.replace(searchByIdBlock, '');

// Réinsérer le bloc APRÈS le Select (avant les infos de l'extension)
content = content.replace(
  '        {/* Infos de l\'extension sélectionnée */}',
  searchByIdBlock + '        {/* Infos de l\'extension sélectionnée */}'
);

console.log('✅ Structure JSX corrigée');
console.log('📝 Le bloc de recherche par ID a été déplacé après le Select');

// Écrire le fichier corrigé
fs.writeFileSync(filePath, content, 'utf8');

console.log('\n✅ Fichier corrigé avec succès!');
