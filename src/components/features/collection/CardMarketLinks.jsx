import { useState } from 'react'
import { ExternalLink, Zap } from 'lucide-react'
import { CardMarketDynamicLinkService } from '@/services/CardMarketDynamicLinkService'

/**
 * Composant pour afficher les liens marketplace
 * CardMarket (EUR) via cache Supabase + TCGPlayer (USD)
 */
export function CardMarketLink({ card, showTCGPlayer = true }) {
  const [isLoading, setIsLoading] = useState(false)

  if (!card) return null

  // TCGPlayer URL (fallback rapide)
  const tcgPlayerUrl = `https://www.tcgplayer.com/search/pokemon/product?productLineName=pokemon&q=${encodeURIComponent(card.name + ' ' + (card.set?.name || card.extension || ''))}&page=1`

  const handleCardMarketClick = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Récupérer le lien depuis Supabase (cache) ou RapidAPI
      const dynamicUrl = await CardMarketDynamicLinkService.getCardLink(card)

      // Rediriger immédiatement
      window.open(dynamicUrl, '_blank', 'noopener,noreferrer')

      console.log(`🔗 Redirection vers: ${dynamicUrl}`)
    } catch (error) {
      console.error('❌ Erreur récupération lien CardMarket:', error)

      // Fallback: URL de recherche
      const searchTerms = [card.name, card.number, card.set?.name].filter(Boolean).join(' ')
      const fallbackUrl = `https://www.cardmarket.com/fr/Pokemon/Products/Search?searchString=${encodeURIComponent(searchTerms)}&language=2`
      window.open(fallbackUrl, '_blank', 'noopener,noreferrer')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {/* CardMarket - Prix EUR */}
        <button
          onClick={handleCardMarketClick}
          disabled={isLoading}
          className="inline-flex items-center gap-1 text-blue-500 hover:text-blue-600 hover:underline transition-colors text-sm cursor-pointer bg-transparent border-none p-0 disabled:opacity-50"
          title="CardMarket EUR - Lien direct depuis cache"
        >
          <ExternalLink className="w-4 h-4" />
          {isLoading ? 'Chargement...' : 'CardMarket (EUR)'}
        </button>

        {/* TCGPlayer - Alternative rapide en USD */}
        {showTCGPlayer && (
          <a
            href={tcgPlayerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-purple-500 hover:text-purple-600 hover:underline transition-colors text-sm group"
            title="TCGPlayer USD - Chargement instantané"
          >
            <ExternalLink className="w-4 h-4" />
            TCGPlayer (USD)
            <Zap className="w-3 h-3 text-green-400" title="Instantané !" />
          </a>
        )}
      </div>
    </div>
  )
}
