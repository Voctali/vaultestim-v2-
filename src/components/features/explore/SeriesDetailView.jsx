import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CardSearchResults } from '@/components/features/explore/CardSearchResults'
import { TCGdxService } from '@/services/TCGdxService'
import { useCardDatabase } from '@/hooks/useCardDatabase'
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react'

export function SeriesDetailView({ series }) {
  const [expandedSets, setExpandedSets] = useState(new Set())
  const [seriesCards, setSeriesCards] = useState([])
  const [loading, setLoading] = useState(true)
  const { getCardsBySet } = useCardDatabase()

  // Charger les cartes de la série
  useEffect(() => {
    const loadSeriesCards = async () => {
      setLoading(true)
      try {
        console.log(`📦 Chargement des cartes pour la série ${series.name} (ID: ${series.id})`)
        const cards = await getCardsBySet(series.id)
        setSeriesCards(cards)
        console.log(`✅ ${cards.length} cartes chargées pour ${series.name}`)
      } catch (error) {
        console.error(`❌ Erreur lors du chargement des cartes:`, error)
        setSeriesCards([])
      } finally {
        setLoading(false)
      }
    }

    loadSeriesCards()
  }, [series.id, getCardsBySet])

  // Helper local pour organiser les cartes par extension
  const organizeCardsBySet = (cards) => {
    const setGroups = {}
    cards.forEach(card => {
      const setId = card.set?.id || 'unknown'
      const setName = card.set?.name || 'Inconnu'
      const series = card.set?.series || 'Série inconnue'
      if (!setGroups[setId]) {
        setGroups[setId] = {
          id: setId,
          name: setName,
          series,
          releaseDate: card.set?.releaseDate,
          cards: []
        }
      }
      setGroups[setId].cards.push(card)
    })

    // Trier les cartes de chaque extension par numéro (ordre croissant)
    Object.values(setGroups).forEach(group => {
      group.cards.sort((a, b) => {
        const numA = a.number || ''
        const numB = b.number || ''

        // Extraire la partie numérique du début
        const matchA = numA.match(/^(\d+)/)
        const matchB = numB.match(/^(\d+)/)

        // Si les deux ont un numéro, comparer numériquement
        if (matchA && matchB) {
          const intA = parseInt(matchA[1])
          const intB = parseInt(matchB[1])

          if (intA !== intB) {
            return intA - intB
          }
          // Si les nombres sont égaux, comparer alphabétiquement le reste
          return numA.localeCompare(numB)
        }

        // Si seul A a un numéro, A vient en premier
        if (matchA && !matchB) return -1

        // Si seul B a un numéro, B vient en premier
        if (!matchA && matchB) return 1

        // Si aucun n'a de numéro, comparer alphabétiquement
        return numA.localeCompare(numB)
      })
    })

    return Object.values(setGroups)
  }

  // Organiser les cartes par extension
  const cardsBySet = seriesCards.length > 0
    ? organizeCardsBySet(seriesCards)
    : []

  // Trier les extensions par date de sortie (plus récent en premier)
  const sortedSets = cardsBySet.sort((a, b) =>
    new Date(b.releaseDate || '1900-01-01') - new Date(a.releaseDate || '1900-01-01')
  )

  const toggleSetExpansion = (setId) => {
    setExpandedSets(prev => {
      const newSet = new Set(prev)
      if (newSet.has(setId)) {
        newSet.delete(setId)
      } else {
        newSet.add(setId)
      }
      return newSet
    })
  }

  const toggleAllSets = () => {
    if (expandedSets.size === sortedSets.length) {
      // Tout fermer
      setExpandedSets(new Set())
    } else {
      // Tout ouvrir
      setExpandedSets(new Set(sortedSets.map(set => set.id)))
    }
  }

  return (
    <div className="space-y-6">
      {/* Series Header */}
      <Card className="golden-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold golden-glow mb-2">{series.name}</h2>
              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                <span>Série: {series.series}</span>
                <span>Date: {series.releaseDate}</span>
                <span>{loading ? '...' : seriesCards.length} cartes chargées</span>
                <span>ID: {series.id}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleAllSets}
                className="border-primary/20"
              >
                {expandedSets.size === sortedSets.length ? 'Tout fermer' : 'Tout ouvrir'}
              </Button>
              <div className="w-48">
                <div className="w-full bg-secondary rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-primary to-yellow-400 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${series.progress || 0}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  {(series.progress || 0).toFixed ? (series.progress || 0).toFixed(1) : 0}% complété
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* État de chargement */}
      {loading && (
        <Card className="golden-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span>Chargement des cartes de la série...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Extensions List */}
      {!loading && (
        <div className="space-y-4">
          {sortedSets.length === 0 ? (
            <Card className="golden-border">
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">
                  <p>Aucune carte trouvée pour cette série.</p>
                  <p className="text-sm mt-2">Essayez de rechercher des cartes pour alimenter cette série.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            sortedSets.map((set) => {
          const isExpanded = expandedSets.has(set.id)
          const releaseYear = set.releaseDate ? new Date(set.releaseDate).getFullYear() : 'N/A'

          return (
            <Card key={set.id} className="golden-border">
              <CardContent className="p-0">
                {/* Set Header - Clickable */}
                <div
                  className="p-4 cursor-pointer hover:bg-accent/50 transition-colors border-b border-border/50"
                  onClick={() => toggleSetExpansion(set.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center text-muted-foreground">
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold golden-glow">
                          {set.name}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>{releaseYear}</span>
                          <span>{set.cards.length} cartes</span>
                          <Badge variant="secondary" className="text-xs">
                            {set.id}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">
                        Cliquez pour {isExpanded ? 'fermer' : 'voir les cartes'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cards Grid - Expandable */}
                {isExpanded && (
                  <div className="p-4 pt-0">
                    <CardSearchResults
                      cards={set.cards}
                      isLoading={false}
                      searchQuery={set.name}
                      showHeader={false}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )
            })
          )}
        </div>
      )}
    </div>
  )
}