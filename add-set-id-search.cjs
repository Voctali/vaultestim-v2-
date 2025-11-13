const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'features', 'admin', 'SetImportPanel.jsx');

console.log('🔍 Ajout recherche par ID d\'extension...\n');

// Lire le fichier
let content = fs.readFileSync(filePath, 'utf8');

// 1. Ajouter state pour l'ID manuel
console.log('1️⃣ Ajout du state setIdInput...');
content = content.replace(
  '  const [seriesFilter, setSeriesFilter] = useState(\'all\')\n  const [series, setSeries] = useState([])',
  '  const [seriesFilter, setSeriesFilter] = useState(\'all\')\n  const [series, setSeries] = useState([])\n  const [setIdInput, setSetIdInput] = useState(\'\')'
);

// 2. Ajouter fonction de recherche par ID
console.log('2️⃣ Ajout handleSearchById...');
const searchByIdFunction = `
  const handleSearchById = async () => {
    if (!setIdInput.trim()) return

    try {
      const setInfo = await SetImportService.getSetInfo(setIdInput.trim().toLowerCase())
      setSelectedSet(setInfo)
      console.log('📦 Extension trouvée par ID:', setInfo)
    } catch (error) {
      console.error('❌ Extension non trouvée:', error)
      alert(\`Extension "\${setIdInput}" non trouvée. Vérifiez l'ID (ex: me02, sv08, etc.)\`)
    }
  }
`;

content = content.replace(
  '  const handleSetSelect = async (setId) => {',
  searchByIdFunction + '\n  const handleSetSelect = async (setId) => {'
);

// 3. Ajouter l'input et le bouton de recherche
console.log('3️⃣ Ajout UI recherche par ID...');
const searchUI = `        {/* Recherche par ID d'extension */}
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

content = content.replace(
  '        {/* Sélection de l\'extension */}',
  searchUI + '        {/* Sélection de l\'extension */'
);

// 4. Ajouter bouton de rafraîchissement de la liste
console.log('4️⃣ Ajout bouton rafraîchir...');
content = content.replace(
  '          <label className="text-sm font-medium">Sélectionner une extension</label>',
  '          <div className="flex items-center justify-between">\n            <label className="text-sm font-medium">Sélectionner une extension</label>\n            <Button\n              variant="ghost"\n              size="sm"\n              onClick={loadSets}\n              disabled={isLoadingSets}\n            >\n              🔄 Rafraîchir\n            </Button>\n          </div>'
);

console.log('\n✅ Modifications appliquées:');
console.log('  ✓ State setIdInput ajouté');
console.log('  ✓ Fonction handleSearchById ajoutée');
console.log('  ✓ Champ de recherche par ID ajouté');
console.log('  ✓ Bouton rafraîchir ajouté');
console.log('\n🎯 Vous pouvez maintenant:');
console.log('  • Rechercher ME02 directement par son ID');
console.log('  • Rafraîchir la liste des extensions');
console.log('  • Importer des extensions non listées');

// Écrire le fichier modifié
fs.writeFileSync(filePath, content, 'utf8');

console.log('\n✅ Fichier mis à jour avec succès!');
