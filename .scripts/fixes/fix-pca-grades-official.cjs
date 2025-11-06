const fs = require('fs');
const path = require('path');

// Fonction pour créer les options PCA avec nomenclature française officielle
const createPCAGradesAddCard = () => {
  return `                      {formData.gradeCompany === 'PCA' && (
                        <>
                          <SelectItem value="10+">10+ - COLLECTOR</SelectItem>
                          <SelectItem value="10">10 - NEUF SUP'</SelectItem>
                          <SelectItem value="9.5">9.5 - NEUF</SelectItem>
                          <SelectItem value="9">9 - PROCHE DU NEUF</SelectItem>
                          <SelectItem value="8">8 - EXCELLENT - PROCHE DU NEUF</SelectItem>
                          <SelectItem value="7">7 - EXCELLENT</SelectItem>
                          <SelectItem value="6">6 - TRÈS BON</SelectItem>
                          <SelectItem value="5">5 - BON</SelectItem>
                          <SelectItem value="4">4 - CORRECT</SelectItem>
                          <SelectItem value="3">3 - MOYEN</SelectItem>
                          <SelectItem value="2">2 - MAUVAIS</SelectItem>
                          <SelectItem value="1">1 - TRÈS MAUVAIS</SelectItem>
                        </>
                      )}`;
};

const createPCAGradesDetailsModal = () => {
  return `                            {editData.gradeCompany === 'PCA' && (
                              <>
                                <SelectItem value="10+">10+ - COLLECTOR</SelectItem>
                                <SelectItem value="10">10 - NEUF SUP'</SelectItem>
                                <SelectItem value="9.5">9.5 - NEUF</SelectItem>
                                <SelectItem value="9">9 - PROCHE DU NEUF</SelectItem>
                                <SelectItem value="8">8 - EXCELLENT - PROCHE DU NEUF</SelectItem>
                                <SelectItem value="7">7 - EXCELLENT</SelectItem>
                                <SelectItem value="6">6 - TRÈS BON</SelectItem>
                                <SelectItem value="5">5 - BON</SelectItem>
                                <SelectItem value="4">4 - CORRECT</SelectItem>
                                <SelectItem value="3">3 - MOYEN</SelectItem>
                                <SelectItem value="2">2 - MAUVAIS</SelectItem>
                                <SelectItem value="1">1 - TRÈS MAUVAIS</SelectItem>
                              </>
                            )}`;
};

console.log('📝 Modification des grades PCA avec nomenclature française officielle...\n');

// 1. Modifier AddCardModal.jsx
const addCardPath = path.join(__dirname, 'src', 'components', 'features', 'collection', 'AddCardModal.jsx');
let addCardContent = fs.readFileSync(addCardPath, 'utf8');

// Pattern pour matcher la section PCA actuelle
const oldPCAAddCard = /\{formData\.gradeCompany === 'PCA' && \(\s*<>\s*<SelectItem value="10\+">10\+ \(Pristine Plus\)<\/SelectItem>\s*<SelectItem value="10">10 \(Pristine\/Gem Mint\)<\/SelectItem>\s*<SelectItem value="9\.5">9\.5 \(Gem Mint\)<\/SelectItem>\s*<SelectItem value="9">9 \(Mint\)<\/SelectItem>\s*<SelectItem value="8\.5">8\.5 \(Near Mint\+\)<\/SelectItem>\s*<SelectItem value="8">8 \(Near Mint\)<\/SelectItem>\s*<SelectItem value="7\.5">7\.5 \(Near Mint-\)<\/SelectItem>\s*<SelectItem value="7">7 \(Excellent-Near Mint\)<\/SelectItem>\s*<SelectItem value="6">6 \(Excellent\)<\/SelectItem>\s*<SelectItem value="5">5 \(Very Good-Excellent\)<\/SelectItem>\s*<SelectItem value="4">4 \(Very Good\)<\/SelectItem>\s*<SelectItem value="3">3 \(Good\)<\/SelectItem>\s*<SelectItem value="2">2 \(Good-Fair\)<\/SelectItem>\s*<SelectItem value="1">1 \(Poor\)<\/SelectItem>\s*<\/>\s*\)\}/;

if (oldPCAAddCard.test(addCardContent)) {
  addCardContent = addCardContent.replace(oldPCAAddCard, createPCAGradesAddCard());
  fs.writeFileSync(addCardPath, addCardContent, 'utf8');
  console.log('✅ AddCardModal.jsx : Grades PCA français appliqués (sans 8.5 et 7.5)');
} else {
  console.log('⚠️  AddCardModal.jsx : Pattern PCA non trouvé');
}

// 2. Modifier CardDetailsModal.jsx
const detailsPath = path.join(__dirname, 'src', 'components', 'features', 'collection', 'CardDetailsModal.jsx');
let detailsContent = fs.readFileSync(detailsPath, 'utf8');

// Pattern pour matcher la section PCA actuelle
const oldPCADetails = /\{editData\.gradeCompany === 'PCA' && \(\s*<>\s*<SelectItem value="10\+">10\+ \(Pristine Plus\)<\/SelectItem>\s*<SelectItem value="10">10 \(Pristine\/Gem Mint\)<\/SelectItem>\s*<SelectItem value="9\.5">9\.5 \(Gem Mint\)<\/SelectItem>\s*<SelectItem value="9">9 \(Mint\)<\/SelectItem>\s*<SelectItem value="8\.5">8\.5 \(Near Mint\+\)<\/SelectItem>\s*<SelectItem value="8">8 \(Near Mint\)<\/SelectItem>\s*<SelectItem value="7\.5">7\.5 \(Near Mint-\)<\/SelectItem>\s*<SelectItem value="7">7 \(Excellent-Near Mint\)<\/SelectItem>\s*<SelectItem value="6">6 \(Excellent\)<\/SelectItem>\s*<SelectItem value="5">5 \(Very Good-Excellent\)<\/SelectItem>\s*<SelectItem value="4">4 \(Very Good\)<\/SelectItem>\s*<SelectItem value="3">3 \(Good\)<\/SelectItem>\s*<SelectItem value="2">2 \(Good-Fair\)<\/SelectItem>\s*<SelectItem value="1">1 \(Poor\)<\/SelectItem>\s*<\/>\s*\)\}/;

if (oldPCADetails.test(detailsContent)) {
  detailsContent = detailsContent.replace(oldPCADetails, createPCAGradesDetailsModal());
  fs.writeFileSync(detailsPath, detailsContent, 'utf8');
  console.log('✅ CardDetailsModal.jsx : Grades PCA français appliqués (sans 8.5 et 7.5)');
} else {
  console.log('⚠️  CardDetailsModal.jsx : Pattern PCA non trouvé');
}

console.log('\n✨ Modifications terminées !');
console.log('\nGrades PCA officiels (en français) :');
console.log('- 10+ - COLLECTOR');
console.log('- 10 - NEUF SUP\'');
console.log('- 9.5 - NEUF');
console.log('- 9 - PROCHE DU NEUF');
console.log('- 8 - EXCELLENT - PROCHE DU NEUF');
console.log('- 7 - EXCELLENT');
console.log('- 6 - TRÈS BON');
console.log('- 5 - BON');
console.log('- 4 - CORRECT');
console.log('- 3 - MOYEN');
console.log('- 2 - MAUVAIS');
console.log('- 1 - TRÈS MAUVAIS');
console.log('\n⚠️  Notes 8.5 et 7.5 retirées (n\'existent pas chez PCA)');
