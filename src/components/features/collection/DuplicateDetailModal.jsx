import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CardImage } from '@/components/features/explore/CardImage'
import { CardMarketLink } from '@/components/features/collection/CardMarketLinks'
import { translateCardName } from '@/utils/cardTranslations'
import { translateCardType } from '@/utils/typeTranslations'
import { translateCondition } from '@/utils/cardConditions'
import { X } from 'lucide-react'

/**
 * Modale de détails pour une carte en double
 * Affiche la carte en grand + section "Vos doublons" avec liste détaillée
 */
export function DuplicateDetailModal({ isOpen, onClose, card, collection }) {
  if (!card) return null

  // Récupérer toutes les instances de cette carte dans la collection
  const allCardInstances = collection.filter(c =>
    c.card_id === card.card_id || c.card_id === card.id
  )

  // Grouper par version et compter TOUTES les instances
  const versionGroups = {}

  allCardInstances.forEach(instance => {
    const version = instance.version || 'Normale'
    const quantity = instance.quantity || 1

    if (!versionGroups[version]) {
      versionGroups[version] = {
        instances: [],
        totalQuantity: 0
      }
    }

    versionGroups[version].instances.push(instance)
    versionGroups[version].totalQuantity += quantity
  })

  // Pour chaque version, garder uniquement les doublons (quantité totale - 1 exemplaire de collection)
  const actualDuplicates = Object.entries(versionGroups)
    .filter(([_, data]) => data.totalQuantity > 1) // Versions avec au moins 2 exemplaires
    .map(([version, data]) => {
      // Pour cette version, le nombre de doublons = quantité totale - 1
      const duplicateCount = data.totalQuantity - 1
      return [version, { ...data, duplicateCount }]
    })
    .sort(([versionA], [versionB]) => versionA.localeCompare(versionB))

  // Calculer le total de doublons (tous les exemplaires au-delà du premier pour chaque version)
  const totalDuplicates = actualDuplicates.reduce((sum, [_, data]) => sum + data.duplicateCount, 0)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto golden-border bg-background">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="golden-glow">
                Détails de la carte
              </DialogTitle>
              <DialogDescription>
                Informations complètes et doublons
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

          {/* Card Information */}
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

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm pt-4">
                {card.hp && (
                  <div>
                    <span className="font-medium">HP:</span> {card.hp}
                  </div>
                )}
                {card.artist && (
                  <div>
                    <span className="font-medium">Artiste:</span> {card.artist}
                  </div>
                )}
                {card.set?.releaseDate && (
                  <div>
                    <span className="font-medium">Date de sortie:</span>{' '}
                    {new Date(card.set.releaseDate).toLocaleDateString('fr-FR')}
                  </div>
                )}
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

            {/* Section Doublons */}
            <div className="border-t border-primary/20 pt-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold golden-glow">📦 Vos doublons</h2>
                <Badge variant="secondary" className="bg-orange-500/20 text-orange-500">
                  {totalDuplicates} doublon{totalDuplicates > 1 ? 's' : ''}
                </Badge>
              </div>

              {actualDuplicates.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  Aucun doublon pour cette carte
                </p>
              ) : (
                <div className="space-y-4">
                  {actualDuplicates.map(([version, data]) => (
                    <div key={version} className="space-y-2">
                      {/* Version header */}
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm golden-glow">
                          Version {version}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          {data.duplicateCount} en double
                        </Badge>
                      </div>

                      {/* Affichage : Total possédé vs en collection */}
                      <div className="text-xs text-muted-foreground pl-4 mb-2">
                        Total possédé: {data.totalQuantity} • En collection: 1 • En double: {data.duplicateCount}
                      </div>

                      {/* Liste des instances regroupées par condition et langue */}
                      <div className="space-y-2 pl-4">
                        {(() => {
                          // Grouper les instances par condition + langue
                          const groupedByCondition = {}

                          data.instances.forEach(instance => {
                            const condition = instance.condition || 'Non spécifié'
                            const language = instance.language || 'Français'
                            const key = `${condition}-${language}`

                            if (!groupedByCondition[key]) {
                              groupedByCondition[key] = {
                                condition,
                                language,
                                totalQuantity: 0,
                                values: []
                              }
                            }

                            const qty = instance.quantity || 1
                            groupedByCondition[key].totalQuantity += qty
                            if (instance.value) {
                              groupedByCondition[key].values.push(parseFloat(instance.value))
                            }
                          })

                          return Object.values(groupedByCondition).map((group, idx) => {
                            // Calculer le prix moyen si plusieurs valeurs
                            const avgValue = group.values.length > 0
                              ? (group.values.reduce((sum, v) => sum + v, 0) / group.values.length).toFixed(2)
                              : null

                            return (
                              <div
                                key={idx}
                                className="flex items-center justify-between text-xs bg-primary/5 rounded-lg p-2 border border-primary/10"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-primary">
                                      Quantité: {group.totalQuantity}x
                                    </span>
                                    <span className="text-muted-foreground">•</span>
                                    <span className="text-muted-foreground">
                                      {translateCondition(group.condition)}
                                    </span>
                                  </div>
                                  {group.language !== 'Français' && (
                                    <div className="text-muted-foreground">
                                      Langue: {group.language}
                                    </div>
                                  )}
                                </div>
                                {avgValue && (
                                  <div className="text-green-500 font-semibold">
                                    {avgValue}€ / unité
                                  </div>
                                )}
                              </div>
                            )
                          })
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Valeur totale des doublons */}
              {actualDuplicates.length > 0 && (
                <div className="mt-4 pt-4 border-t border-primary/20">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Valeur totale des doublons:</span>
                    <span className="text-lg font-bold text-green-500">
                      {actualDuplicates.reduce((sum, [_, data]) => {
                        // Pour chaque version, calculer la valeur des doublons (totalQuantity - 1)
                        const avgValue = data.instances.reduce((total, instance) => {
                          return total + (parseFloat(instance.value) || parseFloat(card.marketPrice) || 0)
                        }, 0) / data.instances.length

                        return sum + (data.duplicateCount * avgValue)
                      }, 0).toFixed(2)}€
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
