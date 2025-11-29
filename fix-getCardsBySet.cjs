const fs = require('fs');

const filePath = './src/hooks/useCardDatabase.jsx';
let content = fs.readFileSync(filePath, 'utf8');

const oldCode = `  const getCardsBySet = async (setId) => {
    // Chercher dans le cache local avec multiples critères
    const localCards = discoveredCards.filter(card => {
      // Recherche directe par ID
      if (card.setId === setId || card.set_id === setId || card.set?.id === setId) {
        return true
      }

      // Recherche par nom de série/bloc
      if (card.set?.name === setId || card.set?.series === setId) {
        return true
      }

      // Recherche pour les cartes avec ID généré (unknown-)
      if (setId.startsWith('unknown-') && (!card.set?.id || !card.set?.name)) {
        return true
      }

      return false
    })

    console.log(\`🗂️ \${localCards.length} cartes trouvées en local pour le set \${setId}\`)`;

const newCode = `  const getCardsBySet = async (setId) => {
    console.log(\`🔍 getCardsBySet appelé pour: \${setId}\`)

    // PRIORITÉ 1 : Chercher dans seriesDatabase (contient les cartes APRÈS fusion Gallery)
    const extension = seriesDatabase.find(ext => ext.id === setId)

    if (extension && extension.cards && extension.cards.length > 0) {
      console.log(\`✅ \${extension.cards.length} cartes trouvées dans seriesDatabase pour \${setId} (APRÈS fusion Gallery)\`)
      return extension.cards
    }

    // PRIORITÉ 2 (fallback) : Chercher dans discoveredCards brut
    const localCards = discoveredCards.filter(card => {
      // Recherche directe par ID
      if (card.setId === setId || card.set_id === setId || card.set?.id === setId) {
        return true
      }

      // Recherche par nom de série/bloc
      if (card.set?.name === setId || card.set?.series === setId) {
        return true
      }

      // Recherche pour les cartes avec ID généré (unknown-)
      if (setId.startsWith('unknown-') && (!card.set?.id || !card.set?.name)) {
        return true
      }

      return false
    })

    console.log(\`🗂️ \${localCards.length} cartes trouvées en local (discoveredCards brut) pour le set \${setId}\`)`;

content = content.replace(oldCode, newCode);

fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ getCardsBySet corrigé avec succès !');
console.log('📝 Maintenant les cartes fusionnées (GG/TG) seront affichées correctement.');
