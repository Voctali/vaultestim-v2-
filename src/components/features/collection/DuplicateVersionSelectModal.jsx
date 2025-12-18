import { useState, useMemo, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CardImage } from '@/components/features/explore/CardImage'
import { CardMarketLink } from '@/components/features/collection/CardMarketLinks'
import { translateCardName } from '@/utils/cardTranslations'
import { translateCardType } from '@/utils/typeTranslations'
import { translateCondition } from '@/utils/cardConditions'
import { X, Plus, Check, Package, Trash2 } from 'lucide-react'

/**
 * Modale combinée pour :
 * - Afficher les détails d'une carte en double
 * - Sélectionner la version à ajouter au lot
 * - Choisir la quantité
 * - Gérer plusieurs versions sélectionnées pour la même carte
 */
export function DuplicateVersionSelectModal({
  isOpen,
  onClose,
  card,
  collection,
  onSelectForBatch,
  onRemoveVersionFromBatch, // Nouvelle prop pour retirer une version spécifique
  selectedVersions = [] // Array de { version, quantity } déjà sélectionnées pour cette carte
}) {
  const [selectedVersion, setSelectedVersion] = useState(null)
  const [selectedQuantity, setSelectedQuantity] = useState(1)

  // Récupérer toutes les instances de cette carte dans la collection
  const allCardInstances = useMemo(() => {
    if (!card || !collection) return []
    return collection.filter(c =>
      c.card_id === card.card_id || c.card_id === card.id
    )
  }, [card, collection])

  // Grouper par version et calculer les doublons disponibles
  const duplicateVersions = useMemo(() => {
    const versionGroups = {}

    allCardInstances.forEach(instance => {
      const version = instance.version || 'Normale'
      const quantity = instance.quantity || 1

      if (!versionGroups[version]) {
        versionGroups[version] = {
          version,
          instances: [],
          totalQuantity: 0
        }
      }

      versionGroups[version].instances.push(instance)
      versionGroups[version].totalQuantity += quantity
    })

    // Filtrer pour ne garder que les versions avec doublons (quantité > 1)
    // Et calculer le nombre de doublons disponibles (total - 1)
    return Object.values(versionGroups)
      .filter(data => data.totalQuantity > 1)
      .map(data => ({
        ...data,
        duplicateCount: data.totalQuantity - 1
      }))
      .sort((a, b) => a.version.localeCompare(b.version))
  }, [allCardInstances])

  // Vérifier si une version est déjà sélectionnée
  const isVersionAlreadySelected = (version) => {
    return selectedVersions.some(sv => sv.version === version)
  }

  // Obtenir les versions disponibles (non encore sélectionnées ou avec des doublons restants)
  const availableVersions = useMemo(() => {
    return duplicateVersions.filter(vd => {
      const alreadySelected = selectedVersions.find(sv => sv.version === vd.version)
      if (!alreadySelected) return true
      // Si déjà sélectionné, vérifier s'il reste des doublons disponibles
      return vd.duplicateCount > alreadySelected.quantity
    })
  }, [duplicateVersions, selectedVersions])

  // Initialiser la sélection quand la modale s'ouvre
  useEffect(() => {
    if (isOpen && duplicateVersions.length > 0) {
      // Priorité 1: Version PAS DU TOUT sélectionnée (pour permettre d'ajouter facilement une nouvelle version)
      const notSelectedAtAll = duplicateVersions.find(vd =>
        !selectedVersions.some(sv => sv.version === vd.version)
      )

      if (notSelectedAtAll) {
        setSelectedVersion(notSelectedAtAll.version)
        setSelectedQuantity(1)
      } else {
        // Priorité 2: Version avec des doublons restants
        const withRemaining = availableVersions[0]
        if (withRemaining) {
          setSelectedVersion(withRemaining.version)
          setSelectedQuantity(1)
        } else if (duplicateVersions.length > 0) {
          // Toutes les versions sont sélectionnées au max, on affiche la première
          setSelectedVersion(duplicateVersions[0].version)
          setSelectedQuantity(1)
        }
      }
    }
  }, [isOpen, duplicateVersions, availableVersions, selectedVersions])

  // Obtenir le max de quantité pour la version sélectionnée (en tenant compte de ce qui est déjà sélectionné)
  const maxQuantity = useMemo(() => {
    const versionData = duplicateVersions.find(v => v.version === selectedVersion)
    if (!versionData) return 1
    const alreadySelected = selectedVersions.find(sv => sv.version === selectedVersion)
    const alreadySelectedQty = alreadySelected?.quantity || 0
    return Math.max(1, versionData.duplicateCount - alreadySelectedQty)
  }, [duplicateVersions, selectedVersion, selectedVersions])

  // Calculer le total de doublons
  const totalDuplicates = useMemo(() => {
    return duplicateVersions.reduce((sum, data) => sum + data.duplicateCount, 0)
  }, [duplicateVersions])

  const handleVersionChange = (version) => {
    setSelectedVersion(version)
    setSelectedQuantity(1) // Reset quantité quand on change de version
  }

  const handleQuantityChange = (value) => {
    const qty = parseInt(value) || 1
    setSelectedQuantity(Math.max(1, Math.min(qty, maxQuantity)))
  }

  const handleAddToBatch = () => {
    if (!selectedVersion || !card) return

    // Trouver une instance de cette version pour obtenir toutes ses données
    const versionData = duplicateVersions.find(v => v.version === selectedVersion)
    const instanceForVersion = versionData?.instances[0]

    onSelectForBatch({
      card: {
        ...card,
        // Utiliser l'instance spécifique à cette version si disponible
        ...(instanceForVersion && {
          id: instanceForVersion.id,
          condition: instanceForVersion.condition,
          language: instanceForVersion.language,
          value: instanceForVersion.value
        }),
        version: selectedVersion
      },
      version: selectedVersion,
      quantity: selectedQuantity
    })
    onClose()
  }

  const handleRemoveVersionFromBatch = (versionToRemove) => {
    if (onRemoveVersionFromBatch) {
      onRemoveVersionFromBatch(versionToRemove)
    }
  }

  const handleRemoveAllFromBatch = () => {
    onSelectForBatch(null) // null = désélectionner toutes les versions
    onClose()
  }

  if (!card) return null

  // Vérifier si la version actuellement sélectionnée est déjà dans la sélection
  const isCurrentVersionAlreadySelected = selectedVersion && selectedVersions.some(sv => sv.version === selectedVersion)

  // DEBUG temporaire
  console.log('[DEBUG Modal]', {
    selectedVersion,
    selectedVersions,
    isCurrentVersionAlreadySelected,
    duplicateVersions: duplicateVersions.map(v => v.version)
  })

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto golden-border bg-background">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="golden-glow">
                {selectedVersions.length > 0
                  ? (isCurrentVersionAlreadySelected ? 'Modifier la sélection' : 'Ajouter une version')
                  : 'Ajouter au lot'
                }
              </DialogTitle>
              <DialogDescription>
                {isCurrentVersionAlreadySelected
                  ? 'Modifier la quantité de cette version'
                  : 'Choisissez la version et la quantité à ajouter'
                }
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="hover:bg-accent"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Card Display */}
          <div className="space-y-4">
            <div className="relative aspect-[3/4] max-w-sm mx-auto">
              <div className="w-full h-full rounded-2xl overflow-hidden shadow-2xl golden-border">
                <CardImage
                  card={card}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Card Information + Selection */}
          <div className="space-y-6">
            {/* Card Basic Info */}
            <div className="space-y-3">
              <h1 className="text-2xl font-bold golden-glow">{translateCardName(card.name)}</h1>

              {/* Extension et Bloc */}
              <div className="space-y-1">
                <p className="text-muted-foreground">
                  {card.set?.name || card.extension || card.series || "Extension inconnue"}
                  {card.number && ` • #${card.number}`}
                </p>
                {card.set?.series && (
                  <p className="text-sm text-muted-foreground">
                    Bloc: {card.set.series}
                  </p>
                )}
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {card.rarity && <Badge variant="secondary">{card.rarity}</Badge>}
                {card.supertype && <Badge variant="outline">{card.supertype}</Badge>}
                {card.types && card.types.length > 0 && card.types.map((type, i) => (
                  <Badge key={`type-${i}-${type}`} variant="outline">{translateCardType(type)}</Badge>
                ))}
              </div>

              {/* Market Price */}
              <div className="text-sm pt-2">
                <span className="font-medium">Prix marché:</span>
                {card.marketPrice || card.value ? (
                  <span className="ml-2 font-bold text-green-500">{card.marketPrice || card.value}€</span>
                ) : (
                  <span className="ml-2 text-muted-foreground italic">Prix non disponible</span>
                )}
              </div>

              {/* Liens vers les marketplaces */}
              <div className="flex flex-wrap gap-3 text-sm pt-2">
                <CardMarketLink card={card} />
              </div>
            </div>

            {/* Section Sélection de Version */}
            <div className="border-t border-primary/20 pt-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold golden-glow">
                  <Package className="w-5 h-5 inline mr-2" />
                  Sélection pour le lot
                </h2>
                <Badge variant="secondary" className="bg-orange-500/20 text-orange-500">
                  {totalDuplicates} doublon{totalDuplicates > 1 ? 's' : ''} disponible{totalDuplicates > 1 ? 's' : ''}
                </Badge>
              </div>

              {/* Versions déjà sélectionnées */}
              {selectedVersions.length > 0 && (
                <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <Label className="text-sm font-medium text-green-500 mb-2 block">
                    Versions déjà dans le lot :
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedVersions.map((sv, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 bg-green-500/20 px-3 py-1.5 rounded-full"
                      >
                        <span className="text-sm font-medium">
                          {sv.quantity}x {sv.version}
                        </span>
                        <button
                          onClick={() => handleRemoveVersionFromBatch(sv.version)}
                          className="text-red-400 hover:text-red-500 transition-colors"
                          title={`Retirer ${sv.version} du lot`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {duplicateVersions.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  Aucun doublon disponible pour cette carte
                </p>
              ) : (
                <div className="space-y-4">
                  {/* Sélection de la version */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      {selectedVersions.length > 0 ? 'Ajouter une autre version' : 'Choisir une version'}
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      {duplicateVersions.map((versionData) => {
                        const alreadySelected = selectedVersions.find(sv => sv.version === versionData.version)
                        const alreadySelectedQty = alreadySelected?.quantity || 0
                        const remaining = versionData.duplicateCount - alreadySelectedQty
                        const isFullySelected = remaining <= 0

                        return (
                          <button
                            key={versionData.version}
                            onClick={() => !isFullySelected && handleVersionChange(versionData.version)}
                            disabled={isFullySelected}
                            className={`p-3 rounded-lg border-2 transition-all text-left ${
                              isFullySelected
                                ? 'border-gray-500/30 bg-gray-500/10 opacity-50 cursor-not-allowed'
                                : selectedVersion === versionData.version
                                  ? 'border-green-500 bg-green-500/10'
                                  : 'border-primary/20 hover:border-primary/40 bg-primary/5'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm">{versionData.version}</span>
                              {selectedVersion === versionData.version && !isFullySelected && (
                                <Check className="w-4 h-4 text-green-500" />
                              )}
                              {alreadySelected && (
                                <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-500">
                                  {alreadySelectedQty}x déjà
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {isFullySelected
                                ? 'Tous sélectionnés'
                                : `${remaining} disponible${remaining > 1 ? 's' : ''}`
                              }
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Sélection de la quantité */}
                  {selectedVersion && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Quantité (max: {maxQuantity})
                      </Label>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(selectedQuantity - 1)}
                          disabled={selectedQuantity <= 1}
                          className="w-10 h-10"
                        >
                          -
                        </Button>
                        <Input
                          type="number"
                          min="1"
                          max={maxQuantity}
                          value={selectedQuantity}
                          onChange={(e) => handleQuantityChange(e.target.value)}
                          className="w-20 text-center golden-border"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(selectedQuantity + 1)}
                          disabled={selectedQuantity >= maxQuantity}
                          className="w-10 h-10"
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Détails des instances par condition/langue */}
                  {selectedVersion && (
                    <div className="space-y-2 pt-2">
                      <Label className="text-xs text-muted-foreground">Détails des exemplaires</Label>
                      <div className="space-y-1">
                        {(() => {
                          const versionData = duplicateVersions.find(v => v.version === selectedVersion)
                          if (!versionData) return null

                          // Grouper par condition + langue
                          const groupedByCondition = {}
                          versionData.instances.forEach(instance => {
                            const condition = instance.condition || 'Non spécifié'
                            const language = instance.language || 'Français'
                            const key = `${condition}-${language}`

                            if (!groupedByCondition[key]) {
                              groupedByCondition[key] = {
                                condition,
                                language,
                                totalQuantity: 0,
                                value: instance.value
                              }
                            }
                            groupedByCondition[key].totalQuantity += (instance.quantity || 1)
                          })

                          return Object.values(groupedByCondition).map((group, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-xs bg-primary/5 rounded p-2 border border-primary/10"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{group.totalQuantity}x</span>
                                <span className="text-muted-foreground">
                                  {translateCondition(group.condition)}
                                </span>
                                {group.language !== 'Français' && (
                                  <span className="text-muted-foreground">• {group.language}</span>
                                )}
                              </div>
                              {group.value && (
                                <span className="text-green-500 font-medium">{group.value}€</span>
                              )}
                            </div>
                          ))
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-3 pt-4 border-t border-primary/20">
              {selectedVersions.length > 0 && (
                <Button
                  variant="outline"
                  onClick={handleRemoveAllFromBatch}
                  className="border-red-500/50 text-red-500 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Tout retirer
                </Button>
              )}
              <Button
                onClick={handleAddToBatch}
                disabled={!selectedVersion || duplicateVersions.length === 0 || maxQuantity <= 0}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isCurrentVersionAlreadySelected ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Modifier ({selectedQuantity}x {selectedVersion})
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter {selectedQuantity}x {selectedVersion}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
