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
  const [cardMarketData, setCardMarketData] = useState(null) // Infos complètes de la carte CardMarket
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

          // Charger les infos complètes de la carte CardMarket (idExpansion, name)
          if (match.cardmarket_id_product && !match.is_sealed_product) {
            const cardData = await CardMarketSupabaseService.getCardById(match.cardmarket_id_product)
            if (cardData) {
              setCardMarketData(cardData)
              console.log(`📦 Infos CardMarket chargées: ${cardData.name} (expansion: ${cardData.id_expansion})`)
            }
          }
        }
      } catch (error) {
        console.error('❌ Erreur chargement matching CardMarket:', error)
      }
    }

    loadCardMarketMatch()
  }, [card?.id, user?.id])

  if (!card) return null

  // Fonction helper pour construire le code de carte CardMarket
  // Format: "Hypno-MEW097" (Nom-CODESET123)
  const buildCardMarketCardSlug = (cardName, setId, cardNumber) => {
    if (!cardName || !setId || !cardNumber) return null

    // Extraire le code de l'extension depuis set.id
    // Format set.id: "sv3pt5" → code "MEW" pour l'extension 151
    let setCode = setId.toUpperCase()

    // Mapping des codes d'extension Pokemon TCG API → CardMarket
    // Format : code API -> code CardMarket
    const setCodeMapping = {
      // Scarlet & Violet
      'sv3pt5': 'MEW',    // 151
      'sv3.5': 'MEW',     // 151 (alternative)
      'sv1': 'SVI',       // Scarlet & Violet
      'sv2': 'PAL',       // Paldea Evolved
      'sv3': 'OBF',       // Obsidian Flames
      'sv4': 'PAR',       // Paradox Rift
      'sv5': 'TEF',       // Temporal Forces
      'sv6': 'TWM',       // Twilight Masquerade
      'sv7': 'SFA',       // Shrouded Fable
      'sv8': 'SCR',       // Stellar Crown
      // Sword & Shield
      'swsh1': 'SSH',     // Sword & Shield
      'swsh2': 'RCL',     // Rebel Clash
      'swsh3': 'DAA',     // Darkness Ablaze
      'swsh4': 'VIV',     // Vivid Voltage
      'swsh5': 'BST',     // Battle Styles
      'swsh6': 'CRE',     // Chilling Reign
      'swsh7': 'EVS',     // Evolving Skies
      'swsh8': 'FST',     // Fusion Strike
      'swsh9': 'BRS',     // Brilliant Stars
      'swsh10': 'ASR',    // Astral Radiance
      'swsh11': 'LOR',    // Lost Origin
      'swsh12': 'SIT',    // Silver Tempest
      // Sun & Moon
      'sm1': 'SUM',       // Sun & Moon
      'sm2': 'GRI',       // Guardians Rising
      'sm3': 'BUS',       // Burning Shadows
      'sm4': 'CIN',       // Crimson Invasion
      'sm5': 'UPR',       // Ultra Prism
      'sm6': 'FLI',       // Forbidden Light
      'sm7': 'CES',       // Celestial Storm
      'sm8': 'LOT',       // Lost Thunder
      'sm9': 'TEM',       // Team Up
      'sm10': 'UNB',      // Unbroken Bonds
      'sm11': 'UNM',      // Unified Minds
      'sm12': 'CEC',      // Cosmic Eclipse
    }

    setCode = setCodeMapping[setId.toLowerCase()] || setCode

    // Padder le numéro à 3 chiffres
    const paddedNumber = cardNumber.toString().padStart(3, '0')

    // Format final : "Hypno-MEW097"
    return `${cardName}-${setCode}${paddedNumber}`
  }

  // Fonction pour convertir le nom CardMarket en slug URL
  // Format: "Omanyte MEW138" → "Omanyte-MEW138"
  // Format: "Omanyte [details]" → "Omanyte-details"
  const convertCardMarketNameToSlug = (cardMarketName) => {
    if (!cardMarketName) return null

    // Remplacer les espaces par des tirets et nettoyer
    return cardMarketName
      .replace(/\s+/g, '-')  // Espaces → tirets
      .replace(/\[/g, '')     // Supprimer [
      .replace(/\]/g, '')     // Supprimer ]
  }

  // Construire l'URL CardMarket
  let cardMarketUrl
  let isDirect = false

  // PRIORITÉ 1 : Essayer lien direct V1 si extension mappée
  if (card.set?.name && card.set?.id && card.name && card.number) {
    const cardSlug = buildCardMarketCardSlug(card.name, card.set.id, card.number)

    // Vérifier si l'extension est mappée
    const setCodeMapping = {
      'sv3pt5': true, 'sv3.5': true, 'sv1': true, 'sv2': true, 'sv3': true,
      'sv4': true, 'sv5': true, 'sv6': true, 'sv7': true, 'sv8': true,
      'swsh1': true, 'swsh2': true, 'swsh3': true, 'swsh4': true, 'swsh5': true,
      'swsh6': true, 'swsh7': true, 'swsh8': true, 'swsh9': true, 'swsh10': true,
      'swsh11': true, 'swsh12': true, 'sm1': true, 'sm2': true, 'sm3': true,
      'sm4': true, 'sm5': true, 'sm6': true, 'sm7': true, 'sm8': true,
      'sm9': true, 'sm10': true, 'sm11': true, 'sm12': true
    }

    if (cardSlug && setCodeMapping[card.set.id.toLowerCase()]) {
      // Essayer avec V1 (la plupart des cartes utilisent V1)
      const slugWithV1 = cardSlug.replace(/-([A-Z]+\d+)$/, '-V1-$1')
      cardMarketUrl = `https://www.cardmarket.com/en/Pokemon/Products/Singles/${card.set.name}/${slugWithV1}?language=2`
      isDirect = true
      console.log(`🔗 Lien direct V1: ${cardMarketUrl}`)
    }
  }

  // PRIORITÉ 2 : Recherche optimisée si pas de lien direct
  if (!cardMarketUrl) {
    const searchTerms = [card.name]

    if (card.number) {
      searchTerms.push(card.number)
    }

    // Ajouter le nom de l'extension pour filtrer davantage
    if (card.set?.name) {
      searchTerms.push(card.set.name)
    }

    const searchString = searchTerms.join(' ')
    cardMarketUrl = `https://www.cardmarket.com/en/Pokemon/Products/Search?searchString=${encodeURIComponent(searchString)}&language=2`
    console.log(`🔗 Recherche CardMarket: "${searchString}"`)
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
          className="inline-flex items-center gap-1 text-blue-500 hover:text-blue-600 hover:underline transition-colors text-sm"
          title={`CardMarket EUR - Recherche "${card.name}${card.number ? ' ' + card.number : ''}"`}
        >
          <ExternalLink className="w-4 h-4" />
          CardMarket (EUR)
        </a>

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

    </div>
  )
}
