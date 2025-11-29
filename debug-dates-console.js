// Script à exécuter dans la console de l'application (F12)
// Copier-coller tout ce code dans la console navigateur

(async () => {
  console.log('🔍 Début du diagnostic des dates...')

  // Récupérer le client Supabase de l'application
  const supabase = window.supabaseClient
  if (!supabase) {
    console.error('❌ Supabase client non trouvé. Assurez-vous d\'être sur l\'application.')
    return
  }

  // Vérifier l'utilisateur connecté
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.error('❌ Utilisateur non connecté')
    return
  }

  console.log('✅ Utilisateur:', user.email)

  // Récupérer toutes les cartes de l'utilisateur
  const { data: userCards, error } = await supabase
    .from('user_collection')
    .select('*')
    .eq('user_id', user.id)
    .limit(10000)

  if (error) {
    console.error('❌ Erreur:', error.message)
    return
  }

  console.log(`📦 Total cartes récupérées: ${userCards.length}`)

  // Filtrer les cartes cibles
  const targetCards = userCards.filter(card => {
    const ext = card.extension || ''
    const setId = (card.set && typeof card.set === 'object') ? card.set.id : ''
    const setName = (card.set && typeof card.set === 'object') ? card.set.name : ''

    return (
      setId === 'sv8' || setId === 'sv8a' || setId === 'sv9' ||
      ext === 'sv8' || ext === 'sv8a' || ext === 'sv9' ||
      setName.includes('White Flare') ||
      setName.includes('Black Bolt') ||
      setName.includes('Mega Evolution') ||
      setName.includes('Journey Together')
    )
  })

  console.log(`🎴 Cartes White Flare, Black Bolt, Mega Evolution, Journey Together: ${targetCards.length}`)

  // Grouper par extension
  const byExtension = {}
  targetCards.forEach(card => {
    const setId = (card.set && typeof card.set === 'object') ? card.set.id : card.extension
    const setName = (card.set && typeof card.set === 'object') ? card.set.name : card.extension
    const releaseDate = (card.set && typeof card.set === 'object') ? card.set.releaseDate : null
    const series = (card.set && typeof card.set === 'object') ? card.set.series : card.series

    const key = setId || setName || 'Unknown'

    if (!byExtension[key]) {
      byExtension[key] = {
        setId,
        setName,
        series,
        releaseDates: {},
        cards: []
      }
    }

    byExtension[key].cards.push(card)

    if (releaseDate) {
      if (!byExtension[key].releaseDates[releaseDate]) {
        byExtension[key].releaseDates[releaseDate] = 0
      }
      byExtension[key].releaseDates[releaseDate]++
    }
  })

  // Afficher le rapport
  console.log('\n' + '='.repeat(80))
  console.log('📊 RAPPORT DES DATES PAR EXTENSION')
  console.log('='.repeat(80))

  Object.entries(byExtension).forEach(([extKey, extData]) => {
    console.log('\n' + '-'.repeat(80))
    console.log(`🎴 Extension: ${extData.setName || extKey}`)
    console.log(`   Set ID: ${extData.setId || 'N/A'}`)
    console.log(`   Série/Bloc: ${extData.series || 'N/A'}`)
    console.log(`   Nombre de cartes: ${extData.cards.length}`)

    const dates = Object.entries(extData.releaseDates).sort((a, b) => b[1] - a[1])
    const cardsWithoutDate = extData.cards.filter(c => !c.set?.releaseDate).length

    console.log(`   Cartes SANS date: ${cardsWithoutDate}`)

    if (dates.length > 0) {
      console.log('   Dates trouvées:')
      dates.forEach(([date, count]) => {
        const percent = ((count / extData.cards.length) * 100).toFixed(1)
        const formatted = new Date(date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
        console.log(`      ${formatted} → ${count} cartes (${percent}%)`)

        if (dates.length > 1) {
          console.warn(`      ⚠️ ATTENTION: Plusieurs dates pour cette extension !`)
        }
      })
    } else {
      console.warn('   ⚠️ Aucune date trouvée')
    }

    // Afficher quelques exemples de cartes
    console.log('   Exemples de cartes (5 premières):')
    extData.cards.slice(0, 5).forEach((card, idx) => {
      const releaseDate = card.set?.releaseDate
      const formatted = releaseDate ? new Date(releaseDate).toLocaleDateString('fr-FR') : 'SANS DATE'
      console.log(`      ${idx + 1}. ${card.name} #${card.number || 'N/A'} - ${formatted}`)
    })
  })

  console.log('\n' + '='.repeat(80))
  console.log('✅ Diagnostic terminé')
  console.log('='.repeat(80))

  // Créer un tableau récapitulatif
  const summary = Object.entries(byExtension).map(([extKey, extData]) => {
    const dates = Object.keys(extData.releaseDates)
    const mainDate = dates.length > 0 ? Object.entries(extData.releaseDates).sort((a, b) => b[1] - a[1])[0][0] : null
    return {
      'Extension': extData.setName || extKey,
      'Set ID': extData.setId || 'N/A',
      'Bloc': extData.series || 'N/A',
      'Cartes': extData.cards.length,
      'Date principale': mainDate ? new Date(mainDate).toLocaleDateString('fr-FR') : 'AUCUNE',
      'Dates différentes': dates.length,
      'Sans date': extData.cards.filter(c => !c.set?.releaseDate).length
    }
  })

  console.table(summary)

})()
