const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'features', 'collection', 'AddCardModal.jsx');

console.log('📝 Lecture du fichier AddCardModal.jsx...');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Ajouter gradeCompany et grade dans l'état initial (ligne 27-28)
const oldInitialState = `    isGraded: false,
    personalNotes: ''
  })`;

const newInitialState = `    isGraded: false,
    gradeCompany: '',
    grade: '',
    personalNotes: ''
  })`;

// 2. Ajouter gradeCompany et grade dans le reset (ligne 51-52)
const oldResetState = `      isGraded: false,
      personalNotes: ''
    })`;

const newResetState = `      isGraded: false,
      gradeCompany: '',
      grade: '',
      personalNotes: ''
    })`;

// 3. Ajouter la section conditionnelle après le checkbox (ligne 308-309)
const oldCheckbox = `              <Label htmlFor="isGraded">Carte gradée</Label>
            </div>
          </div>

          {/* Personal Notes Section */}`;

const newCheckbox = `              <Label htmlFor="isGraded">Carte gradée</Label>
            </div>

            {formData.isGraded && (
              <div className="grid grid-cols-2 gap-4 ml-6">
                <div className="space-y-2">
                  <Label htmlFor="gradeCompany">Société de gradation</Label>
                  <Select value={formData.gradeCompany} onValueChange={(value) => handleInputChange('gradeCompany', value)}>
                    <SelectTrigger className="golden-border">
                      <SelectValue placeholder="Choisir..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PSA">PSA</SelectItem>
                      <SelectItem value="BGS">BGS/Beckett</SelectItem>
                      <SelectItem value="CGC">CGC</SelectItem>
                      <SelectItem value="SGC">SGC</SelectItem>
                      <SelectItem value="PCA">PCA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grade">Note</Label>
                  <Select value={formData.grade} onValueChange={(value) => handleInputChange('grade', value)}>
                    <SelectTrigger className="golden-border">
                      <SelectValue placeholder="Choisir..." />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.gradeCompany === 'PCA' && (
                        <SelectItem value="10+">10+ (Pristine Plus)</SelectItem>
                      )}
                      <SelectItem value="10">10 (Pristine/Gem Mint)</SelectItem>
                      <SelectItem value="9.5">9.5 (Gem Mint)</SelectItem>
                      <SelectItem value="9">9 (Mint)</SelectItem>
                      <SelectItem value="8.5">8.5 (Near Mint+)</SelectItem>
                      <SelectItem value="8">8 (Near Mint)</SelectItem>
                      <SelectItem value="7.5">7.5 (Near Mint-)</SelectItem>
                      <SelectItem value="7">7 (Excellent-Near Mint)</SelectItem>
                      <SelectItem value="6">6 (Excellent)</SelectItem>
                      <SelectItem value="5">5 (Very Good-Excellent)</SelectItem>
                      <SelectItem value="4">4 (Very Good)</SelectItem>
                      <SelectItem value="3">3 (Good)</SelectItem>
                      <SelectItem value="2">2 (Good-Fair)</SelectItem>
                      <SelectItem value="1">1 (Poor)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Personal Notes Section */}`;

let changes = 0;

// Appliquer les modifications
if (content.includes(oldInitialState)) {
  content = content.replace(oldInitialState, newInitialState);
  console.log('✅ Ajout gradeCompany et grade dans état initial');
  changes++;
} else {
  console.log('⚠️  État initial déjà modifié ou introuvable');
}

if (content.includes(oldResetState)) {
  content = content.replace(oldResetState, newResetState);
  console.log('✅ Ajout gradeCompany et grade dans reset');
  changes++;
} else {
  console.log('⚠️  Reset state déjà modifié ou introuvable');
}

if (content.includes(oldCheckbox)) {
  content = content.replace(oldCheckbox, newCheckbox);
  console.log('✅ Ajout section conditionnelle de gradation (avec 10+ exclusif PCA)');
  changes++;
} else {
  console.log('⚠️  Section checkbox déjà modifiée ou introuvable');
}

if (changes > 0) {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`\n✨ ${changes} modifications appliquées avec succès !`);
  console.log('   Les champs de gradation s\'afficheront maintenant quand "Carte gradée" est cochée');
} else {
  console.log('\n⚠️  Aucune modification appliquée (fichier peut-être déjà à jour)');
}
