// Copier-coller ce code dans la console de l'application (F12)
// Sur la page Doublons ou Ma Collection

console.log('🔍 Analyse des dates White Flare et Black Bolt...\n')

// Attendre un peu que React charge
setTimeout(() => {
  // Essayer de trouver les données React
  const root = document.querySelector('#root')
  if (!root) {
    console.error('❌ Élément #root non trouvé')
    return
  }

  // Chercher les props React
  const reactKey = Object.keys(root).find(key => key.startsWith('__reactContainer'))
  if (!reactKey) {
    console.error('❌ React non trouvé sur #root')
    console.log('💡 Essayez plutôt cette commande :')
    console.log(`
// Si vous êtes dans l'onglet Doublons, tapez :
// (regardez dans la console les logs qui contiennent "White Flare" ou "Black Bolt")
    `)
    return
  }

  console.log('✅ React trouvé, analyse en cours...')
}, 1000)

// Alternative : chercher dans les logs de la console
console.log(`
📋 Instructions alternatives :

1. Restez sur cette page (Doublons ou Ma Collection)
2. Rechargez la page (F5)
3. Cherchez dans les logs de la console les lignes contenant "White Flare" ou "Black Bolt"
4. Regardez les dates affichées dans ces logs

Ou utilisez cette commande si disponible :
window.debugCardInstances("nom d'une carte White Flare")
`)
