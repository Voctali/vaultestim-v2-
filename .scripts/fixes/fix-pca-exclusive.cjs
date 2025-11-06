const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'features', 'collection', 'CardDetailsModal.jsx');

console.log('📝 Lecture du fichier CardDetailsModal.jsx...');
let content = fs.readFileSync(filePath, 'utf8');

// Remplacement : ajouter condition pour 10+ exclusif à PCA
const oldCode = `                          <SelectContent>
                            <SelectItem value="10+">10+ (Pristine Plus)</SelectItem>
                            <SelectItem value="10">10 (Pristine/Gem Mint)</SelectItem>`;

const newCode = `                          <SelectContent>
                            {editData.gradeCompany === 'PCA' && (
                              <SelectItem value="10+">10+ (Pristine Plus)</SelectItem>
                            )}
                            <SelectItem value="10">10 (Pristine/Gem Mint)</SelectItem>`;

if (content.includes(oldCode)) {
  content = content.replace(oldCode, newCode);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Fix appliqué : 10+ maintenant exclusif à PCA');
  console.log('   Ligne 486-488 : Ajout condition {editData.gradeCompany === "PCA" && ...}');
} else {
  console.log('⚠️  Code original non trouvé (peut-être déjà modifié)');
}
