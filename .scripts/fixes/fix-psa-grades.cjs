const fs = require('fs');
const path = require('path');

// Fonction pour créer les options de grade selon la société
const createGradeOptions = () => {
  return `                    <SelectContent>
                      {formData.gradeCompany === 'PCA' && (
                        <>
                          <SelectItem value="10+">10+ (Pristine Plus)</SelectItem>
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
                        </>
                      )}
                      {formData.gradeCompany === 'PSA' && (
                        <>
                          <SelectItem value="10">10 - GEM MINT</SelectItem>
                          <SelectItem value="9">9 - MINT</SelectItem>
                          <SelectItem value="8.5">8.5 - NM-MT +</SelectItem>
                          <SelectItem value="8">8 - NM-MT</SelectItem>
                          <SelectItem value="7">7 - NM</SelectItem>
                          <SelectItem value="6">6 - EX-MT</SelectItem>
                          <SelectItem value="5">5 - EX</SelectItem>
                          <SelectItem value="4">4 - VG-EX</SelectItem>
                          <SelectItem value="3">3 - VG</SelectItem>
                          <SelectItem value="2">2 - GOOD</SelectItem>
                          <SelectItem value="1.5">1.5 - FR</SelectItem>
                          <SelectItem value="1">1 - PR</SelectItem>
                          <SelectItem value="N0">N0 - AUTHENTIC</SelectItem>
                          <SelectItem value="AA">AA - ALTERED AUTHENTIC</SelectItem>
                        </>
                      )}
                      {formData.gradeCompany && formData.gradeCompany !== 'PCA' && formData.gradeCompany !== 'PSA' && (
                        <>
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
                        </>
                      )}
                    </SelectContent>`;
};

// Pour CardDetailsModal, utiliser editData au lieu de formData
const createGradeOptionsEdit = () => {
  return `                          <SelectContent>
                            {editData.gradeCompany === 'PCA' && (
                              <>
                                <SelectItem value="10+">10+ (Pristine Plus)</SelectItem>
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
                              </>
                            )}
                            {editData.gradeCompany === 'PSA' && (
                              <>
                                <SelectItem value="10">10 - GEM MINT</SelectItem>
                                <SelectItem value="9">9 - MINT</SelectItem>
                                <SelectItem value="8.5">8.5 - NM-MT +</SelectItem>
                                <SelectItem value="8">8 - NM-MT</SelectItem>
                                <SelectItem value="7">7 - NM</SelectItem>
                                <SelectItem value="6">6 - EX-MT</SelectItem>
                                <SelectItem value="5">5 - EX</SelectItem>
                                <SelectItem value="4">4 - VG-EX</SelectItem>
                                <SelectItem value="3">3 - VG</SelectItem>
                                <SelectItem value="2">2 - GOOD</SelectItem>
                                <SelectItem value="1.5">1.5 - FR</SelectItem>
                                <SelectItem value="1">1 - PR</SelectItem>
                                <SelectItem value="N0">N0 - AUTHENTIC</SelectItem>
                                <SelectItem value="AA">AA - ALTERED AUTHENTIC</SelectItem>
                              </>
                            )}
                            {editData.gradeCompany && editData.gradeCompany !== 'PCA' && editData.gradeCompany !== 'PSA' && (
                              <>
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
                              </>
                            )}
                          </SelectContent>`;
};

console.log('📝 Modification des grades PSA dans les deux modales...\n');

// 1. Modifier AddCardModal.jsx
const addCardPath = path.join(__dirname, 'src', 'components', 'features', 'collection', 'AddCardModal.jsx');
let addCardContent = fs.readFileSync(addCardPath, 'utf8');

const oldAddCardGrades = /                    <SelectContent>\s*\{formData\.gradeCompany === 'PCA' && \(\s*<SelectItem value="10\+">10\+ \(Pristine Plus\)<\/SelectItem>\s*\)\}\s*<SelectItem value="10">10 \(Pristine\/Gem Mint\)<\/SelectItem>\s*<SelectItem value="9\.5">9\.5 \(Gem Mint\)<\/SelectItem>\s*<SelectItem value="9">9 \(Mint\)<\/SelectItem>\s*<SelectItem value="8\.5">8\.5 \(Near Mint\+\)<\/SelectItem>\s*<SelectItem value="8">8 \(Near Mint\)<\/SelectItem>\s*<SelectItem value="7\.5">7\.5 \(Near Mint-\)<\/SelectItem>\s*<SelectItem value="7">7 \(Excellent-Near Mint\)<\/SelectItem>\s*<SelectItem value="6">6 \(Excellent\)<\/SelectItem>\s*<SelectItem value="5">5 \(Very Good-Excellent\)<\/SelectItem>\s*<SelectItem value="4">4 \(Very Good\)<\/SelectItem>\s*<SelectItem value="3">3 \(Good\)<\/SelectItem>\s*<SelectItem value="2">2 \(Good-Fair\)<\/SelectItem>\s*<SelectItem value="1">1 \(Poor\)<\/SelectItem>\s*<\/SelectContent>/;

if (oldAddCardGrades.test(addCardContent)) {
  addCardContent = addCardContent.replace(oldAddCardGrades, createGradeOptions());
  fs.writeFileSync(addCardPath, addCardContent, 'utf8');
  console.log('✅ AddCardModal.jsx : Grades PSA ajoutés');
} else {
  console.log('⚠️  AddCardModal.jsx : Pattern non trouvé (peut-être déjà modifié)');
}

// 2. Modifier CardDetailsModal.jsx
const detailsPath = path.join(__dirname, 'src', 'components', 'features', 'collection', 'CardDetailsModal.jsx');
let detailsContent = fs.readFileSync(detailsPath, 'utf8');

const oldDetailsGrades = /                          <SelectContent>\s*\{editData\.gradeCompany === 'PCA' && \(\s*<SelectItem value="10\+">10\+ \(Pristine Plus\)<\/SelectItem>\s*\)\}\s*<SelectItem value="10">10 \(Pristine\/Gem Mint\)<\/SelectItem>\s*<SelectItem value="9\.5">9\.5 \(Gem Mint\)<\/SelectItem>\s*<SelectItem value="9">9 \(Mint\)<\/SelectItem>\s*<SelectItem value="8\.5">8\.5 \(Near Mint\+\)<\/SelectItem>\s*<SelectItem value="8">8 \(Near Mint\)<\/SelectItem>\s*<SelectItem value="7\.5">7\.5 \(Near Mint-\)<\/SelectItem>\s*<SelectItem value="7">7 \(Excellent-Near Mint\)<\/SelectItem>\s*<SelectItem value="6">6 \(Excellent\)<\/SelectItem>\s*<SelectItem value="5">5 \(Very Good-Excellent\)<\/SelectItem>\s*<SelectItem value="4">4 \(Very Good\)<\/SelectItem>\s*<SelectItem value="3">3 \(Good\)<\/SelectItem>\s*<SelectItem value="2">2 \(Good-Fair\)<\/SelectItem>\s*<SelectItem value="1">1 \(Poor\)<\/SelectItem>\s*<\/SelectContent>/;

if (oldDetailsGrades.test(detailsContent)) {
  detailsContent = detailsContent.replace(oldDetailsGrades, createGradeOptionsEdit());
  fs.writeFileSync(detailsPath, detailsContent, 'utf8');
  console.log('✅ CardDetailsModal.jsx : Grades PSA ajoutés');
} else {
  console.log('⚠️  CardDetailsModal.jsx : Pattern non trouvé (peut-être déjà modifié)');
}

console.log('\n✨ Modifications terminées !');
console.log('\nRésumé des systèmes de notation :');
console.log('- PSA : 10, 9, 8.5, 8, 7, 6, 5, 4, 3, 2, 1.5, 1, N0, AA (pas de 9.5)');
console.log('- PCA : 10+, 10, 9.5, 9, 8.5, 8, 7.5, 7, 6, 5, 4, 3, 2, 1');
console.log('- BGS/CGC/SGC : 10, 9.5, 9, 8.5, 8, 7.5, 7, 6, 5, 4, 3, 2, 1');
