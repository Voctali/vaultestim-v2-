const fs = require('fs');
const path = require('path');

const panelFile = path.join(__dirname, 'src', 'components', 'features', 'admin', 'SetImportPanel.jsx');

console.log('🔍 Ajout recherche par nom + chargement direct API...\n');

// Lire le fichier
let content = fs.readFileSync(panelFile, 'utf8');

// 1. Ajouter state pour recherche par nom
console.log('1️⃣ Ajout state setNameSearch...');
content = content.replace(
  "  const [setIdInput, setSetIdInput] = useState('')\n\n  // Charger les extensions au montage",
  "  const [setIdInput, setSetIdInput] = useState('')\n  const [setNameSearch, setSetNameSearch] = useState('')\n\n  // Charger les extensions au montage"
);

// 2. Filtrer aussi par nom
console.log('2️⃣ Ajout filtrage par nom...');
content = content.replace(
  `  // Filtrer les extensions par série
  const filteredSets = seriesFilter === 'all'
    ? sets
    : sets.filter(set => set.series === seriesFilter)`,
  `  // Filtrer les extensions par série ET par nom
  const filteredSets = sets.filter(set => {
    const matchesSeries = seriesFilter === 'all' || set.series === seriesFilter
    const matchesName = !setNameSearch || set.name.toLowerCase().includes(setNameSearch.toLowerCase())
    return matchesSeries && matchesName
  })`
);

// 3. Ajouter champ de recherche par nom avant le Select
console.log('3️⃣ Ajout UI recherche par nom...');
content = content.replace(
  '        {/* Sélection de l\'extension */}\n        <div className="space-y-2">',
  `        {/* Recherche par nom d'extension */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Rechercher par nom</label>
          <input
            type="text"
            value={setNameSearch}
            onChange={(e) => setSetNameSearch(e.target.value)}
            placeholder="Ex: Mega Evolution, Scarlet & Violet..."
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <p className="text-xs text-muted-foreground">
            {filteredSets.length} extension(s) trouvée(s) • Total chargées: {sets.length}
          </p>
        </div>

        {/* Sélection de l'extension */}
        <div className="space-y-2">`
);

// 4. Ajouter message si aucune extension chargée
console.log('4️⃣ Ajout message aide...');
content = content.replace(
  '        {/* Informations */}\n        <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg">',
  `        {/* Message si pas d'extensions chargées */}
        {sets.length === 0 && !isLoadingSets && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg">
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              <strong>⚠️ Aucune extension chargée</strong>
              <br />
              Le chargement initial peut prendre du temps ou échouer (timeout API).
              <br />
              <strong>Solution:</strong> Utilisez la recherche par ID ci-dessus si vous connaissez l'ID de l'extension (ex: xy1, sv8, me02).
            </p>
          </div>
        )}

        {/* Informations */}
        <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg">`
);

console.log('\n✅ Modifications appliquées:');
console.log('  ✓ Recherche par nom d\'extension ajoutée');
console.log('  ✓ Compteur d\'extensions affichées');
console.log('  ✓ Message d\'aide si aucune extension');
console.log('\n🎯 Maintenant vous pouvez:');
console.log('  • Rechercher par nom: "Mega" trouve toutes les Mega Evolution');
console.log('  • Rechercher par ID: "xy1" si vous connaissez le code');
console.log('  • Voir combien d\'extensions sont disponibles');

// Écrire le fichier
fs.writeFileSync(panelFile, content, 'utf8');

console.log('\n✅ Fichier mis à jour!');
