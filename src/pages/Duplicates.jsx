import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCollection } from '@/hooks/useCollection.jsx'
import { CardImage } from '@/components/features/explore/CardImage'
import { SaleModal } from '@/components/features/collection/SaleModal'
import { BatchSaleModal } from '@/components/features/collection/BatchSaleModal'
import { DuplicateDetailModal } from '@/components/features/collection/DuplicateDetailModal'
import { CollectionTabs } from '@/components/features/navigation/CollectionTabs'
import { CardVersionBadges } from '@/components/features/collection/CardVersionBadges'
import { translateCondition } from '@/utils/cardConditions'
import { translatePokemonName } from '@/utils/pokemonTranslations'
import { translateTrainerName } from '@/utils/trainerTranslations'
import { translateCardName } from '@/utils/cardTranslations'
import {
  Copy,
  Search,
  Filter,
  Plus,
  Package,
  Trash2,
  Edit3,
  ShoppingBag,
  Calculator,
  Euro,
  AlertCircle
} from 'lucide-react'

export function Duplicates() {
  const { duplicates, duplicateBatches, createDuplicateBatch, updateDuplicateBatch, deleteDuplicateBatch, createSale, collection } = useCollection()

  // 🔍 Fonction de debug pour vérifier les doublons d'une carte - disponible globalement
  useEffect(() => {
    window.debugCardInstances = (cardName) => {
      console.log(`🔎 [DEBUG] Recherche de toutes les instances de "${cardName}" dans la collection complète`)
      const instances = collection.filter(card => card.name.toLowerCase().includes(cardName.toLowerCase()))
      console.log(`📦 [DEBUG] ${instances.length} instance(s) trouvée(s):`)
      instances.forEach((card, idx) => {
        console.log(`  ${idx + 1}. ID: ${card.id}`)
        console.log(`     Nom: ${card.name}`)
        console.log(`     Version: ${card.version || 'Normale'}`)
        console.log(`     Quantité: ${card.quantity || 1}`)
        console.log(`     Extension: ${card.extension || card.series}`)
        console.log(`     Condition: ${card.condition}`)
        console.log(`     card_id (API): ${card.card_id || 'N/A'}`)
        console.log(`  ---`)
      })
      return instances
    }
    console.log('🔧 [DEBUG] Fonction window.debugCardInstances() disponible. Utilisez: window.debugCardInstances("nom de carte")')

    return () => {
      delete window.debugCardInstances
    }
  }, [collection])

  const [currentTab, setCurrentTab] = useState('duplicates') // 'duplicates' ou 'batches'
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateBatchModal, setShowCreateBatchModal] = useState(false)
  const [editingBatch, setEditingBatch] = useState(null)
  const [selectedCards, setSelectedCards] = useState([])
  const [cardQuantities, setCardQuantities] = useState({}) // Pour stocker les quantités par carte
  const [batchName, setBatchName] = useState('')
  const [showSaleModal, setShowSaleModal] = useState(false)
  const [showBatchSaleModal, setShowBatchSaleModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [cardToSell, setCardToSell] = useState(null)
  const [batchToSell, setBatchToSell] = useState(null)
  const [selectedCardForDetail, setSelectedCardForDetail] = useState(null)
  const [extensionSearchTerms, setExtensionSearchTerms] = useState({}) // Recherche par numéro pour chaque extension
  const [modalSearchTerm, setModalSearchTerm] = useState('') // Recherche dans la modale d'édition
  const [viewingBatch, setViewingBatch] = useState(null) // Lot en cours de visualisation détaillée
  const [showBatchDetailModal, setShowBatchDetailModal] = useState(false)
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false)
  const [pendingBatchAdd, setPendingBatchAdd] = useState(null) // { batchId, duplicateCards: [...] }

  // Filtrer les doublons selon la recherche (duplicates vient du Context et est déjà mémorisé)
  const duplicateCards = duplicates.filter(card => {
    if (!searchTerm.trim()) return true

    // Recherche bilingue : français et anglais
    const searchLower = searchTerm.toLowerCase().trim()
    const cardNameLower = card.name.toLowerCase()

    // Recherche directe dans le nom anglais de la carte
    const matchesEnglish = (
      cardNameLower === searchLower ||
      cardNameLower.startsWith(searchLower + ' ') ||
      cardNameLower.includes(' ' + searchLower + ' ') ||
      cardNameLower.endsWith(' ' + searchLower)
    )

    // Si l'utilisateur recherche en français, traduire vers l'anglais
    let translatedSearch = translatePokemonName(searchLower)
    if (translatedSearch === searchLower) {
      translatedSearch = translateTrainerName(searchLower)
    }
    // Recherche par mot complet pour éviter faux positifs (ex: "eri" ne doit PAS matcher "Erika")
    const matchesTranslated = translatedSearch !== searchLower && (
      cardNameLower === translatedSearch || // Exact match
      cardNameLower.startsWith(translatedSearch + ' ') || // "eri " au début
      cardNameLower.includes(' ' + translatedSearch + ' ') || // " eri " au milieu
      cardNameLower.endsWith(' ' + translatedSearch) // " eri" à la fin
    )

    return matchesEnglish || matchesTranslated
  })

  // Fonction pour extraire le préfixe d'extension depuis card_id (source de vérité)
  const getExtensionFromCardId = (cardId) => {
    if (!cardId) return null
    // Exemples: me1-96, sv3pt5-34, swsh1-123, svp-203
    const match = cardId.match(/^([a-z]+\d*(?:pt\d+)?)/i)
    return match ? match[1].toLowerCase() : null
  }

  // Fonction pour obtenir le bloc depuis le préfixe d'extension
  const getBlockFromExtensionPrefix = (prefix) => {
    if (!prefix) return 'Sans bloc'
    if (prefix.startsWith('me') || prefix === 'mep') return 'Mega Evolution'
    if (prefix.startsWith('sv') || prefix.startsWith('zsv')) return 'Scarlet & Violet'
    if (prefix.startsWith('swsh')) return 'Sword & Shield'
    if (prefix.startsWith('sm')) return 'Sun & Moon'
    if (prefix.startsWith('xy')) return 'XY'
    if (prefix.startsWith('bw')) return 'Black & White'
    return 'Autres'
  }

  // Fonction pour filtrer les cartes d'une extension par numéro
  const filterCardsByNumber = (cards, extensionKey) => {
    const searchTerm = extensionSearchTerms[extensionKey]
    if (!searchTerm || !searchTerm.trim()) return cards

    const term = searchTerm.trim()
    return cards.filter(card => {
      if (!card.number) return false
      return card.number.includes(term)
    })
  }

  // Grouper ET consolider les doublons en un seul useMemo
  const consolidatedDuplicates = useMemo(() => {
    if (!duplicateCards || duplicateCards.length === 0) {
      return []
    }

    // ÉTAPE 1: Consolider d'abord par card_id + version
    const consolidationMap = {}
    duplicateCards.forEach(card => {
      const version = (card.version && String(card.version).trim()) ? String(card.version).trim() : 'Normale'
      const cardId = card.card_id || card.id
      const key = `${cardId}-${version}`

      if (!consolidationMap[key]) {
        consolidationMap[key] = {
          instances: [],
          totalQuantity: 0
        }
      }
      consolidationMap[key].instances.push(card)
      consolidationMap[key].totalQuantity += (card.quantity || 1)
    })

    // Créer les cartes consolidées
    const conditionOrder = {
      'Neuf': 5, 'Proche du neuf': 4, 'Excellent': 3,
      'Bon': 2, 'Acceptable': 1, 'Endommagé': 0
    }

    const consolidatedCards = Object.values(consolidationMap).map(group => {
      const bestCard = group.instances.reduce((best, current) => {
        const bestScore = conditionOrder[best.condition] || 0
        const currentScore = conditionOrder[current.condition] || 0
        return currentScore > bestScore ? current : best
      }, group.instances[0])

      return {
        ...bestCard,
        consolidatedQuantity: group.totalQuantity,
        instanceIds: group.instances.map(c => c.id)
      }
    })

    // ÉTAPE 2: Grouper par bloc et extension
    const cardsByBlock = consolidatedCards.reduce((acc, card) => {
      const extensionPrefix = getExtensionFromCardId(card.card_id)
      let blockName = card.set?.series || card.series || 'Sans bloc'
      if (extensionPrefix) {
        blockName = getBlockFromExtensionPrefix(extensionPrefix)
      }

      if (!acc[blockName]) {
        acc[blockName] = { name: blockName, extensions: {} }
      }

      const extensionKey = extensionPrefix || card.set?.id || card.extension || 'Sans extension'
      const extensionName = card.set?.name || card.extension || extensionKey
      const releaseDate = card.set?.releaseDate || null

      if (!acc[blockName].extensions[extensionKey]) {
        acc[blockName].extensions[extensionKey] = {
          name: extensionName,
          releaseDate: releaseDate,
          cards: []
        }
      }

      acc[blockName].extensions[extensionKey].cards.push(card)
      return acc
    }, {})

    // ÉTAPE 3: Trier les cartes par numéro
    Object.values(cardsByBlock).forEach(block => {
      Object.values(block.extensions).forEach(ext => {
        ext.cards.sort((a, b) => {
          const getNum = (c) => {
            if (c.number) return c.number
            const match = c.card_id?.match(/-(\d+)$/)
            return match ? match[1] : ''
          }
          const numA = parseInt(getNum(a)) || 0
          const numB = parseInt(getNum(b)) || 0
          return numA - numB
        })
      })
    })

    // ÉTAPE 4: Convertir en tableau trié
    const blockGroups = Object.entries(cardsByBlock).map(([, blockData]) => {
      const sortedExtensions = Object.values(blockData.extensions).sort((a, b) => {
        const dateA = a.releaseDate ? new Date(a.releaseDate) : new Date()
        const dateB = b.releaseDate ? new Date(b.releaseDate) : new Date()
        return dateB - dateA
      })

      return {
        name: blockData.name,
        mostRecentDate: sortedExtensions[0]?.releaseDate || null,
        extensions: sortedExtensions
      }
    }).sort((a, b) => {
      const dateA = a.mostRecentDate ? new Date(a.mostRecentDate) : new Date()
      const dateB = b.mostRecentDate ? new Date(b.mostRecentDate) : new Date()
      return dateB - dateA
    })

    return blockGroups
  }, [duplicateCards])

  // Calculer la valeur totale d'un lot
  const calculateBatchValue = (cards) => {
    return cards.reduce((total, card) => {
      const price = parseFloat(card.marketPrice || card.value || 0)
      const quantity = cardQuantities[card.id] || card.batchQuantity || 1
      return total + (price * quantity)
    }, 0).toFixed(2)
  }

  const handleCreateBatch = () => {
    if (!batchName.trim() || selectedCards.length === 0) {
      alert('Veuillez saisir un nom et sélectionner des cartes')
      return
    }

    // Créer une copie des cartes avec les quantités spécifiées
    const cardsWithQuantities = selectedCards.map(card => ({
      ...card,
      batchQuantity: cardQuantities[card.id] || 1 // Utiliser la quantité spécifiée ou 1 par défaut
    }))

    const newBatch = {
      id: Date.now().toString(),
      name: batchName.trim(),
      cards: cardsWithQuantities,
      createdAt: new Date().toISOString(),
      totalValue: calculateBatchValue(cardsWithQuantities)
    }

    createDuplicateBatch(newBatch)

    // Reset
    setBatchName('')
    setSelectedCards([])
    setCardQuantities({})
    setShowCreateBatchModal(false)
  }

  const handleEditBatch = (batch) => {
    setEditingBatch(batch)
    setBatchName(batch.name)
    setSelectedCards([...batch.cards])

    // Restaurer les quantités des cartes
    const quantities = {}
    batch.cards.forEach(card => {
      quantities[card.id] = card.batchQuantity || 1
    })
    setCardQuantities(quantities)

    setShowCreateBatchModal(true)
  }

  const handleUpdateBatch = () => {
    if (!batchName.trim() || selectedCards.length === 0) {
      alert('Veuillez saisir un nom et sélectionner des cartes')
      return
    }

    // Créer une copie des cartes avec les quantités spécifiées
    const cardsWithQuantities = selectedCards.map(card => ({
      ...card,
      batchQuantity: cardQuantities[card.id] || 1
    }))

    const updatedBatch = {
      ...editingBatch,
      name: batchName.trim(),
      cards: cardsWithQuantities,
      totalValue: calculateBatchValue(cardsWithQuantities)
    }

    updateDuplicateBatch(updatedBatch)

    // Reset
    setBatchName('')
    setSelectedCards([])
    setCardQuantities({})
    setShowCreateBatchModal(false)
    setEditingBatch(null)
  }

  const handleDeleteBatch = (batchId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce lot ?')) {
      deleteDuplicateBatch(batchId)
    }
  }

  const toggleCardSelection = (card) => {
    console.log('📦📦📦 [LOT-DEBUG] Carte cliquée:', card.name, 'ID:', card.id)
    setSelectedCards(prev => {
      const exists = prev.find(c => c.id === card.id)
      if (exists) {
        console.log('📦📦📦 [LOT-DEBUG] Carte DÉSÉLECTIONNÉE')
        // Retirer la carte et supprimer sa quantité
        setCardQuantities(prevQty => {
          const newQty = { ...prevQty }
          delete newQty[card.id]
          return newQty
        })
        return prev.filter(c => c.id !== card.id)
      } else {
        console.log('📦📦📦 [LOT-DEBUG] Carte SÉLECTIONNÉE')
        // Ajouter la carte et initialiser sa quantité à 1
        setCardQuantities(prevQty => ({
          ...prevQty,
          [card.id]: 1
        }))
        return [...prev, card]
      }
    })
  }

  const updateCardQuantity = (cardId, quantity, maxQuantity) => {
    const parsedQty = parseInt(quantity) || 1
    const validQty = Math.max(1, Math.min(parsedQty, maxQuantity))
    setCardQuantities(prev => ({
      ...prev,
      [cardId]: validQty
    }))
  }

  const handleSellCard = (card) => {
    setCardToSell(card)
    setShowSaleModal(true)
  }

  const handleCardClick = (card) => {
    setSelectedCardForDetail(card)
    setShowDetailModal(true)
  }

  const handleCloseDetailModal = () => {
    setShowDetailModal(false)
    setSelectedCardForDetail(null)
  }

  const handleSellBatch = (batch) => {
    setBatchToSell(batch)
    setShowBatchSaleModal(true)
  }

  const handleSaleSubmit = (saleData) => {
    createSale(saleData)
    setShowSaleModal(false)
    setShowBatchSaleModal(false)
    setCardToSell(null)
    setBatchToSell(null)
    alert('Vente enregistrée avec succès !')
  }

  // Grouper et trier les cartes pour la modale d'édition par extension
  const groupedModalCards = useMemo(() => {
    // Grouper par bloc puis par extension - utiliser card_id comme source de vérité
    const groups = {}

    duplicateCards.forEach(card => {
      // Extraire le préfixe d'extension depuis card_id (source de vérité)
      const extensionPrefix = getExtensionFromCardId(card.card_id)

      // Déterminer le bloc : priorité au card_id, sinon fallback sur set.series
      let blockName = card.set?.series || card.series || 'Sans bloc'
      if (extensionPrefix) {
        blockName = getBlockFromExtensionPrefix(extensionPrefix)
      }

      const extensionKey = extensionPrefix || card.set?.id || card.extension || 'Sans extension'
      const extensionName = card.set?.name || card.extension || extensionKey
      const releaseDate = card.set?.releaseDate || null

      if (!groups[blockName]) {
        groups[blockName] = {
          blockName,
          extensions: {}
        }
      }

      if (!groups[blockName].extensions[extensionKey]) {
        groups[blockName].extensions[extensionKey] = {
          key: extensionKey,
          name: extensionName,
          releaseDate,
          cards: []
        }
      }

      groups[blockName].extensions[extensionKey].cards.push(card)
    })

    // Trier les cartes par numéro dans chaque extension
    Object.values(groups).forEach(block => {
      Object.values(block.extensions).forEach(ext => {
        ext.cards.sort((a, b) => {
          // Extraire le numéro depuis card_id si number est manquant
          const getNumber = (card) => {
            if (card.number) return card.number
            const match = card.card_id?.match(/-(\d+)$/)
            return match ? match[1] : ''
          }

          const numA = getNumber(a)
          const numB = getNumber(b)
          const matchA = numA.match(/^(\d+)/)
          const matchB = numB.match(/^(\d+)/)

          if (matchA && matchB) {
            const intA = parseInt(matchA[1])
            const intB = parseInt(matchB[1])
            if (intA !== intB) return intA - intB
            return numA.localeCompare(numB)
          }
          if (matchA && !matchB) return -1
          if (!matchA && matchB) return 1
          return numA.localeCompare(numB)
        })
      })
    })

    // Convertir en tableau et trier
    return Object.values(groups).map(block => ({
      blockName: block.blockName,
      extensions: Object.values(block.extensions).sort((a, b) => {
        const dateA = a.releaseDate ? new Date(a.releaseDate) : new Date(0)
        const dateB = b.releaseDate ? new Date(b.releaseDate) : new Date(0)
        return dateB - dateA // Plus récent en premier
      })
    })).sort((a, b) => {
      // Trier les blocs par date de la dernière extension
      const dateA = a.extensions[0]?.releaseDate ? new Date(a.extensions[0].releaseDate) : new Date(0)
      const dateB = b.extensions[0]?.releaseDate ? new Date(b.extensions[0].releaseDate) : new Date(0)
      return dateB - dateA
    })
  }, [duplicateCards])

  // Filtrer les cartes d'une extension par numéro dans la modale
  const filterModalCardsByNumber = (cards, extensionKey) => {
    const searchTerm = extensionSearchTerms[`modal-${extensionKey}`]
    if (!searchTerm || !searchTerm.trim()) return cards

    const term = searchTerm.trim()
    return cards.filter(card => {
      if (!card.number) return false
      return card.number.includes(term)
    })
  }

  // Fonction pour ajouter les cartes sélectionnées à un lot existant
  const handleAddToBatch = (batchId) => {
    console.log('📦📦📦 [LOT-DEBUG] ========== FONCTION APPELÉE ==========')
    console.log('📦📦📦 [LOT-DEBUG] batchId reçu:', batchId)
    console.log('📦📦📦 [LOT-DEBUG] Nombre de cartes sélectionnées:', selectedCards.length)
    console.log('📦📦📦 [LOT-DEBUG] Cartes:', selectedCards)

    if (selectedCards.length === 0) {
      console.log('📦📦📦 [LOT-DEBUG] ❌ ERREUR: Aucune carte sélectionnée')
      alert('Veuillez sélectionner au moins une carte')
      return
    }

    const batch = duplicateBatches.find(b => b.id === batchId)
    if (!batch) {
      console.log('📦📦📦 [LOT-DEBUG] ❌ ERREUR: Lot non trouvé')
      return
    }

    console.log('📦📦📦 [LOT-DEBUG] ✅ Lot trouvé:', batch.name)
    console.log('📦📦📦 [LOT-DEBUG] ✅ Traitement de', selectedCards.length, 'carte(s)')

    // Créer une copie des cartes avec les quantités spécifiées
    const cardsWithQuantities = selectedCards.map(card => {
      const quantity = cardQuantities[card.id] || 1
      console.log(`🎯 [AddToBatch] Carte: ${card.name} (ID: ${card.id}, card_id: ${card.card_id}, instanceIds: ${card.instanceIds?.length || 0})`)
      console.log(`🎯 [AddToBatch] Quantité sélectionnée: ${quantity}`)
      return {
        ...card,
        batchQuantity: quantity
      }
    })

    // Vérifier si des cartes identiques existent déjà (même nom, version, numéro, extension)
    const duplicateCards = []
    const newCards = []

    console.log(`🔍 [AddToBatch] Lot actuel contient ${batch.cards.length} cartes:`)
    batch.cards.forEach(c => {
      console.log(`   - ${c.name} | Version: ${c.version || 'Normale'} | #${c.number} | Extension: ${c.set?.id || c.extension || 'N/A'}`)
    })

    cardsWithQuantities.forEach(card => {
      const cardIdentity = {
        name: card.name,
        version: card.version || 'Normale',
        number: card.number,
        extension: card.set?.id || card.extension
      }

      console.log(`🔍 [AddToBatch] Vérification carte sélectionnée:`)
      console.log(`   Nom: ${cardIdentity.name}`)
      console.log(`   Version: ${cardIdentity.version}`)
      console.log(`   Numéro: ${cardIdentity.number}`)
      console.log(`   Extension: ${cardIdentity.extension}`)

      // Chercher une carte identique dans le lot
      const existingCard = batch.cards.find(c => {
        const existingIdentity = {
          name: c.name,
          version: c.version || 'Normale',
          number: c.number,
          extension: c.set?.id || c.extension
        }

        const nameMatch = existingIdentity.name === cardIdentity.name
        const versionMatch = existingIdentity.version === cardIdentity.version
        const numberMatch = existingIdentity.number === cardIdentity.number
        const extensionMatch = existingIdentity.extension === cardIdentity.extension

        console.log(`   🔎 Comparaison avec "${c.name}":`)
        console.log(`      Nom: ${nameMatch} (${existingIdentity.name} === ${cardIdentity.name})`)
        console.log(`      Version: ${versionMatch} (${existingIdentity.version} === ${cardIdentity.version})`)
        console.log(`      Numéro: ${numberMatch} (${existingIdentity.number} === ${cardIdentity.number})`)
        console.log(`      Extension: ${extensionMatch} (${existingIdentity.extension} === ${cardIdentity.extension})`)

        return nameMatch && versionMatch && numberMatch && extensionMatch
      })

      if (existingCard) {
        console.log(`⚠️ [AddToBatch] Carte identique trouvée dans le lot: ${card.name} ${cardIdentity.version} #${cardIdentity.number}`)
        duplicateCards.push({ card, existingCard })
      } else {
        console.log(`✅ [AddToBatch] Nouvelle carte: ${card.name} ${cardIdentity.version} #${cardIdentity.number}`)
        newCards.push(card)
      }
    })

    console.log(`📊 [AddToBatch] Résultat: ${newCards.length} nouvelles cartes, ${duplicateCards.length} doublons`)

    // Si des cartes identiques sont détectées, afficher l'avertissement
    if (duplicateCards.length > 0) {
      console.log(`⚠️ [AddToBatch] ${duplicateCards.length} carte(s) identique(s) détectée(s), affichage avertissement`)
      setPendingBatchAdd({
        batchId,
        batch,
        duplicateCards,
        newCards
      })
      setShowDuplicateWarning(true)
      return
    }

    // Sinon, ajouter directement les nouvelles cartes
    if (newCards.length > 0) {
      performBatchAdd(batch, newCards)
    } else {
      alert('Aucune nouvelle carte à ajouter')
    }
  }

  // Fonction pour effectuer l'ajout au lot (appelée après confirmation ou directement)
  const performBatchAdd = (batch, cardsToAdd) => {
    const updatedBatch = {
      ...batch,
      cards: [...batch.cards, ...cardsToAdd],
      totalValue: calculateBatchValue([...batch.cards, ...cardsToAdd])
    }

    updateDuplicateBatch(updatedBatch)

    console.log(`✅ [AddToBatch] ${cardsToAdd.length} carte(s) ajoutée(s) au lot "${batch.name}"`)

    // Reset sélection
    setSelectedCards([])
    setCardQuantities({})
    alert(`${cardsToAdd.length} carte(s) ajoutée(s) au lot "${batch.name}"`)
  }

  // Confirmer l'ajout malgré les doublons
  const handleConfirmDuplicateAdd = () => {
    if (!pendingBatchAdd) return

    const { batch, duplicateCards, newCards } = pendingBatchAdd

    // Ajouter TOUTES les cartes (nouvelles + doublons)
    const allCardsToAdd = [...newCards, ...duplicateCards.map(d => d.card)]

    performBatchAdd(batch, allCardsToAdd)

    // Reset
    setPendingBatchAdd(null)
    setShowDuplicateWarning(false)
  }

  // Annuler l'ajout
  const handleCancelDuplicateAdd = () => {
    if (!pendingBatchAdd) return

    const { batch, newCards } = pendingBatchAdd

    // Ajouter uniquement les nouvelles cartes (sans les doublons)
    if (newCards.length > 0) {
      performBatchAdd(batch, newCards)
    } else {
      // Reset sélection sans rien ajouter
      setSelectedCards([])
      setCardQuantities({})
    }

    // Reset
    setPendingBatchAdd(null)
    setShowDuplicateWarning(false)
  }

  // Fonction pour ouvrir la vue détaillée d'un lot
  const handleViewBatch = (batch) => {
    setViewingBatch(batch)
    setShowBatchDetailModal(true)
  }

  // Fonction pour fermer la vue détaillée
  const handleCloseBatchDetail = () => {
    setShowBatchDetailModal(false)
    setViewingBatch(null)
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold golden-glow mb-2 flex items-center">
            <Copy className="w-8 h-8 mr-3" />
            Gestion des Doublons
          </h1>
          <p className="text-muted-foreground hidden lg:block">
            Gérez vos cartes en double et créez des lots pour la vente
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden lg:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une carte..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64 golden-border"
              style={{ textTransform: 'none' }}
            />
          </div>
          <Button variant="outline" className="border-primary/20 hidden lg:flex">
            <Filter className="w-4 h-4 mr-2" />
            Filtres
          </Button>
        </div>
      </div>

      {/* Collection Tabs - Mobile uniquement */}
      <CollectionTabs />

      {/* Search Mobile */}
      <div className="lg:hidden relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher une carte..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 golden-border"
          style={{ textTransform: 'none' }}
        />
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-border">
        <button
          onClick={() => setCurrentTab('duplicates')}
          className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
            currentTab === 'duplicates'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Copy className="w-4 h-4 inline mr-2" />
          Doublons ({duplicateCards.length})
        </button>
        <button
          onClick={() => setCurrentTab('batches')}
          className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
            currentTab === 'batches'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Package className="w-4 h-4 inline mr-2" />
          Lots de doublons ({(duplicateBatches || []).length})
        </button>
      </div>

      {/* Content */}
      {currentTab === 'duplicates' ? (
        /* Duplicates Tab */
        <div className="space-y-6">
          <div className="flex justify-between items-center flex-wrap gap-3">
            <h2 className="text-xl font-semibold golden-glow">
              Cartes en double ({duplicateCards.length})
            </h2>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowCreateBatchModal(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Créer un lot
              </Button>

              {/* Bouton d'ajout à un lot existant (visible si cartes sélectionnées) */}
              {selectedCards.length > 0 && duplicateBatches.length > 0 && (
                <Select onValueChange={handleAddToBatch}>
                  <SelectTrigger className="w-[280px] bg-blue-600 hover:bg-blue-700 text-white border-blue-700">
                    <SelectValue placeholder={`Ajouter ${selectedCards.length} carte(s) à un lot...`} />
                  </SelectTrigger>
                  <SelectContent>
                    {duplicateBatches.map(batch => (
                      <SelectItem key={batch.id} value={batch.id}>
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          <span>{batch.name}</span>
                          <span className="text-xs text-muted-foreground">({batch.cards.length} cartes)</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {duplicateCards.length > 0 ? (
            <div className="space-y-12">
              {consolidatedDuplicates.map((block, blockIndex) => (
                <div key={blockIndex} className="space-y-8">
                  {/* SÉPARATEUR DE BLOC */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent"></div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                      <h1 className="text-2xl font-bold golden-glow uppercase tracking-wide">{block.name}</h1>
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    </div>
                    <div className="flex-1 h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent"></div>
                  </div>

                  {/* EXTENSIONS DU BLOC */}
                  {block.extensions.map((extension, extIndex) => {
                    const extensionKey = `${block.name}-${extension.name}`
                    const filteredCards = filterCardsByNumber(extension.cards, extensionKey)

                    return (
                    <div key={extIndex} className="space-y-4">
                      {/* SÉPARATEUR D'EXTENSION */}
                      <div className="flex items-center gap-4">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-semibold golden-glow">{extension.name}</h2>
                          {extension.releaseDate && (
                            <span className="text-sm text-muted-foreground">
                              ({new Date(extension.releaseDate).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })})
                            </span>
                          )}
                          <Badge variant="outline" className="ml-2">
                            {extension.cards.length} carte{extension.cards.length > 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
                      </div>

                      {/* CHAMP DE RECHERCHE PAR NUMÉRO */}
                      <div className="flex items-center gap-2 max-w-md mx-auto">
                        <Search className="w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Rechercher par numéro (ex: 025 ou 025/165)"
                          value={extensionSearchTerms[extensionKey] || ''}
                          onChange={(e) => setExtensionSearchTerms(prev => ({
                            ...prev,
                            [extensionKey]: e.target.value
                          }))}
                          className="golden-border text-sm"
                          style={{ textTransform: 'none' }}
                        />
                        {extensionSearchTerms[extensionKey] && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExtensionSearchTerms(prev => {
                              const newTerms = { ...prev }
                              delete newTerms[extensionKey]
                              return newTerms
                            })}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            Réinitialiser
                          </Button>
                        )}
                      </div>

                      {/* GRILLE DE CARTES */}
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                        {filteredCards.map((card) => (
                <Card
                  key={card.id}
                  className="golden-border card-hover cursor-pointer group overflow-hidden"
                  onClick={() => handleCardClick(card)}
                >
                  <CardContent className="p-4">
                    {/* Card Image */}
                    <div className="relative aspect-[3/4] mb-3 rounded-lg overflow-hidden group-hover:scale-105 transition-transform duration-200">
                      <CardImage
                        card={card}
                        className="w-full h-full object-cover"
                      />
                      {card.consolidatedQuantity > 1 && (
                        <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                          x{card.consolidatedQuantity}
                        </div>
                      )}
                      <div className="absolute bottom-2 left-2 right-2 flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="flex-1 h-8 p-0 bg-green-500/80 text-white hover:bg-green-600"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleCardSelection(card)
                          }}
                        >
                          {selectedCards.find(c => c.id === card.id) ? '✓' : '+'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2 bg-blue-500/80 text-white hover:bg-blue-600"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSellCard(card)
                          }}
                          title="Vendre cette carte"
                        >
                          <Euro className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Badges des versions en double uniquement */}
                    <CardVersionBadges
                      cardId={card.card_id || card.id}
                      collection={collection}
                      card={card}
                      isUserCopy={true}
                      showOnlyDuplicateVersions={true}
                      className="mb-2"
                    />

                    {/* Card Info */}
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm golden-glow truncate" title={translateCardName(card.name)}>
                        {translateCardName(card.name)}
                      </h3>

                      {/* Numéro de carte - extrait depuis card_id si manquant */}
                      {(() => {
                        const displayNumber = card.number || (card.card_id?.match(/-(\d+)$/)?.[1])
                        return displayNumber ? (
                          <p className="text-xs text-muted-foreground">
                            #{displayNumber}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground/40 italic">
                            Sans numéro
                          </p>
                        )
                      })()}

                      <p className="text-xs text-muted-foreground truncate">{card.set?.name || card.extension || card.series}</p>

                      <div className="space-y-1">
                        <Badge variant="secondary" className="text-xs">
                          {card.rarity}
                        </Badge>
                        <p className="text-xs text-orange-500">{translateCondition(card.condition)}</p>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold text-green-500">{card.marketPrice || card.value || '0.00'}€</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                        ))}
                      </div>
                    </div>
                    )
                  })}
                </div>
              ))}
            </div>
          ) : (
            <Card className="golden-border text-center py-12">
              <CardContent>
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-semibold golden-glow mb-2">
                  Aucun doublon
                </h3>
                <p className="text-muted-foreground">
                  Vous n'avez pas de cartes en double
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        /* Batches Tab */
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold golden-glow">
              Lots de doublons ({(duplicateBatches || []).length})
            </h2>
            <Button
              onClick={() => setShowCreateBatchModal(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouveau lot
            </Button>
          </div>

          {(duplicateBatches || []).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(duplicateBatches || []).map((batch) => (
                <Card key={batch.id} className="golden-border">
                  <CardHeader className="border-b border-border/50">
                    <div className="flex items-center justify-between">
                      <CardTitle className="golden-glow flex items-center">
                        <ShoppingBag className="w-5 h-5 mr-2" />
                        {batch.name}
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-green-500 hover:bg-green-600 text-white"
                          onClick={() => handleSellBatch(batch)}
                          title="Vendre ce lot"
                        >
                          <Euro className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditBatch(batch)}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteBatch(batch.id)}
                          className="border-red-500/20 hover:bg-red-500/10 text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Package className="w-4 h-4" />
                          {batch.cards.length} cartes
                        </div>
                        <div className="flex items-center gap-2 text-lg font-bold text-green-500">
                          <Calculator className="w-4 h-4" />
                          {batch.totalValue}€
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Créé le {new Date(batch.createdAt).toLocaleDateString('fr-FR')}
                      </div>

                      {/* Preview des premières cartes - Cliquable */}
                      <div
                        className="grid grid-cols-4 gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => handleViewBatch(batch)}
                        title="Cliquer pour voir toutes les cartes du lot"
                      >
                        {batch.cards.slice(0, 4).map((card, index) => (
                          <div
                            key={index}
                            className="aspect-[3/4] rounded overflow-hidden bg-muted"
                            title={translateCardName(card.name)}
                          >
                            <CardImage
                              card={card}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                        {batch.cards.length > 4 && (
                          <div className="aspect-[3/4] rounded bg-muted/50 flex items-center justify-center">
                            <span className="text-xs text-muted-foreground">
                              +{batch.cards.length - 4}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="golden-border text-center py-12">
              <CardContent>
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-xl font-semibold golden-glow mb-2">
                  Aucun lot créé
                </h3>
                <p className="text-muted-foreground mb-4">
                  Créez des lots de cartes en double pour organiser vos ventes
                </p>
                <Button
                  onClick={() => setShowCreateBatchModal(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Créer mon premier lot
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Create/Edit Batch Modal */}
      <Dialog open={showCreateBatchModal} onOpenChange={setShowCreateBatchModal}>
        <DialogContent className="max-w-4xl golden-border bg-background">
          <DialogHeader>
            <DialogTitle className="golden-glow">
              {editingBatch ? 'Modifier le lot' : 'Créer un nouveau lot'}
            </DialogTitle>
            <DialogDescription>
              {editingBatch ? 'Modifiez le nom et la sélection de cartes de ce lot.' : 'Créez un nouveau lot de doublons avec un nom personnalisé.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <Label htmlFor="batch-name">Nom du lot</Label>
              <Input
                id="batch-name"
                placeholder="Ex: Lot Pikachu vintage"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                className="golden-border"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <Label>Sélectionner les cartes ({selectedCards.length})</Label>
                <div className="text-lg font-bold text-green-500">
                  Total: {calculateBatchValue(selectedCards)}€
                </div>
              </div>

              <div className="max-h-[600px] overflow-y-auto space-y-6">
                {groupedModalCards.map((block, blockIndex) => (
                  <div key={blockIndex} className="space-y-4">
                    {/* Séparateur de bloc */}
                    <div className="flex items-center gap-3 sticky top-0 bg-background z-10 py-2">
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
                      <h3 className="text-sm font-bold golden-glow uppercase tracking-wide">{block.blockName}</h3>
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
                    </div>

                    {/* Extensions du bloc */}
                    {block.extensions.map((extension, extIndex) => {
                      const extensionSearchKey = `modal-${extension.key}`
                      const filteredCards = filterModalCardsByNumber(extension.cards, extension.key)

                      return (
                        <div key={extIndex} className="space-y-3">
                          {/* Nom de l'extension */}
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold golden-glow">{extension.name}</h4>
                            <Badge variant="outline" className="text-xs">
                              {extension.cards.length} carte{extension.cards.length > 1 ? 's' : ''}
                            </Badge>
                          </div>

                          {/* Champ de recherche par numéro pour cette extension */}
                          <div className="flex items-center gap-2">
                            <Search className="w-4 h-4 text-muted-foreground" />
                            <Input
                              placeholder="Rechercher par numéro (ex: 025)"
                              value={extensionSearchTerms[extensionSearchKey] || ''}
                              onChange={(e) => setExtensionSearchTerms(prev => ({
                                ...prev,
                                [extensionSearchKey]: e.target.value
                              }))}
                              className="golden-border text-sm"
                              style={{ textTransform: 'none' }}
                            />
                            {extensionSearchTerms[extensionSearchKey] && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setExtensionSearchTerms(prev => {
                                  const newTerms = { ...prev }
                                  delete newTerms[extensionSearchKey]
                                  return newTerms
                                })}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                ✕
                              </Button>
                            )}
                          </div>

                          {/* Grille de cartes */}
                          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {filteredCards.map((card) => {
                  const isSelected = selectedCards.find(c => c.id === card.id)
                  const maxQuantity = card.quantity || 2
                  const batchQuantity = cardQuantities[card.id] || 1
                  return (
                    <div key={card.id} className="space-y-2">
                      <div
                        className={`relative aspect-[3/4] rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${
                          isSelected ? 'ring-2 ring-green-500 scale-95' : 'hover:scale-105'
                        }`}
                        onClick={() => toggleCardSelection(card)}
                      >
                        <CardImage
                          card={card}
                          className="w-full h-full object-cover"
                        />
                        {/* Numéro de carte en haut à gauche */}
                        {card.number && (
                          <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded font-medium">
                            #{card.number}
                          </div>
                        )}
                        <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-1 py-0.5 rounded font-medium">
                          x{maxQuantity}
                        </div>
                        {isSelected && (
                          <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                            <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center">
                              ✓
                            </div>
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              updateCardQuantity(card.id, batchQuantity - 1, maxQuantity)
                            }}
                            className="bg-accent hover:bg-accent/80 text-foreground rounded px-2 py-1 text-sm font-bold"
                          >
                            -
                          </button>
                          <Input
                            type="number"
                            min="1"
                            max={maxQuantity}
                            value={batchQuantity}
                            onChange={(e) => {
                              e.stopPropagation()
                              updateCardQuantity(card.id, e.target.value, maxQuantity)
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full text-center py-1 h-8"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              updateCardQuantity(card.id, batchQuantity + 1, maxQuantity)
                            }}
                            className="bg-accent hover:bg-accent/80 text-foreground rounded px-2 py-1 text-sm font-bold"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setShowCreateBatchModal(false)
                setEditingBatch(null)
                setBatchName('')
                setSelectedCards([])
              }}>
                Annuler
              </Button>
              <Button
                onClick={editingBatch ? handleUpdateBatch : handleCreateBatch}
                className="bg-green-600 hover:bg-green-700"
              >
                {editingBatch ? 'Modifier' : 'Créer'} le lot
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sale Modals */}
      <SaleModal
        isOpen={showSaleModal}
        onClose={() => {
          setShowSaleModal(false)
          setCardToSell(null)
        }}
        onSubmit={handleSaleSubmit}
        card={cardToSell}
      />

      <BatchSaleModal
        isOpen={showBatchSaleModal}
        onClose={() => {
          setShowBatchSaleModal(false)
          setBatchToSell(null)
        }}
        onSubmit={handleSaleSubmit}
        batch={batchToSell}
      />

      {/* Duplicate Detail Modal */}
      <DuplicateDetailModal
        isOpen={showDetailModal}
        onClose={handleCloseDetailModal}
        card={selectedCardForDetail}
        collection={collection}
      />

      {/* Batch Detail Modal - Vue détaillée d'un lot */}
      <Dialog open={showBatchDetailModal} onOpenChange={setShowBatchDetailModal}>
        <DialogContent className="max-w-6xl golden-border bg-background max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="golden-glow flex items-center gap-2">
              <Package className="w-6 h-6" />
              {viewingBatch?.name}
            </DialogTitle>
            <DialogDescription>
              {viewingBatch?.cards.length} carte{viewingBatch?.cards.length > 1 ? 's' : ''} dans ce lot
              <span className="ml-4 text-green-500 font-semibold">
                Valeur totale : {viewingBatch?.totalValue}€
              </span>
            </DialogDescription>
          </DialogHeader>

          {viewingBatch && (
            <div className="space-y-4 mt-4">
              {/* Grille de toutes les cartes du lot */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {viewingBatch.cards.map((card, index) => (
                  <Card
                    key={index}
                    className="golden-border card-hover cursor-pointer group overflow-hidden"
                    onClick={() => {
                      setSelectedCardForDetail(card)
                      setShowDetailModal(true)
                    }}
                  >
                    <CardContent className="p-3">
                      {/* Card Image */}
                      <div className="relative aspect-[3/4] mb-2 rounded-lg overflow-hidden group-hover:scale-105 transition-transform duration-200">
                        <CardImage
                          card={card}
                          className="w-full h-full object-cover"
                        />
                        {/* Numéro de carte */}
                        {card.number && (
                          <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded font-medium">
                            #{card.number}
                          </div>
                        )}
                        {/* Quantité dans le lot */}
                        {card.batchQuantity > 1 && (
                          <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                            x{card.batchQuantity}
                          </div>
                        )}
                      </div>

                      {/* Badges des versions */}
                      <CardVersionBadges
                        cardId={card.card_id || card.id}
                        collection={collection}
                        card={card}
                        isUserCopy={true}
                        showOnlyDuplicateVersions={false}
                        className="mb-2"
                      />

                      {/* Card Info */}
                      <div className="space-y-1">
                        <h4 className="font-semibold text-xs golden-glow truncate" title={translateCardName(card.name)}>
                          {translateCardName(card.name)}
                        </h4>

                        <p className="text-xs text-muted-foreground truncate">{card.set?.name || card.extension}</p>

                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-xs">
                            {translateCondition(card.condition)}
                          </Badge>
                          <p className="text-xs font-semibold text-green-500">
                            {card.marketPrice || card.value || '0.00'}€
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Bouton de fermeture */}
              <div className="flex justify-end pt-4 border-t border-border/50">
                <Button
                  variant="outline"
                  onClick={handleCloseBatchDetail}
                  className="golden-border"
                >
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Duplicate Warning Modal */}
      <Dialog open={showDuplicateWarning} onOpenChange={setShowDuplicateWarning}>
        <DialogContent className="max-w-2xl golden-border bg-background">
          <DialogHeader>
            <DialogTitle className="golden-glow flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-yellow-500" />
              Carte(s) déjà présente(s) dans le lot
            </DialogTitle>
            <DialogDescription>
              {pendingBatchAdd && pendingBatchAdd.duplicateCards.length > 0 && (
                <>
                  {pendingBatchAdd.duplicateCards.length === 1 ? (
                    <>Un exemplaire de cette carte est déjà présent dans le lot "{pendingBatchAdd.batch.name}".</>
                  ) : (
                    <>{pendingBatchAdd.duplicateCards.length} cartes sont déjà présentes dans le lot "{pendingBatchAdd.batch.name}".</>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {pendingBatchAdd && (
            <div className="space-y-4">
              {/* Liste des cartes en double */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">
                  {pendingBatchAdd.duplicateCards.length === 1 ? 'Carte déjà présente :' : 'Cartes déjà présentes :'}
                </h3>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {pendingBatchAdd.duplicateCards.map(({ card, existingCard }, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg"
                    >
                      <div className="w-16 h-20 flex-shrink-0 rounded overflow-hidden">
                        <CardImage card={card} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate golden-glow">
                          {translateCardName(card.name)}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {card.version || 'Normale'} • #{card.number}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {card.set?.name || card.extension}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <Badge variant="outline" className="bg-yellow-500/20 text-yellow-600 border-yellow-500/40">
                          Déjà x{existingCard.batchQuantity || 1}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nouvelles cartes (si présentes) */}
              {pendingBatchAdd.newCards.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-border/50">
                  <h3 className="font-semibold text-sm text-green-500">
                    {pendingBatchAdd.newCards.length === 1 ? 'Nouvelle carte :' : `${pendingBatchAdd.newCards.length} nouvelles cartes :`}
                  </h3>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {pendingBatchAdd.newCards.map((card, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg"
                      >
                        <div className="w-16 h-20 flex-shrink-0 rounded overflow-hidden">
                          <CardImage card={card} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm truncate golden-glow">
                            {translateCardName(card.name)}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {card.version || 'Normale'} • #{card.number}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {card.set?.name || card.extension}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <Badge variant="outline" className="bg-green-500/20 text-green-600 border-green-500/40">
                            Nouveau
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Question */}
              <div className="pt-4 border-t border-border/50">
                <p className="text-sm text-center font-medium">
                  Voulez-vous quand même ajouter {pendingBatchAdd.duplicateCards.length === 1 ? 'cette carte' : 'ces cartes'} au lot ?
                </p>
                {pendingBatchAdd.newCards.length > 0 && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Les nouvelles cartes seront ajoutées dans tous les cas.
                  </p>
                )}
              </div>

              {/* Boutons */}
              <div className="flex gap-3 justify-center pt-4">
                <Button
                  onClick={handleCancelDuplicateAdd}
                  className="bg-red-600 hover:bg-red-700 text-white px-8"
                >
                  Non, annuler
                </Button>
                <Button
                  onClick={handleConfirmDuplicateAdd}
                  className="bg-green-600 hover:bg-green-700 text-white px-8"
                >
                  Oui, ajouter quand même
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}