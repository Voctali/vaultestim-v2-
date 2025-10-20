import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useCardDatabase } from '@/hooks/useCardDatabase.jsx'
import { buildCardMarketUrl, getCardMarketSearchString } from '@/utils/cardMarketUrlBuilder'
import { Search, ExternalLink, Copy, Zap, AlertCircle, Download, Filter } from 'lucide-react'

export function CardMarketDebugPanel() {
  const { discoveredCards } = useCardDatabase()
  const [filter, setFilter] = useState('all') // 'all' | 'direct' | 'search' | 'no-price'
  const [searchQuery, setSearchQuery] = useState('')
  const [copied, setCopied] = useState(null)

  // Analyser toutes les cartes
  const analysis = useMemo(() => {
    const total = discoveredCards.length
    const withDirectLink = discoveredCards.filter(card => card.cardmarket?.url).length
    const withSearchOnly = total - withDirectLink
    const withoutPrice = discoveredCards.filter(card => !card.cardmarket && !card.tcgplayer).length

    const cardsWithInfo = discoveredCards.map(card => {
      const hasDirectLink = !!card.cardmarket?.url
      const url = buildCardMarketUrl(card, 'auto')
      const searchString = getCardMarketSearchString(card)
      const hasPrice = !!(card.cardmarket || card.tcgplayer)

      return {
        id: card.id,
        name: card.name,
        set: card.set?.name || 'Unknown',
        number: card.number || 'N/A',
        hasDirectLink,
        url,
        searchString,
        hasPrice,
        cardmarketData: card.cardmarket,
        tcgplayerData: card.tcgplayer
      }
    })

    return {
      total,
      withDirectLink,
      withSearchOnly,
      withoutPrice,
      percentDirect: total > 0 ? Math.round((withDirectLink / total) * 100) : 0,
      percentSearch: total > 0 ? Math.round((withSearchOnly / total) * 100) : 0,
      percentNoPrice: total > 0 ? Math.round((withoutPrice / total) * 100) : 0,
      cards: cardsWithInfo
    }
  }, [discoveredCards])

  // Filtrer les cartes
  const filteredCards = useMemo(() => {
    let cards = analysis.cards

    // Filtre par type de lien
    if (filter === 'direct') {
      cards = cards.filter(c => c.hasDirectLink)
    } else if (filter === 'search') {
      cards = cards.filter(c => !c.hasDirectLink && c.hasPrice)
    } else if (filter === 'no-price') {
      cards = cards.filter(c => !c.hasPrice)
    }

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      cards = cards.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.set.toLowerCase().includes(query) ||
        c.number.toLowerCase().includes(query)
      )
    }

    return cards
  }, [analysis.cards, filter, searchQuery])

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleExportCSV = () => {
    const csv = [
      ['Nom', 'Extension', 'Numéro', 'Type de lien', 'URL', 'String de recherche'].join(','),
      ...filteredCards.map(card => [
        `"${card.name}"`,
        `"${card.set}"`,
        card.number,
        card.hasDirectLink ? 'Direct' : (card.hasPrice ? 'Recherche' : 'Sans prix'),
        `"${card.url}"`,
        `"${card.searchString}"`
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cardmarket-links-${filter}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <Card className="golden-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5" />
          Debug CardMarket URLs
        </CardTitle>
        <CardDescription>
          Analysez les liens CardMarket de vos cartes pour identifier les problèmes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Statistiques globales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="text-sm text-blue-400 mb-1">Total cartes</div>
            <div className="text-2xl font-bold text-blue-400">{analysis.total.toLocaleString()}</div>
          </div>
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div className="text-sm text-green-400 mb-1 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Liens directs
            </div>
            <div className="text-2xl font-bold text-green-400">{analysis.withDirectLink.toLocaleString()}</div>
            <div className="text-xs text-green-400/70">{analysis.percentDirect}% (rapides)</div>
          </div>
          <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
            <div className="text-sm text-orange-400 mb-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Recherches
            </div>
            <div className="text-2xl font-bold text-orange-400">{analysis.withSearchOnly.toLocaleString()}</div>
            <div className="text-xs text-orange-400/70">{analysis.percentSearch}% (10-15s)</div>
          </div>
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="text-sm text-red-400 mb-1">Sans prix</div>
            <div className="text-2xl font-bold text-red-400">{analysis.withoutPrice.toLocaleString()}</div>
            <div className="text-xs text-red-400/70">{analysis.percentNoPrice}%</div>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
              className={filter === 'all' ? 'bg-blue-500' : ''}
            >
              <Filter className="w-3 h-3 mr-1" />
              Toutes ({analysis.total})
            </Button>
            <Button
              variant={filter === 'direct' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('direct')}
              className={filter === 'direct' ? 'bg-green-500' : ''}
            >
              <Zap className="w-3 h-3 mr-1" />
              Directs ({analysis.withDirectLink})
            </Button>
            <Button
              variant={filter === 'search' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('search')}
              className={filter === 'search' ? 'bg-orange-500' : ''}
            >
              <AlertCircle className="w-3 h-3 mr-1" />
              Recherches ({analysis.withSearchOnly})
            </Button>
            <Button
              variant={filter === 'no-price' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('no-price')}
              className={filter === 'no-price' ? 'bg-red-500' : ''}
            >
              Sans prix ({analysis.withoutPrice})
            </Button>
          </div>

          <Input
            type="text"
            placeholder="Rechercher une carte..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={filteredCards.length === 0}
          >
            <Download className="w-3 h-3 mr-1" />
            Export CSV
          </Button>
        </div>

        {/* Informations sur le filtre actuel */}
        <div className="text-sm text-muted-foreground">
          {filteredCards.length} carte(s) affichée(s)
          {filter === 'direct' && ' avec lien direct (⚡ rapide ~2-3s)'}
          {filter === 'search' && ' avec recherche seulement (⚠️ moyen ~10-15s)'}
          {filter === 'no-price' && ' sans prix disponible'}
        </div>

        {/* Liste des cartes */}
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 sticky top-0">
                <tr className="border-b border-border">
                  <th className="text-left p-2 font-semibold">Carte</th>
                  <th className="text-left p-2 font-semibold">Extension</th>
                  <th className="text-center p-2 font-semibold">#</th>
                  <th className="text-center p-2 font-semibold">Type</th>
                  <th className="text-left p-2 font-semibold">String de recherche</th>
                  <th className="text-center p-2 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCards.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center p-8 text-muted-foreground">
                      Aucune carte trouvée avec ce filtre
                    </td>
                  </tr>
                ) : (
                  filteredCards.map((card) => (
                    <tr key={card.id} className="border-b border-border hover:bg-muted/30">
                      <td className="p-2">
                        <div className="font-medium">{card.name}</div>
                      </td>
                      <td className="p-2 text-muted-foreground">{card.set}</td>
                      <td className="p-2 text-center">
                        <Badge variant="outline" className="text-xs">{card.number}</Badge>
                      </td>
                      <td className="p-2 text-center">
                        {card.hasDirectLink ? (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            <Zap className="w-3 h-3 mr-1" />
                            Direct
                          </Badge>
                        ) : card.hasPrice ? (
                          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Recherche
                          </Badge>
                        ) : (
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                            Sans prix
                          </Badge>
                        )}
                      </td>
                      <td className="p-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {card.searchString}
                        </code>
                      </td>
                      <td className="p-2">
                        <div className="flex items-center justify-center gap-1">
                          <a
                            href={card.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-500"
                            title={`Ouvrir sur CardMarket (${card.hasDirectLink ? 'rapide' : '10-15s'})`}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleCopy(card.searchString, card.id)}
                            title="Copier la string de recherche"
                          >
                            {copied === card.id ? (
                              <span className="text-green-400 text-xs">✓</span>
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Légende et conseils */}
        <div className="space-y-2 text-xs text-muted-foreground border-t border-border pt-4">
          <div className="font-semibold text-foreground mb-2">💡 Conseils d'utilisation :</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="flex items-start gap-2">
              <Zap className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <strong className="text-green-400">Liens directs (⚡)</strong> : Chargent en 2-3 secondes. Ce sont les meilleurs !
              </div>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
              <div>
                <strong className="text-orange-400">Recherches (⚠️)</strong> : Prennent 10-15 secondes. Utilisez le bouton "Copier" pour rechercher manuellement.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Copy className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <strong className="text-blue-400">Bouton Copier</strong> : Copie le nom optimisé pour coller dans la recherche CardMarket manuelle.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Download className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
              <div>
                <strong className="text-purple-400">Export CSV</strong> : Exporte la liste filtrée pour analyse externe ou partage.
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
