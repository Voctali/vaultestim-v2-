/**
 * Éditeur de Base de Données - Nouvel onglet d'administration
 * Utilise le service centralisé BlockHierarchyService (même logique qu'Explorer)
 */
import React, { useState, useEffect } from 'react'
import { Database, Edit3, Trash2, Plus, Search, Package, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useCardDatabase } from '@/hooks/useCardDatabase'
import { IndexedDBService } from '@/services/IndexedDBService'
import { ImageUploadService } from '@/services/ImageUploadService'
import { ImageUpload } from '@/components/features/ImageUpload'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertTriangle } from 'lucide-react'
import { buildBlocksHierarchy } from '@/services/BlockHierarchyService'
import { CardPreviewModal } from '@/components/features/explore/CardPreviewModal'
import { DataMigration } from '@/components/features/settings/DataMigration'
import { DatabaseBackup } from '@/components/features/settings/DatabaseBackup'
import { PriceMigrationPanel } from '@/components/features/admin/PriceMigrationPanel'
import { PriceRefreshPanel } from '@/components/features/admin/PriceRefreshPanel'
import { AttacksMigrationPanel } from '@/components/features/admin/AttacksMigrationPanel'
import { CardMarketDebugPanel } from '@/components/features/admin/CardMarketDebugPanel'
import { CardMarketBulkHelper } from '@/components/features/admin/CardMarketBulkHelper'
import { SealedProductsManager } from '@/components/features/admin/SealedProductsManager'
import { SetImportPanel } from '@/components/features/admin/SetImportPanel'

export function AdminDatabaseEditor() {
  const { discoveredCards, seriesDatabase, isLoading } = useCardDatabase()

  // Onglet principal : 'cards' ou 'sealed-products'
  const [mainTab, setMainTab] = useState('cards')

  // États pour les données transformées (comme dans Explorer)
  const [blocksData, setBlocksData] = useState([])
  const [customBlocks, setCustomBlocks] = useState([])
  const [customExtensions, setCustomExtensions] = useState([])
  const [searchQuery, setSearchQuery] = useState('')

  // États de navigation (comme dans Explorer)
  const [currentView, setCurrentView] = useState('blocks') // 'blocks', 'extensions', 'cards'
  const [selectedBlock, setSelectedBlock] = useState(null)
  const [selectedExtension, setSelectedExtension] = useState(null)
  const [navigationPath, setNavigationPath] = useState([])

  // États pour l'édition (comme dans DatabaseAdmin)
  const [editingBlock, setEditingBlock] = useState(null)
  const [editingExtension, setEditingExtension] = useState(null)
  const [editingCard, setEditingCard] = useState(null)
  const [previewCard, setPreviewCard] = useState(null) // Carte pour l'aperçu en grand
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    year: new Date().getFullYear(),
    endYear: '',
    description: '',
    imageUrl: '',
    totalCards: 0,
    extensions: [],
    releaseDate: '',
    targetBlockId: '' // Pour déplacer les extensions
  })

  // Charger les données personnalisées
  useEffect(() => {
    const loadCustomData = async () => {
      try {
        const [blocks, extensions] = await Promise.all([
          IndexedDBService.loadCustomBlocks(),
          IndexedDBService.loadCustomExtensions()
        ])
        setCustomBlocks(blocks)
        setCustomExtensions(extensions)
        console.log(`📦 ${blocks.length} blocs personnalisés et ${extensions.length} extensions personnalisées chargés`)
      } catch (error) {
        console.error('❌ Erreur chargement données personnalisées:', error)
      }
    }
    loadCustomData()
  }, [])

  // Construire la hiérarchie des blocs (utilise le service centralisé comme Explorer)
  useEffect(() => {
    const buildAndEnrichBlocks = async () => {
      if (!discoveredCards || !seriesDatabase) return

      try {
        console.log('🔄 AdminDatabaseEditor - Construction hiérarchie via BlockHierarchyService...')
        console.log(`📊 Données disponibles:`)
        console.log(`   - ${discoveredCards.length} cartes découvertes`)
        console.log(`   - ${seriesDatabase.length} extensions dans la base`)
        console.log(`   - ${customBlocks.length} blocs personnalisés`)
        console.log(`   - ${customExtensions.length} extensions déplacées`)

        // Utiliser le service centralisé pour construire la hiérarchie (MÊME LOGIQUE QU'EXPLORER)
        const blocks = buildBlocksHierarchy(
          discoveredCards,
          seriesDatabase,
          customBlocks,
          customExtensions
        )

        // Enrichir les blocs avec leurs images uploadées (comme dans Explorer)
        const enrichedBlocks = await Promise.all(
          blocks.map(async (block) => {
            try {
              // Récupérer les images uploadées pour ce bloc
              const uploadedImages = await ImageUploadService.getImagesForEntity('block', block.id)
              const latestImage = uploadedImages.length > 0 ? uploadedImages[0] : null

              // Enrichir les extensions avec leurs images
              const enrichedExtensions = await Promise.all(
                (block.extensions || []).map(async (extension) => {
                  try {
                    const extImages = await ImageUploadService.getImagesForEntity('extension', extension.id)
                    const latestExtImage = extImages.length > 0 ? extImages[0] : null

                    return {
                      ...extension,
                      image: latestExtImage?.url || extension.image || extension.images?.logo || extension.imageUrl
                    }
                  } catch (error) {
                    return extension
                  }
                })
              )

              return {
                ...block,
                extensions: enrichedExtensions,
                image: latestImage?.url || block.image || block.imageUrl
              }
            } catch (error) {
              console.warn(`⚠️ Erreur enrichissement bloc ${block.id}:`, error)
              return block
            }
          })
        )

        setBlocksData(enrichedBlocks)
        console.log(`✅ AdminDatabaseEditor - ${enrichedBlocks.length} blocs enrichis (IDENTIQUE À EXPLORER)`)
      } catch (error) {
        console.error('❌ Erreur construction hiérarchie éditeur:', error)
      }
    }

    buildAndEnrichBlocks()
  }, [discoveredCards, seriesDatabase, customBlocks, customExtensions])

  // Fonction pour forcer la reconstruction de la hiérarchie
  const forceRebuildHierarchy = async () => {
    if (!discoveredCards || !seriesDatabase) return

    try {
      console.log('🔄 Reconstruction forcée de la hiérarchie...')

      // Recharger les données personnalisées depuis IndexedDB
      const [freshCustomBlocks, freshCustomExtensions] = await Promise.all([
        IndexedDBService.loadCustomBlocks(),
        IndexedDBService.loadCustomExtensions()
      ])

      console.log(`📦 Données chargées depuis IndexedDB:`)
      console.log(`   - ${freshCustomBlocks.length} blocs personnalisés`)
      console.log(`   - ${freshCustomExtensions.length} extensions déplacées`)
      console.log(`   - Extensions déplacées:`, freshCustomExtensions.map(ext => `${ext.id} → ${ext.series}`))

      // Mettre à jour les états React pour déclencher le useEffect
      setCustomBlocks(freshCustomBlocks)
      setCustomExtensions(freshCustomExtensions)

      // Le useEffect se déclenchera automatiquement et reconstruira la hiérarchie avec le service centralisé
      console.log('✅ États mis à jour, reconstruction automatique via useEffect...')

    } catch (error) {
      console.error('❌ Erreur lors de la reconstruction forcée:', error)
    }
  }

  // Fonction de filtrage des données selon la vue actuelle (comme dans Explorer)
  const getFilteredData = () => {
    const searchLower = searchQuery.toLowerCase()

    switch (currentView) {
      case 'blocks':
        return blocksData.filter(block =>
          block.name.toLowerCase().includes(searchLower)
        )
      case 'extensions':
        return selectedBlock?.extensions?.filter(ext =>
          ext.name.toLowerCase().includes(searchLower)
        ) || []
      case 'cards':
        return discoveredCards.filter(card =>
          card.set?.id === selectedExtension?.id &&
          card.name.toLowerCase().includes(searchLower)
        )
      default:
        return []
    }
  }

  // Fonctions de navigation (comme dans Explorer)
  const handleBlockClick = (block) => {
    setSelectedBlock(block)
    setCurrentView('extensions')
    setNavigationPath([{ name: block.name, view: 'blocks' }])
  }

  const handleExtensionClick = (extension) => {
    setSelectedExtension(extension)
    setCurrentView('cards')
    setNavigationPath(prev => [...prev, { name: extension.name, view: 'extensions' }])
  }

  const handleBackToBlocks = () => {
    setCurrentView('blocks')
    setSelectedBlock(null)
    setSelectedExtension(null)
    setNavigationPath([])
  }

  const handleBackToExtensions = () => {
    setCurrentView('extensions')
    setSelectedExtension(null)
    setNavigationPath(prev => prev.slice(0, -1))
  }

  // Fonctions d'édition (comme dans DatabaseAdmin)
  const handleEditBlock = (block) => {
    setEditingBlock(block)
    setFormData({
      name: block.name,
      year: block.year || block.startYear || new Date().getFullYear(),
      endYear: block.endYear || '',
      description: block.description || '',
      imageUrl: block.image || block.imageUrl || '',
      totalCards: block.totalCards || 0,
      extensions: block.extensions?.map(ext => ext.name) || [],
      releaseDate: '',
      targetBlockId: ''
    })
  }

  const handleEditExtension = (extension) => {
    setEditingExtension(extension)
    setFormData({
      name: extension.name,
      year: extension.releaseDate ? new Date(extension.releaseDate).getFullYear() : new Date().getFullYear(),
      endYear: '',
      description: extension.description || '',
      imageUrl: extension.image || extension.imageUrl || '',
      totalCards: extension.cardsCount || 0,
      extensions: [],
      releaseDate: extension.releaseDate || '',
      targetBlockId: '' // Pour le déplacement vers un autre bloc
    })
  }

  const handleSaveEdit = async () => {
    try {
      if (editingBlock) {
        // Vérifier si le nom du bloc existe déjà (sauf pour le bloc en cours d'édition)
        const existingBlockWithSameName = blocksData.find(block =>
          block.name.toLowerCase() === formData.name.toLowerCase() &&
          block.id !== editingBlock.id
        )

        if (existingBlockWithSameName) {
          alert(`Un bloc avec le nom "${formData.name}" existe déjà. Veuillez choisir un autre nom.`)
          return
        }

        // Déterminer si c'est un bloc généré qu'on transforme en personnalisé
        const isConvertingGeneratedToCustom = !editingBlock.id.startsWith('custom-block-')

        // S'assurer que les blocs personnalisés ont des ID uniques
        let blockId = editingBlock.id
        if (isConvertingGeneratedToCustom) {
          // Si c'est un bloc généré qu'on transforme en personnalisé, lui donner un nouvel ID unique
          const timestamp = Date.now()
          const randomId = Math.random().toString(36).substr(2, 5)
          blockId = `custom-block-${timestamp}-${randomId}`
        }

        // Sauvegarder le bloc modifié
        const updatedBlock = {
          ...editingBlock,
          id: blockId,
          name: formData.name,
          year: formData.year,
          startYear: formData.year,
          endYear: formData.endYear,
          description: formData.description,
          image: formData.imageUrl,
          imageUrl: formData.imageUrl,
          totalCards: formData.totalCards,
          type: 'custom' // Marquer comme personnalisé après édition
        }

        // Sauvegarder dans IndexedDB
        await IndexedDBService.saveCustomBlock(updatedBlock)

        // Mise à jour instantanée de l'état React
        setBlocksData(prevBlocks => {
          if (isConvertingGeneratedToCustom) {
            // Conversion d'un bloc généré vers personnalisé :
            // Remplacer l'ancien bloc par le nouveau avec le nouvel ID
            return prevBlocks.map(block =>
              block.id === editingBlock.id ? updatedBlock : block
            )
          } else {
            // Édition d'un bloc déjà personnalisé : simple mise à jour
            return prevBlocks.map(block =>
              block.id === editingBlock.id ? updatedBlock : block
            )
          }
        })

        // Mettre à jour aussi customBlocks
        setCustomBlocks(prevCustomBlocks => {
          const exists = prevCustomBlocks.find(cb => cb.id === editingBlock.id)
          if (exists) {
            // Bloc personnalisé existant : mise à jour
            return prevCustomBlocks.map(cb =>
              cb.id === editingBlock.id ? updatedBlock : cb
            )
          } else {
            // Nouveau bloc personnalisé (conversion depuis généré)
            return [...prevCustomBlocks, updatedBlock]
          }
        })

        // Mettre à jour selectedBlock si nécessaire
        if (selectedBlock && selectedBlock.id === editingBlock.id) {
          setSelectedBlock(updatedBlock)
        }

        console.log(`✅ Bloc "${formData.name}" sauvegardé avec succès`)
        setEditingBlock(null)

      } else if (editingExtension) {
        // Sauvegarder l'extension modifiée
        const updatedExtension = {
          ...editingExtension,
          name: formData.name,
          releaseDate: formData.releaseDate,
          description: formData.description,
          image: formData.imageUrl,
          imageUrl: formData.imageUrl,
          cardsCount: formData.totalCards
        }

        // Si c'est un déplacement vers un autre bloc
        if (formData.targetBlockId) {
          const targetBlockName = blocksData.find(b => b.id === formData.targetBlockId)?.name || 'Nouveau bloc'

          await IndexedDBService.saveCustomExtension(
            editingExtension.id,
            targetBlockName,
            editingExtension.series
          )

          console.log(`✅ Extension "${formData.name}" déplacée vers "${targetBlockName}"`)

          // IMPORTANT: Forcer la reconstruction immédiate de la hiérarchie
          await forceRebuildHierarchy()

          // CRUCIAL: Mettre à jour selectedBlock pour refléter l'extension déplacée
          if (selectedBlock && currentView === 'extensions') {
            // Supprimer l'extension déplacée du selectedBlock actuel
            const updatedSelectedBlock = {
              ...selectedBlock,
              extensions: selectedBlock.extensions.filter(ext => ext.id !== editingExtension.id),
              totalExtensions: selectedBlock.totalExtensions - 1,
              totalCards: selectedBlock.totalCards - (editingExtension.cardsCount || 0)
            }
            setSelectedBlock(updatedSelectedBlock)
            console.log(`🔄 Extension "${editingExtension.name}" supprimée de "${selectedBlock.name}" - ${updatedSelectedBlock.extensions.length} extensions restantes`)
          }

          // Fermer la modale après le déplacement réussi
          setEditingExtension(null)
          return // Sortir ici pour éviter la double fermeture
        }

        // Mettre à jour l'extension dans seriesDatabase (IndexedDB)
        const updatedSeriesDatabase = seriesDatabase.map(series => {
          if (series.id === editingExtension.id) {
            // C'est l'extension à mettre à jour
            return {
              ...series,
              name: formData.name,
              releaseDate: formData.releaseDate,
              description: formData.description,
              logo: formData.imageUrl,
              totalCards: formData.totalCards
            }
          }
          return series
        })

        // Sauvegarder dans IndexedDB
        await IndexedDBService.saveSeriesDatabase(updatedSeriesDatabase)
        console.log(`💾 Extension "${formData.name}" mise à jour dans IndexedDB`)

        // Forcer la reconstruction de la hiérarchie pour refléter les changements
        await forceRebuildHierarchy()

        // Pour les nouvelles extensions, les sauvegarder dans IndexedDB comme extensions custom
        const isNewExtension = !selectedBlock?.extensions?.find(ext => ext.id === editingExtension.id)
        if (isNewExtension) {
          // Sauvegarder comme extension personnalisée dans le bloc actuel
          await IndexedDBService.saveCustomExtension(
            editingExtension.id,
            editingExtension.series,
            editingExtension.series
          )
          console.log(`💾 Nouvelle extension "${formData.name}" sauvegardée dans IndexedDB`)
        }

        // Mise à jour instantanée de l'état React pour les propriétés de l'extension
        setBlocksData(prevBlocks =>
          prevBlocks.map(block => {
            if (block.name === editingExtension.series || block.id === selectedBlock?.id) {
              const existingExtIndex = block.extensions?.findIndex(ext => ext.id === editingExtension.id) ?? -1
              if (existingExtIndex >= 0) {
                // Extension existante : la mettre à jour
                return {
                  ...block,
                  extensions: block.extensions?.map(ext =>
                    ext.id === editingExtension.id ? updatedExtension : ext
                  ) || []
                }
              } else {
                // Nouvelle extension : l'ajouter
                return {
                  ...block,
                  extensions: [...(block.extensions || []), updatedExtension],
                  totalExtensions: (block.totalExtensions || 0) + 1
                }
              }
            }
            return block
          })
        )

        // Mettre à jour selectedBlock si on est dans la vue extensions
        if (selectedBlock && currentView === 'extensions') {
          const existingExtIndex = selectedBlock.extensions?.findIndex(ext => ext.id === editingExtension.id) ?? -1
          if (existingExtIndex >= 0) {
            // Extension existante : la mettre à jour dans selectedBlock
            setSelectedBlock(prev => ({
              ...prev,
              extensions: prev.extensions?.map(ext =>
                ext.id === editingExtension.id ? updatedExtension : ext
              ) || []
            }))
          } else {
            // Nouvelle extension : l'ajouter à selectedBlock
            setSelectedBlock(prev => ({
              ...prev,
              extensions: [...(prev.extensions || []), updatedExtension],
              totalExtensions: (prev.totalExtensions || 0) + 1
            }))
          }
        }

        console.log(`✅ Extension "${formData.name}" sauvegardée avec succès`)
        setEditingExtension(null)
      }

      // Forcer la reconstruction de la hiérarchie pour refléter les changements
      setTimeout(() => {
        // Le useEffect se déclenchera automatiquement avec les nouveaux états
        console.log('🔄 Reconstruction de la hiérarchie après sauvegarde...')
      }, 100)

    } catch (error) {
      console.error('❌ Erreur sauvegarde:', error)
      // TODO: Afficher un toast d'erreur à l'utilisateur
    }
  }

  // Fonction pour déplacer immédiatement une extension
  const handleMoveExtensionImmediate = async (targetBlockId) => {
    if (!editingExtension || !targetBlockId) return

    try {
      const targetBlockName = blocksData.find(b => b.id === targetBlockId)?.name || 'Nouveau bloc'

      console.log(`🔄 Début du déplacement de "${editingExtension.name}" vers "${targetBlockName}"`)

      await IndexedDBService.saveCustomExtension(
        editingExtension.id,
        targetBlockName,
        editingExtension.series
      )

      console.log(`💾 Sauvegarde IndexedDB terminée`)

      // IMPORTANT: Forcer la reconstruction immédiate de la hiérarchie
      await forceRebuildHierarchy()

      console.log(`🔄 Reconstruction de la hiérarchie terminée`)

      // Fermer la modale
      setEditingExtension(null)

      // CRUCIAL: Naviguer vers la vue blocks pour voir le changement
      setCurrentView('blocks')
      setSelectedBlock(null)
      setSelectedExtension(null)
      setNavigationPath([])

      console.log(`✅ Extension "${editingExtension.name}" déplacée avec succès vers "${targetBlockName}" - Navigation vers vue blocks`)

    } catch (error) {
      console.error('❌ Erreur lors du déplacement immédiat:', error)
    }
  }

  // Fonctions pour créer de nouveaux éléments
  const handleCreateNew = () => {
    if (currentView === 'blocks') {
      handleCreateNewBlock()
    } else if (currentView === 'extensions') {
      handleCreateNewExtension()
    } else if (currentView === 'cards') {
      handleCreateNewCard()
    }
  }

  const handleCreateNewBlock = () => {
    // Générer un ID unique pour éviter les conflits
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substr(2, 5)

    const newBlock = {
      id: `custom-block-${timestamp}-${randomId}`,
      name: 'Nouveau Bloc',
      year: new Date().getFullYear(),
      startYear: new Date().getFullYear(),
      endYear: '',
      description: '',
      image: '',
      imageUrl: '',
      totalCards: 0,
      totalExtensions: 0,
      extensions: [],
      type: 'custom'
    }

    setEditingBlock(newBlock)
    setFormData({
      name: newBlock.name,
      year: newBlock.year,
      endYear: newBlock.endYear,
      description: newBlock.description,
      imageUrl: newBlock.imageUrl,
      totalCards: newBlock.totalCards,
      extensions: [],
      releaseDate: '',
      targetBlockId: ''
    })
    console.log('📦 Création d\'un nouveau bloc personnalisé')
  }

  const handleCreateNewExtension = () => {
    if (!selectedBlock) return

    const newExtension = {
      id: `custom-ext-${Date.now()}`,
      name: 'Nouvelle Extension',
      series: selectedBlock.name,
      releaseDate: new Date().toISOString().split('T')[0],
      description: '',
      image: '',
      imageUrl: '',
      cardsCount: 0,
      totalCards: 0,
      isCustom: true
    }

    setEditingExtension(newExtension)
    setFormData({
      name: newExtension.name,
      year: new Date().getFullYear(),
      endYear: '',
      description: newExtension.description,
      imageUrl: newExtension.imageUrl,
      totalCards: newExtension.cardsCount,
      extensions: [],
      releaseDate: newExtension.releaseDate,
      targetBlockId: ''
    })
    console.log(`📦 Création d'une nouvelle extension dans "${selectedBlock.name}"`)
  }

  // Fonctions de suppression
  const handleDeleteBlock = async (block) => {
    const confirmMessage = block.type === 'custom'
      ? `Supprimer le bloc personnalisé "${block.name}" ?\n\nCette action est irréversible.`
      : `Supprimer le bloc généré "${block.name}" ?\n\nCela supprimera le bloc et toutes ses extensions de la base de données locale.`

    if (!window.confirm(confirmMessage)) return

    try {
      console.log(`🗑️ Suppression du bloc "${block.name}"...`)

      if (block.type === 'custom') {
        // Supprimer le bloc personnalisé d'IndexedDB
        await IndexedDBService.deleteCompleteBlock(block.id)

        // Supprimer du state customBlocks
        setCustomBlocks(prev => prev.filter(cb => cb.id !== block.id))
      } else {
        // Pour les blocs générés, supprimer toutes les extensions et cartes
        await IndexedDBService.deleteCompleteBlock(block.id)
      }

      // Supprimer du state blocksData
      setBlocksData(prev => prev.filter(b => b.id !== block.id))

      // Si on était dans ce bloc, retourner à la vue blocs
      if (selectedBlock?.id === block.id) {
        handleBackToBlocks()
      }

      console.log(`✅ Bloc "${block.name}" supprimé avec succès`)

    } catch (error) {
      console.error('❌ Erreur lors de la suppression du bloc:', error)
      alert('Erreur lors de la suppression du bloc. Veuillez réessayer.')
    }
  }

  const handleDeleteExtension = async (extension) => {
    const confirmMessage = `Supprimer l'extension "${extension.name}" ?\n\nCela supprimera l'extension et toutes ses cartes de la base de données locale.\nCette action est irréversible.`

    if (!window.confirm(confirmMessage)) return

    try {
      console.log(`🗑️ Suppression de l'extension "${extension.name}"...`)

      // Supprimer l'extension d'IndexedDB
      await IndexedDBService.deleteCompleteExtension(extension.id)

      // Supprimer des customExtensions si c'est une extension déplacée
      setCustomExtensions(prev => prev.filter(ce => ce.id !== extension.id))

      // Mettre à jour selectedBlock pour supprimer l'extension
      if (selectedBlock) {
        const updatedSelectedBlock = {
          ...selectedBlock,
          extensions: selectedBlock.extensions.filter(ext => ext.id !== extension.id),
          totalExtensions: selectedBlock.totalExtensions - 1,
          totalCards: selectedBlock.totalCards - (extension.cardsCount || 0)
        }
        setSelectedBlock(updatedSelectedBlock)
      }

      // Mettre à jour blocksData
      setBlocksData(prev =>
        prev.map(block => ({
          ...block,
          extensions: block.extensions?.filter(ext => ext.id !== extension.id) || [],
          totalExtensions: Math.max(0, (block.totalExtensions || 0) - 1),
          totalCards: Math.max(0, (block.totalCards || 0) - (extension.cardsCount || 0))
        }))
      )

      console.log(`✅ Extension "${extension.name}" supprimée avec succès`)

    } catch (error) {
      console.error('❌ Erreur lors de la suppression de l\'extension:', error)
      alert('Erreur lors de la suppression de l\'extension. Veuillez réessayer.')
    }
  }

  const handleDeleteCard = async (card) => {
    const confirmMessage = `Supprimer la carte "${card.name}" ?\n\nCette action est irréversible.`

    if (!window.confirm(confirmMessage)) return

    try {
      console.log(`🗑️ Suppression de la carte "${card.name}"...`)

      // TODO: Implémenter la suppression d'une carte spécifique
      // await IndexedDBService.deleteCard(card.id)

      console.log(`✅ Carte "${card.name}" supprimée avec succès`)

    } catch (error) {
      console.error('❌ Erreur lors de la suppression de la carte:', error)
      alert('Erreur lors de la suppression de la carte. Veuillez réessayer.')
    }
  }

  const handleEditCard = (card) => {
    setEditingCard(card)
    setFormData({
      name: card.name || '',
      number: card.number || '',
      rarity: card.rarity || '',
      subtypes: card.subtypes?.join(', ') || '',
      supertype: card.supertype || 'Pokémon',
      imageUrl: card.images?.small || card.image || '',
      hp: card.hp || '',
      types: card.types?.join(', ') || ''
    })
    console.log(`✏️ Édition de la carte "${card.name}"`)
  }

  const handleCreateNewCard = () => {
    if (!selectedExtension) return

    const newCard = {
      id: `custom-card-${Date.now()}`,
      name: 'Nouvelle Carte',
      number: '',
      rarity: 'Common',
      subtypes: [],
      supertype: 'Pokémon',
      images: { small: '', large: '' },
      set: {
        id: selectedExtension.id,
        name: selectedExtension.name
      }
    }

    setEditingCard(newCard)
    setFormData({
      name: newCard.name,
      number: '',
      rarity: 'Common',
      subtypes: '',
      supertype: 'Pokémon',
      imageUrl: '',
      hp: '',
      types: ''
    })
    console.log(`📄 Création d'une nouvelle carte dans "${selectedExtension.name}"`)
  }

  // Sauvegarder les modifications d'une carte
  const handleSaveCardEdit = async () => {
    if (!editingCard) return

    try {
      console.log('💾 Sauvegarde de la carte:', editingCard.id)

      // Préparer les mises à jour
      const updates = {
        name: formData.name || editingCard.name,
        number: formData.number || editingCard.number,
        rarity: formData.rarity || editingCard.rarity,
        supertype: formData.supertype || editingCard.supertype,
        hp: formData.hp || editingCard.hp,
        artist: formData.artist || editingCard.artist,
        image: formData.imageUrl || editingCard.image
      }

      // Gérer les types (convertir la chaîne en tableau si nécessaire)
      if (formData.types) {
        updates.types = typeof formData.types === 'string'
          ? formData.types.split(',').map(t => t.trim()).filter(Boolean)
          : formData.types
        updates.typesFormatted = updates.types
      }

      // Gérer les sous-types
      if (formData.subtypes) {
        updates.subtypes = typeof formData.subtypes === 'string'
          ? formData.subtypes.split(',').map(t => t.trim()).filter(Boolean)
          : formData.subtypes
      }

      // Mettre à jour dans IndexedDB
      await IndexedDBService.updateDiscoveredCard(editingCard.id, updates)

      // Mettre à jour l'affichage local (forcer le rechargement)
      window.location.reload()

      setEditingCard(null)
      alert('✅ Carte mise à jour avec succès!')
    } catch (error) {
      console.error('❌ Erreur sauvegarde carte:', error)
      alert('❌ Erreur lors de la sauvegarde de la carte: ' + error.message)
    }
  }

  // Note: Le filtrage est maintenant géré par getFilteredData() selon la vue actuelle

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Database className="h-8 w-8 text-primary animate-pulse" />
          <h1 className="text-3xl font-bold">Éditeur de Base de Données</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground">Chargement des données...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className="h-8 w-8 text-primary" />
          <div>
            <div className="flex items-center gap-2 mb-1">
              {mainTab === 'cards' && navigationPath.length > 0 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={currentView === 'extensions' ? handleBackToBlocks : handleBackToExtensions}
                  >
                    <ChevronRight className="h-4 w-4 rotate-180" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {navigationPath.map((item, index) => (
                      <span key={index}>{item.name} /</span>
                    ))}
                  </span>
                </>
              )}
            </div>
            <h1 className="text-3xl font-bold">
              Éditeur de Base de Données
            </h1>
            <p className="text-muted-foreground">
              {mainTab === 'cards' && 'Gérez vos blocs, extensions et cartes personnalisés'}
              {mainTab === 'sealed-products' && 'Gérez votre collection de produits scellés'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {mainTab === 'cards' && (
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              {currentView === 'blocks' && 'Nouveau Bloc'}
              {currentView === 'extensions' && 'Nouvelle Extension'}
              {currentView === 'cards' && 'Nouvelle Carte'}
            </Button>
          )}
        </div>
      </div>

      {/* Onglets principaux */}
      <div className="flex gap-2 border-b">
        <Button
          variant={mainTab === 'cards' ? 'default' : 'ghost'}
          onClick={() => setMainTab('cards')}
          className="rounded-b-none"
        >
          <Database className="h-4 w-4 mr-2" />
          Cartes
        </Button>
        <Button
          variant={mainTab === 'sealed-products' ? 'default' : 'ghost'}
          onClick={() => setMainTab('sealed-products')}
          className="rounded-b-none"
        >
          <Package className="h-4 w-4 mr-2" />
          Produits Scellés
        </Button>
      </div>

      {/* Affichage selon l'onglet sélectionné */}
      {mainTab === 'sealed-products' ? (
        <SealedProductsManager />
      {/* Import automatique d'extensions */}
      <SetImportPanel />
      ) : (
        <>
          {/* Migration des données IndexedDB → Backend */}
          <DataMigration />

      {/* Sauvegarde de la base de données */}
      <DatabaseBackup />

      {/* Migration des prix depuis l'API Pokemon TCG */}
      <PriceMigrationPanel />
      {/* Actualisation automatique quotidienne des prix */}
      <PriceRefreshPanel />
      {/* Migration des attaques depuis l'API Pokemon TCG */}
      <AttacksMigrationPanel />
      {/* Debug des liens CardMarket */}
      <CardMarketBulkHelper />

      {/* Debug des liens CardMarket */}
      <CardMarketDebugPanel />

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cartes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{discoveredCards?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Extensions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{seriesDatabase?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocs Personnalisés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customBlocks?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Extensions Déplacées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customExtensions?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Vue Blocs */}
      {currentView === 'blocks' && (
        <>
          {/* Barre de recherche */}
          <Card>
            <CardHeader>
              <CardTitle>Rechercher</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un bloc..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardContent>
          </Card>

          {/* Liste des blocs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Blocs ({getFilteredData().length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {getFilteredData().length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Aucun bloc trouvé</h3>
                  <p className="text-muted-foreground">
                    {searchQuery ? 'Aucun bloc ne correspond à votre recherche.' : 'Aucun bloc disponible.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {getFilteredData().map((block) => (
                    <div
                      key={block.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {block.image ? (
                          <img
                            src={block.image}
                            alt={block.name}
                            className="w-12 h-12 object-contain rounded"
                          />
                        ) : (
                          <Package className="h-12 w-12 text-muted-foreground" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{block.name}</h3>
                            <Badge variant={block.type === 'custom' ? 'default' : 'secondary'}>
                              {block.type === 'custom' ? 'Personnalisé' : 'Généré'}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {block.totalExtensions || block.extensions?.length || 0} extensions • {block.totalCards || 0} cartes
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditBlock(block)
                          }}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleBlockClick(block)
                          }}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteBlock(block)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Vue Extensions */}
      {currentView === 'extensions' && selectedBlock && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Extensions de {selectedBlock.name} ({selectedBlock.extensions?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedBlock.extensions || selectedBlock.extensions.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Aucune extension</h3>
                <p className="text-muted-foreground">Ce bloc ne contient aucune extension.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedBlock.extensions.map((extension) => (
                  <div
                    key={extension.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {extension.image ? (
                        <img
                          src={extension.image}
                          alt={extension.name}
                          className="w-12 h-12 object-contain rounded"
                        />
                      ) : (
                        <Package className="h-12 w-12 text-muted-foreground" />
                      )}
                      <div>
                        <h3 className="font-semibold">{extension.name}</h3>
                        <div className="text-sm text-muted-foreground">
                          {extension.cardsCount || 0} cartes • {extension.releaseDate}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditExtension(extension)
                        }}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleExtensionClick(extension)
                        }}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteExtension(extension)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Vue Cartes */}
      {currentView === 'cards' && selectedExtension && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Cartes de {selectedExtension.name} ({getFilteredData().length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getFilteredData().length === 0 ? (
              <div className="text-center py-8">
                <Database className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Aucune carte trouvée</h3>
                <p className="text-muted-foreground">
                  Cette extension ne contient aucune carte dans la base de données locale.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {getFilteredData().map((card, cardIndex) => (
                  <Card
                    key={`card-${card.id || cardIndex}`}
                    className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => {
                      setPreviewCard(card)
                      setShowPreviewModal(true)
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="aspect-[3/4] mb-3 bg-muted rounded-lg overflow-hidden">
                        {card.images?.small || card.image ? (
                          <img
                            src={card.images?.small || card.image}
                            alt={card.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none'
                              e.target.nextSibling.style.display = 'flex'
                            }}
                          />
                        ) : null}
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground" style={{ display: card.images?.small || card.image ? 'none' : 'flex' }}>
                          <Database className="w-8 h-8" />
                        </div>
                      </div>
                      <h4 className="font-semibold text-sm mb-1 truncate">{card.name}</h4>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex justify-between">
                          <span>Rareté:</span>
                          <span className="font-medium">{card.rarity || 'Non définie'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Numéro:</span>
                          <span className="font-medium">{card.number || 'N/A'}</span>
                        </div>
                        {card.subtypes && (
                          <div className="flex justify-between">
                            <span>Type:</span>
                            <span className="font-medium">{card.subtypes.join(', ')}</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleEditCard(card)}
                        >
                          <Edit3 className="h-3 w-3 mr-1" />
                          Éditer
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCard(card)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modale d'édition de bloc */}
      {editingBlock && (
        <Dialog open={!!editingBlock} onOpenChange={() => setEditingBlock(null)}>
          <DialogContent className="golden-border bg-background max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="golden-glow">
                Éditer le bloc "{editingBlock.name}"
              </DialogTitle>
              <DialogDescription>
                Modifiez les propriétés du bloc personnalisé.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Nom du bloc */}
              <div>
                <Label htmlFor="block-name">Nom du bloc</Label>
                <Input
                  id="block-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nom du bloc"
                  className="golden-border"
                />
              </div>

              {/* Dates et statistiques */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="block-year">Année début</Label>
                  <Input
                    id="block-year"
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                    className="golden-border"
                  />
                </div>
                <div>
                  <Label htmlFor="block-end-year">Année fin (optionnel)</Label>
                  <Input
                    id="block-end-year"
                    type="number"
                    placeholder="Année de fin"
                    value={formData.endYear}
                    onChange={(e) => setFormData(prev => ({ ...prev, endYear: e.target.value }))}
                    className="golden-border"
                  />
                </div>
                <div>
                  <Label htmlFor="block-cards">Total cartes</Label>
                  <Input
                    id="block-cards"
                    type="number"
                    value={formData.totalCards}
                    onChange={(e) => setFormData(prev => ({ ...prev, totalCards: parseInt(e.target.value) }))}
                    className="golden-border"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="block-description">Description</Label>
                <Input
                  id="block-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description du bloc"
                  className="golden-border"
                />
              </div>

              {/* Upload d'image */}
              <div>
                <Label>Image du bloc</Label>
                <ImageUpload
                  entityType="block"
                  entityId={editingBlock.id}
                  entityName={editingBlock.name}
                  currentImageUrl={formData.imageUrl}
                  onImageUploaded={(imageUrl) => setFormData(prev => ({ ...prev, imageUrl }))}
                  onImageSelected={(imageUrl) => setFormData(prev => ({ ...prev, imageUrl }))}
                />
              </div>

              {/* URL d'image alternative */}
              <div>
                <Label htmlFor="block-image-url">URL d'image (alternative)</Label>
                <Input
                  id="block-image-url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                  className="golden-border"
                />
              </div>

              {/* Extensions du bloc */}
              <div>
                <Label>Extensions ({formData.extensions.length})</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.extensions.map((ext, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {ext}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingBlock(null)}>
                  Annuler
                </Button>
                <Button onClick={handleSaveEdit}>
                  Sauvegarder
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modale d'édition d'extension */}
      {editingExtension && (
        <Dialog open={!!editingExtension} onOpenChange={() => setEditingExtension(null)}>
          <DialogContent className="golden-border bg-background max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="golden-glow">
                Éditer l'extension "{editingExtension.name}"
              </DialogTitle>
              <DialogDescription>
                Modifiez les propriétés de l'extension ou déplacez-la vers un autre bloc.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Nom de l'extension */}
              <div>
                <Label htmlFor="extension-name">Nom de l'extension</Label>
                <Input
                  id="extension-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nom de l'extension"
                  className="golden-border"
                />
              </div>

              {/* Date de sortie et statistiques */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="extension-release-date">Date de sortie</Label>
                  <Input
                    id="extension-release-date"
                    type="date"
                    value={formData.releaseDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, releaseDate: e.target.value }))}
                    className="golden-border"
                  />
                </div>
                <div>
                  <Label htmlFor="extension-cards">Nombre de cartes</Label>
                  <Input
                    id="extension-cards"
                    type="number"
                    value={formData.totalCards}
                    onChange={(e) => setFormData(prev => ({ ...prev, totalCards: parseInt(e.target.value) }))}
                    className="golden-border"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="extension-description">Description</Label>
                <Input
                  id="extension-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description de l'extension"
                  className="golden-border"
                />
              </div>

              {/* Upload d'image */}
              <div>
                <Label>Image de l'extension</Label>
                <ImageUpload
                  entityType="extension"
                  entityId={editingExtension.id}
                  entityName={editingExtension.name}
                  currentImageUrl={formData.imageUrl}
                  onImageUploaded={(imageUrl) => setFormData(prev => ({ ...prev, imageUrl }))}
                  onImageSelected={(imageUrl) => setFormData(prev => ({ ...prev, imageUrl }))}
                />
              </div>

              {/* URL d'image alternative */}
              <div>
                <Label htmlFor="extension-image-url">URL d'image (alternative)</Label>
                <Input
                  id="extension-image-url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                  className="golden-border"
                />
              </div>

              {/* Déplacement vers un autre bloc */}
              <div className="border-t border-border/50 pt-4">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-500 mb-2 flex items-center">
                    <Package className="w-4 h-4 mr-2" />
                    Déplacer vers un autre bloc
                  </h4>
                  <p className="text-xs text-muted-foreground mb-3">
                    Sélectionnez un bloc de destination pour déplacer cette extension.
                  </p>
                  <div className="flex gap-2">
                    <Select
                      value={formData.targetBlockId}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, targetBlockId: value }))}
                    >
                      <SelectTrigger className="golden-border">
                        <SelectValue placeholder="Choisir un bloc de destination" />
                      </SelectTrigger>
                      <SelectContent>
                        {blocksData
                          .filter(block => block.id !== selectedBlock?.id)
                          .map((block) => (
                            <SelectItem key={block.id} value={block.id}>
                              {block.name} ({block.totalExtensions || 0} extensions)
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {formData.targetBlockId && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (window.confirm(`Déplacer "${editingExtension.name}" vers le bloc "${blocksData.find(b => b.id === formData.targetBlockId)?.name}" ?\n\nCette action sera instantanée.`)) {
                            handleMoveExtensionImmediate(formData.targetBlockId)
                          }
                        }}
                      >
                        Déplacer
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingExtension(null)}>
                  Annuler
                </Button>
                <Button onClick={handleSaveEdit}>
                  Sauvegarder
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modale d'édition de carte */}
      {editingCard && (
        <Dialog open={!!editingCard} onOpenChange={() => setEditingCard(null)}>
          <DialogContent className="golden-border bg-background max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="golden-glow">
                {editingCard.id?.startsWith('custom-card-') ? 'Créer une nouvelle carte' : `Éditer la carte "${editingCard.name}"`}
              </DialogTitle>
              <DialogDescription>
                Modifiez les propriétés de la carte ci-dessous.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Nom de la carte */}
              <div>
                <Label htmlFor="card-name">Nom de la carte</Label>
                <Input
                  id="card-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nom de la carte"
                  className="golden-border"
                />
              </div>

              {/* Numéro et Rareté */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="card-number">Numéro</Label>
                  <Input
                    id="card-number"
                    value={formData.number}
                    onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
                    placeholder="ex: 001/197"
                    className="golden-border"
                  />
                </div>
                <div>
                  <Label htmlFor="card-rarity">Rareté</Label>
                  <Select
                    value={formData.rarity}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, rarity: value }))}
                  >
                    <SelectTrigger className="golden-border">
                      <SelectValue placeholder="Sélectionner une rareté" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Common">Commune</SelectItem>
                      <SelectItem value="Uncommon">Peu commune</SelectItem>
                      <SelectItem value="Rare">Rare</SelectItem>
                      <SelectItem value="Rare Holo">Rare Holo</SelectItem>
                      <SelectItem value="Rare Ultra">Ultra Rare</SelectItem>
                      <SelectItem value="Rare Secret">Secret Rare</SelectItem>
                      <SelectItem value="Promo">Promo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Type et Sous-types */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="card-supertype">Type principal</Label>
                  <Select
                    value={formData.supertype}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, supertype: value }))}
                  >
                    <SelectTrigger className="golden-border">
                      <SelectValue placeholder="Type principal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pokémon">Pokémon</SelectItem>
                      <SelectItem value="Trainer">Dresseur</SelectItem>
                      <SelectItem value="Energy">Énergie</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="card-hp">Points de Vie (HP)</Label>
                  <Input
                    id="card-hp"
                    value={formData.hp}
                    onChange={(e) => setFormData(prev => ({ ...prev, hp: e.target.value }))}
                    placeholder="ex: 120"
                    className="golden-border"
                  />
                </div>
              </div>

              {/* Types d'énergie */}
              <div>
                <Label htmlFor="card-types">Types d'énergie (séparés par des virgules)</Label>
                <Input
                  id="card-types"
                  value={formData.types}
                  onChange={(e) => setFormData(prev => ({ ...prev, types: e.target.value }))}
                  placeholder="ex: Fire, Electric"
                  className="golden-border"
                />
              </div>

              {/* Sous-types */}
              <div>
                <Label htmlFor="card-subtypes">Sous-types (séparés par des virgules)</Label>
                <Input
                  id="card-subtypes"
                  value={formData.subtypes}
                  onChange={(e) => setFormData(prev => ({ ...prev, subtypes: e.target.value }))}
                  placeholder="ex: Stage 1, Evolution"
                  className="golden-border"
                />
              </div>

              {/* Image URL */}
              <div>
                <Label htmlFor="card-image">URL de l'image</Label>
                <Input
                  id="card-image"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                  placeholder="https://..."
                  className="golden-border"
                />
                {formData.imageUrl && (
                  <div className="mt-2">
                    <img
                      src={formData.imageUrl}
                      alt="Aperçu"
                      className="w-32 h-auto rounded border border-primary/20"
                      onError={(e) => {
                        e.target.style.display = 'none'
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditingCard(null)}>
                  Annuler
                </Button>
                <Button onClick={handleSaveCardEdit}>
                  Sauvegarder
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modale d'aperçu de carte en grand */}
      {previewCard && (
        <CardPreviewModal
          isOpen={showPreviewModal}
          onClose={() => {
            setShowPreviewModal(false)
            setPreviewCard(null)
          }}
          card={previewCard}
        />
      )}
    </>
  )}
    </div>
  )
}