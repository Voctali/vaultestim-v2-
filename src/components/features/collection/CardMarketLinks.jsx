import { useState, useEffect } from 'react'
import { ExternalLink, Zap, AlertCircle, Sparkles } from 'lucide-react'
import { buildCardMarketUrl } from '@/utils/cardMarketUrlBuilder'
import { CardMarketSupabaseService } from '@/services/CardMarketSupabaseService'
import { CardMarketMatchingService } from '@/services/CardMarketMatchingService'
import { useAuth } from '@/hooks/useAuth'

/**
 * Composant pour afficher les liens marketplace optimisés
 * TCGPlayer (rapide) + CardMarket avec matching intelligent + bouton copier
 */
export function CardMarketLink({ card, showTCGPlayer = true }) {
  const [showWarning, setShowWarning] = useState(false)
  const [cardMarketMatch, setCardMarketMatch] = useState(null)
  const [isMatching, setIsMatching] = useState(false)
  const [matchingError, setMatchingError] = useState(null)
  const { user } = useAuth()

  // Charger le matching CardMarket au montage
  useEffect(() => {
    async function loadCardMarketMatch() {
      if (!user?.id || !card?.id) return

      try {
        const cardId = CardMarketMatchingService._generateCardId(card)
        const match = await CardMarketSupabaseService.getUserMatch(user.id, cardId)

        if (match) {
          setCardMarketMatch(match)
        }
      } catch (error) {
        console.error('❌ Erreur chargement matching CardMarket:', error)
      }
    }

    loadCardMarketMatch()
  }, [card?.id, user?.id])

  if (!card) return null

  // Déterminer l'URL et le type de lien
  let cardMarketUrl
  let isDirect = false
  let isMatchedDirect = false

  if (cardMarketMatch && cardMarketMatch.cardmarket_name && cardMarketMatch.match_score >= 0.5) {
    // Utiliser le matching Supabase avec le NOM de la carte CardMarket (plus fiable que l'ID pour les singles)
    // Recherche par nom exact entre guillemets pour éviter les résultats parasites
    // SEULEMENT si le score est suffisamment élevé (≥ 50%)
    const searchQuery = encodeURIComponent(`"${cardMarketMatch.cardmarket_name}"`)
    cardMarketUrl = `https://www.cardmarket.com/en/Pokemon/Products/Search?searchString=${searchQuery}&language=2`
    isDirect = true
    isMatchedDirect = true
  } else {
    // Fallback: recherche générique avec langue française
    // Note: On n'utilise JAMAIS card.cardmarket.url car ces liens de l'API sont souvent cassés ou lents
    const fallbackUrl = buildCardMarketUrl(card, 'auto')
    // Ajouter le paramètre language si pas déjà présent
    cardMarketUrl = fallbackUrl.includes('?')
      ? `${fallbackUrl}&language=2`
      : `${fallbackUrl}?language=2`
    isDirect = false
  }

  // TCGPlayer URL
  const tcgPlayerUrl = `https://www.tcgplayer.com/search/pokemon/product?productLineName=pokemon&q=${encodeURIComponent(card.name + ' ' + (card.set?.name || card.extension || ''))}&page=1`

  

  // Fonction de matching automatique
  const handleAutoMatch = async () => {
    if (!user?.id || isMatching) return

    setIsMatching(true)
    setMatchingError(null)

    try {
      const result = await CardMarketMatchingService.matchCard(card, user.id, true)

      if (result.match && result.score >= 0.2) {
        // Matching réussi (seuil à 20% pour tester), recharger
        const cardId = CardMarketMatchingService._generateCardId(card)
        const match = await CardMarketSupabaseService.getUserMatch(user.id, cardId)
        setCardMarketMatch(match)

        // Afficher un avertissement si score faible
        if (result.score < 0.5) {
          console.warn(`⚠️ Score de matching faible: ${(result.score * 100).toFixed(1)}% pour ${card.name}`)
          console.log('Top 5 candidats:', result.candidates.slice(0, 5).map(c => ({
            name: c.name,
            score: (c.matchScore * 100).toFixed(1) + '%'
          })))
        }
      } else {
        setMatchingError(`Aucun match trouvé avec un score suffisant (${(result.score * 100).toFixed(1)}%). Candidats trouvés: ${result.candidates?.length || 0}`)
      }
    } catch (error) {
      console.error('❌ Erreur matching:', error)
      setMatchingError(error.message)
    } finally {
      setIsMatching(false)
    }
  }

  const handleCardMarketClick = (e) => {
    // Afficher un avertissement si pas de lien direct
    if (!isDirect && !localStorage.getItem('cardmarket-search-warning-seen')) {
      setShowWarning(true)
      localStorage.setItem('cardmarket-search-warning-seen', 'true')

      // Cacher après 8 secondes
      setTimeout(() => setShowWarning(false), 8000)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {/* CardMarket - Prix EUR */}
        <a
          href={cardMarketUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleCardMarketClick}
          className="inline-flex items-center gap-1 text-blue-500 hover:text-blue-600 hover:underline transition-colors text-sm group"
          title={isMatchedDirect
            ? `CardMarket EUR - Lien direct vers ${card.name} #${card.number} (Match automatique: ${(cardMarketMatch.match_score * 100).toFixed(0)}%)`
            : isDirect
            ? `CardMarket EUR - Lien direct vers ${card.name} #${card.number} (API)`
            : `⚠️ RECHERCHE GÉNÉRIQUE - Affiche TOUTES les cartes "${card.name}"\nVous devrez trouver manuellement #${card.number} dans les résultats\n💡 Astuce: Cliquez sur "Trouver lien direct" ci-dessous`
          }
        >
          <ExternalLink className="w-4 h-4" />
          CardMarket (EUR)
          {isMatchedDirect ? (
            <Sparkles className="w-3 h-3 text-green-400" title={`Match auto (${(cardMarketMatch.match_score * 100).toFixed(0)}%)`} />
          ) : isDirect ? (
            <Zap className="w-3 h-3 text-green-400" title="Lien direct API" />
          ) : (
            <AlertCircle className="w-3 h-3 text-orange-400 opacity-50 group-hover:opacity-100" title="Recherche générique - Cliquez 'Trouver lien direct'" />
          )}
        </a>

        {/* Bouton matching automatique (si pas de lien direct) */}
        {!isDirect && user && (
          <button
            onClick={handleAutoMatch}
            disabled={isMatching}
            className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded text-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Utiliser l'IA pour trouver le lien direct CardMarket"
          >
            <Sparkles className="w-3 h-3" />
            {isMatching ? 'Recherche...' : 'Trouver lien direct'}
          </button>
        )}

        {/* TCGPlayer - Alternative rapide en USD */}
        {showTCGPlayer && (
          <a
            href={tcgPlayerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-purple-500 hover:text-purple-600 hover:underline transition-colors text-sm group"
            title="TCGPlayer USD - Chargement instantané (1-2s) - Alternative rapide si CardMarket trop lent"
          >
            <ExternalLink className="w-4 h-4" />
            TCGPlayer (USD)
            <Zap className="w-3 h-3 text-green-400" title="Instantané ! Alternative rapide" />
          </a>
        )}

        
      </div>

      {/* Message de succès ou erreur matching */}
      {matchingError && (
        <div className="p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-400 flex items-start gap-2">
          <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <div>
            <strong>Erreur matching :</strong> {matchingError}
          </div>
        </div>
      )}

      {isMatchedDirect && cardMarketMatch && (
        <div className="p-2 bg-green-500/10 border border-green-500/30 rounded text-xs text-green-400 flex items-start gap-2">
          <Sparkles className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <div>
            <strong>Lien direct trouvé !</strong> Match automatique avec {(cardMarketMatch.match_score * 100).toFixed(0)}% de confiance.
            Cette carte est maintenant liée directement à CardMarket.
          </div>
        </div>
      )}

      {/* Avertissement CardMarket recherche */}
      {showWarning && (
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs text-yellow-400 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <strong>⚠️ Recherche CardMarket (pas de lien direct) :</strong>
            <br />
            <div className="mt-2 space-y-1">
              <div>• La recherche affiche TOUTES les cartes "{card.name}" (tous numéros/extensions)</div>
              <div>• CardMarket ne filtre pas par numéro dans la recherche globale</div>
              <div>• Vous devrez <strong>trouver manuellement</strong> la carte #{card.number} dans les résultats</div>
            </div>
            <div className="mt-2 p-2 bg-blue-500/20 border border-blue-500/30 rounded">
              💡 <strong>Solution :</strong> Cliquez sur <strong>"Trouver lien direct"</strong> ci-dessus !
              <br />
              Le système va automatiquement chercher la carte exacte dans notre base de 60,000+ cartes CardMarket.
              <br />
              <br />
              <strong>Alternatives :</strong>
              <br />
              • <strong>TCGPlayer</strong> (USD) → Résultats plus précis avec filtres
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
