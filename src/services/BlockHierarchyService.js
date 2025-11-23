/**
 * Service centralisé pour construire la hiérarchie Blocs → Extensions → Cartes
 * Garantit la cohérence entre tous les composants (Explore, DatabaseManager, etc.)
 */

/**
 * Construit la hiérarchie complète des blocs avec leurs extensions et cartes
 * @param {Array} discoveredCards - Toutes les cartes découvertes
 * @param {Array} seriesDatabase - Toutes les extensions/séries
 * @param {Array} customBlocks - Blocs personnalisés créés par l'utilisateur
 * @param {Array} customExtensions - Extensions déplacées manuellement
 * @returns {Array} Tableau de blocs enrichis avec leurs extensions
 */
export function buildBlocksHierarchy(discoveredCards = [], seriesDatabase = [], customBlocks = [], customExtensions = []) {
  console.log('🔧 BlockHierarchyService - Construction de la hiérarchie...')
  console.log(`📊 Entrées: ${discoveredCards.length} cartes, ${seriesDatabase.length} extensions, ${customBlocks.length} blocs perso, ${customExtensions.length} extensions déplacées`)

  // 1. Compter les cartes par extension
  const cardsPerSet = {}
  discoveredCards.forEach(card => {
    const setId = card.set?.id || 'unknown'
    cardsPerSet[setId] = (cardsPerSet[setId] || 0) + 1
  })

  // 2. Construire une map pour tracker quelles extensions ont été assignées
  const assignedExtensions = new Set()

  // 3. Créer les blocs générés automatiquement à partir des extensions
  const blocksMap = new Map()

  seriesDatabase.forEach(extension => {
    // Vérifier si cette extension a été déplacée manuellement
    const customExtension = customExtensions.find(ext => ext.id === extension.id)
    const blockName = customExtension ? customExtension.series : (extension.series || 'Other')
    // Utiliser le nombre de cartes APRÈS fusion Gallery (depuis seriesDatabase) au lieu de discoveredCards
    const cardsCount = extension.cards?.length || cardsPerSet[extension.id] || 0

    // Créer le bloc s'il n'existe pas
    if (!blocksMap.has(blockName)) {
      blocksMap.set(blockName, {
        id: blockName.replace(/\s+/g, '-').toLowerCase(),
        name: blockName,
        type: 'generated',
        extensions: [],
        totalCards: 0,
        totalExtensions: 0,
        description: `Bloc généré automatiquement pour ${blockName}`,
        startDate: null,
        endDate: null
      })
    }

    // Ajouter l'extension au bloc
    const block = blocksMap.get(blockName)
    block.extensions.push({
      ...extension,
      cardsCount: cardsCount,
      series: blockName, // Bloc final (personnalisé ou original)
      originalSeries: extension.series || 'Other', // Bloc d'origine
      isCustom: !!customExtension // Marqueur de déplacement manuel
    })
    block.totalCards += cardsCount
    block.totalExtensions++

    // Calculer les dates de début et de fin du bloc basées sur les extensions
    if (extension.releaseDate) {
      const releaseDate = new Date(extension.releaseDate)
      if (!block.startDate || releaseDate < new Date(block.startDate)) {
        block.startDate = extension.releaseDate
      }
      if (!block.endDate || releaseDate > new Date(block.endDate)) {
        block.endDate = extension.releaseDate
      }
    }

    // Marquer cette extension comme assignée
    assignedExtensions.add(extension.id)
  })

  // 4. Traiter les blocs personnalisés
  const enrichedCustomBlocks = customBlocks.map(block => {
    // Trouver TOUTES les extensions qui correspondent à ce bloc personnalisé
    const blockExtensions = seriesDatabase
      .filter(ext => {
        // Vérifier si cette extension a été déplacée vers ce bloc
        const customExt = customExtensions.find(ce => ce.id === ext.id)
        if (customExt) {
          return customExt.series === block.name
        }
        // Sinon, vérifier si le nom de série correspond naturellement
        return ext.series === block.name
      })
      .map(ext => {
        const customExt = customExtensions.find(ce => ce.id === ext.id)
        // Utiliser le nombre de cartes APRÈS fusion Gallery (depuis seriesDatabase) au lieu de discoveredCards
        const cardsCount = ext.cards?.length || cardsPerSet[ext.id] || 0

        // Marquer cette extension comme assignée
        assignedExtensions.add(ext.id)

        return {
          ...ext,
          cardsCount: cardsCount,
          series: block.name,
          originalSeries: ext.series || 'Other',
          isCustom: !!customExt
        }
      })

    // Calculer les totaux réels
    const totalCardsFromExtensions = blockExtensions.reduce((sum, ext) => sum + (ext.cardsCount || 0), 0)
    const totalExtensionsCount = blockExtensions.length

    // Calculer les dates de début et de fin basées sur les extensions
    let startDate = block.startDate || null
    let endDate = block.endDate || null

    blockExtensions.forEach(ext => {
      if (ext.releaseDate) {
        const releaseDate = new Date(ext.releaseDate)
        if (!startDate || releaseDate < new Date(startDate)) {
          startDate = ext.releaseDate
        }
        if (!endDate || releaseDate > new Date(endDate)) {
          endDate = ext.releaseDate
        }
      }
    })

    return {
      ...block,
      type: 'custom',
      extensions: blockExtensions,
      totalCards: totalCardsFromExtensions || block.cards_count || 0,
      totalExtensions: totalExtensionsCount || block.series_count || 0,
      startDate: startDate,
      endDate: endDate
    }
  })

  // 5. Combiner les blocs générés et personnalisés
  const generatedBlocks = Array.from(blocksMap.values())
  const allBlocks = [...generatedBlocks, ...enrichedCustomBlocks]

  // 6. Supprimer les doublons : si un bloc personnalisé a le même nom qu'un bloc généré,
  // on garde le bloc personnalisé et on fusionne les extensions
  const uniqueBlocksMap = new Map()

  allBlocks.forEach(block => {
    const existingBlock = uniqueBlocksMap.get(block.name)

    if (existingBlock) {
      // Fusionner les extensions sans doublons
      const existingExtensionIds = new Set(existingBlock.extensions.map(ext => ext.id))
      const newExtensions = block.extensions.filter(ext => !existingExtensionIds.has(ext.id))

      existingBlock.extensions.push(...newExtensions)
      existingBlock.totalCards += block.totalCards
      existingBlock.totalExtensions = existingBlock.extensions.length

      console.log(`🔀 Fusion du bloc "${block.name}": ${newExtensions.length} nouvelles extensions ajoutées`)
    } else {
      uniqueBlocksMap.set(block.name, block)
    }
  })

  const finalBlocks = Array.from(uniqueBlocksMap.values())

  // 7. Trier les blocs du plus récent au plus ancien (par date de fin)
  finalBlocks.sort((a, b) => {
    // Les blocs sans date vont à la fin
    if (!a.endDate && !b.endDate) return 0
    if (!a.endDate) return 1
    if (!b.endDate) return -1

    // Comparer les dates de fin (plus récent en premier)
    const dateA = new Date(a.endDate)
    const dateB = new Date(b.endDate)
    return dateB - dateA // Tri décroissant (plus récent en premier)
  })

  // 8. Trier les extensions à l'intérieur de chaque bloc (plus récentes en premier)
  finalBlocks.forEach(block => {
    if (block.extensions && block.extensions.length > 0) {
      block.extensions.sort((a, b) => {
        // Les extensions sans date vont à la fin
        if (!a.releaseDate && !b.releaseDate) return 0
        if (!a.releaseDate) return 1
        if (!b.releaseDate) return -1

        // Comparer les dates de sortie (plus récent en premier)
        const dateA = new Date(a.releaseDate)
        const dateB = new Date(b.releaseDate)
        return dateB - dateA // Tri décroissant (plus récent en premier)
      })
    }
  })

  // 9. Logs de résumé
  console.log('✅ BlockHierarchyService - Hiérarchie construite:')
  console.log(`📦 ${finalBlocks.length} blocs uniques (triés du plus récent au plus ancien)`)

  return finalBlocks
}

/**
 * Transforme les blocs pour l'affichage dans DatabaseManager
 * @param {Array} blocks - Blocs construits par buildBlocksHierarchy
 * @returns {Object} { blocks, sets, cards } pour DatabaseManager
 */
export function transformBlocksForDatabaseManager(blocks, discoveredCards) {
  // Transformer les blocs pour l'affichage
  const transformedBlocks = blocks.map((block, index) => ({
    id: block.id,
    name: block.name,
    type: block.type,
    sets_count: block.totalExtensions,
    cards_count: block.totalCards,
    sets: block.extensions || [],
    order: index + 1
  }))

  // Extraire toutes les extensions
  const allExtensions = []
  blocks.forEach(block => {
    if (block.extensions) {
      block.extensions.forEach(ext => {
        allExtensions.push({
          id: ext.id,
          name: ext.name,
          block_id: block.id,
          cards_count: ext.cardsCount || 0,
          release_date: ext.releaseDate || '',
          order: allExtensions.length + 1,
          isCustom: ext.isCustom || false,
          originalSeries: ext.originalSeries || ext.series
        })
      })
    }
  })

  // Transformer les cartes
  const transformedCards = (discoveredCards || []).map((card, index) => ({
    id: card.id,
    name: card.name,
    set_id: card.set?.id || '',
    number: card.number || '',
    type: card.supertype || card.types?.[0] || 'Pokémon',
    rarity: card.rarity || 'Common',
    order: index + 1
  }))

  return {
    blocks: transformedBlocks,
    sets: allExtensions,
    cards: transformedCards
  }
}