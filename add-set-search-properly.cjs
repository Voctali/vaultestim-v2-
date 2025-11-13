const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'features', 'admin', 'SetImportPanel.jsx');

console.log('🔍 Ajout recherche par ID (version propre)...\n');

// Lire le fichier
let content = fs.readFileSync(filePath, 'utf8');

// 1. Ajouter le state
console.log('1️⃣ Ajout state setIdInput...');
content = content.replace(
  "  const [series, setSeries] = useState([])\n\n  // Charger les extensions au montage",
  "  const [series, setSeries] = useState([])\n  const [setIdInput, setSetIdInput] = useState('')\n\n  // Charger les extensions au montage"
);

// 2. Ajouter la fonction handleSearchById après loadSeries
console.log('2️⃣ Ajout fonction handleSearchById...');
const handleSearchByIdCode = `
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
  }\n`;

content = content.replace(
  "  const handleSetSelect = async (setId) => {",
  handleSearchByIdCode + "  const handleSetSelect = async (setId) => {"
);

// 3. Ajouter l'UI de recherche APRÈS le bloc </div> de la sélection d'extension
console.log('3️⃣ Ajout UI de recherche...');
const searchUI = `
        {/* Recherche manuelle par ID */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Ou rechercher par ID (ex: me02, sv08)</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={setIdInput}
              onChange={(e) => setSetIdInput(e.target.value.toLowerCase())}
              placeholder="me02"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
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
  "        {/* Infos de l'extension sélectionnée */}",
  searchUI + "\n        {/* Infos de l'extension sélectionnée */}"
);

console.log('\n✅ Modifications appliquées avec succès');

// Écrire le fichier
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Fichier mis à jour!');
