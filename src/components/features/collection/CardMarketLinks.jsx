import { useState, useEffect } from 'react'
import { ExternalLink, Zap, AlertCircle, Sparkles } from 'lucide-react'
import { buildCardMarketUrl } from '@/utils/cardMarketUrlBuilder'
import { CardMarketSupabaseService } from '@/services/CardMarketSupabaseService'
import { CardMarketMatchingService } from '@/services/CardMarketMatchingService'
import { CardMarketDynamicLinkService } from '@/services/CardMarketDynamicLinkService'
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

  // Mapping pour les cartes dont le nom diffère entre API et CardMarket
  // Format: "setId-cardNumber": "nom-complet-cardmarket"
  const cardNameOverrides = {
    'swsh12pt5-150': "Professor's Research (Professor Rowan)",
    'swsh12.5-150': "Professor's Research (Professor Rowan)",
    // TODO: ajouter d'autres cartes avec noms différents
  }

  // Fonction helper pour construire le slug de carte CardMarket
  // Format: "Blastoise-ex-V1-MEW009" (Nom-slugifié-V1-CODESET123)
  const buildCardMarketCardSlug = (cardName, setId, cardNumber) => {
    if (!cardName || !setId || !cardNumber) return null

    // Vérifier si cette carte a un nom override
    const overrideKey = `${setId.toLowerCase()}-${cardNumber}`
    if (cardNameOverrides[overrideKey]) {
      cardName = cardNameOverrides[overrideKey]
    }

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
      'swsh12pt5': 'CRZ', // Crown Zenith
      'swsh12.5': 'CRZ',  // Crown Zenith (alternative)
      'swsh12pt5gg': 'CRZ', // Crown Zenith Galarian Gallery
      'swsh12.5gg': 'CRZ',  // Crown Zenith Galarian Gallery (alternative)
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

    // Extensions qui utilisent toujours le format V1
    const alwaysV1Sets = ['SVI', 'PAL', 'OBF', 'PAR', 'TEF', 'TWM', 'SFA', 'SCR']

    // Pour certaines extensions, liste des numéros de cartes qui utilisent V1
    // (Pattern non-évident, basé sur les tests manuels)

    // Extension 151 (MEW)
    const mew151V1Cards = [
      1, 2, 3, 4, 5, 6, 7, 8, 9,  // Starters Gen 1 (Bulbasaur-Blastoise)
      25,                          // Pikachu
      61,                          // Poliwhirl
      63, 64, 65,                  // Abra line
      67,                          // Machoke
      76,                          // Golem ex
      151                          // Mew ex
      // TODO: compléter au fur et à mesure des tests
    ]

    // Crown Zenith (CRZ)
    const crownZenithV1Cards = [
      23,                          // Simisear VSTAR
      54,                          // Zeraora VMAX
      55,                          // Zeraora VSTAR
      98,                          // Zamazenta V
      101,                         // Rayquaza VMAX
      114                          // Regigigas VSTAR
      // TODO: compléter au fur et à mesure des tests
    ]

    // Crown Zenith (CRZ) - cartes avec versions alternatives (V2, V3...)
    const crownZenithV2Cards = [
      'GG35',                      // Leafeon VSTAR
      'GG37',                      // Simisear VSTAR
      'GG42',                      // Zeraora VMAX
      'GG43',                      // Zeraora VSTAR
      102                          // Rayquaza VMAX (version 2)
      // TODO: compléter au fur et à mesure des tests
    ]

    const cardNum = parseInt(cardNumber)
    const useV1Format = alwaysV1Sets.includes(setCode) ||
                        (setCode === 'MEW' && mew151V1Cards.includes(cardNum)) ||
                        (setCode === 'CRZ' && crownZenithV1Cards.includes(cardNum))

    // Détecter si la carte utilise V2
    const useV2Format = setCode === 'CRZ' && crownZenithV2Cards.includes(cardNumber)

    // Padder le numéro à 3 chiffres
    const paddedNumber = cardNumber.toString().padStart(3, '0')

    // Slugifier le nom (espaces → tirets) en préservant la casse
    // CardMarket utilise la casse originale (ex: "Blastoise-ex" pas "blastoise-ex")
    const slugifiedName = cardName
      .replace(/\s+/g, '-')           // Espaces → tirets (DOIT être avant le replace suivant)
      .replace(/[^\w\-]/g, '')        // Supprimer caractères spéciaux sauf tirets (échapper le tiret)
      .replace(/--+/g, '-')           // Nettoyer les doubles tirets éventuels
      .replace(/^-|-$/g, '')          // Supprimer tirets en début/fin

    // Format conditionnel : V1/V2 pour certaines cartes, simple pour les autres
    if (useV2Format) {
      return `${slugifiedName}-V2-${setCode}${paddedNumber}` // Ex: "Simisear-VSTAR-V2-CRZGG37"
    } else if (useV1Format) {
      return `${slugifiedName}-V1-${setCode}${paddedNumber}` // Ex: "Charizard-ex-V1-SVI006"
    } else {
      return `${slugifiedName}-${setCode}${paddedNumber}` // Ex: "Pidgey-MEW016"
    }
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

    // Debug: vérifier le slug généré
    console.log(`🐛 DEBUG ${card.name}: slug généré = "${cardSlug}"`)

    // Vérifier si l'extension est mappée
    const setCodeMapping = {
      'sv3pt5': true, 'sv3.5': true, 'sv1': true, 'sv2': true, 'sv3': true,
      'sv4': true, 'sv5': true, 'sv6': true, 'sv7': true, 'sv8': true,
      'swsh1': true, 'swsh2': true, 'swsh3': true, 'swsh4': true, 'swsh5': true,
      'swsh6': true, 'swsh7': true, 'swsh8': true, 'swsh9': true, 'swsh10': true,
      'swsh11': true, 'swsh12': true, 'swsh12pt5': true, 'swsh12.5': true,
      'swsh12pt5gg': true, 'swsh12.5gg': true,
      'sm1': true, 'sm2': true, 'sm3': true,
      'sm4': true, 'sm5': true, 'sm6': true, 'sm7': true, 'sm8': true,
      'sm9': true, 'sm10': true, 'sm11': true, 'sm12': true
    }

    if (cardSlug && setCodeMapping[card.set.id.toLowerCase()]) {
      // Le slug contient déjà V1 et le code (ex: "Blastoise-ex-V1-MEW009")
      // Utiliser le nom de l'extension comme ID d'expansion CardMarket
      // Remplacer les espaces par des tirets pour les URLs
      let setNameSlug = card.set.name.replace(/\s+/g, '-')

      // Normaliser les sous-extensions (Galarian Gallery → Crown Zenith)
      setNameSlug = setNameSlug.replace(/-Galarian-Gallery$/i, '')

      cardMarketUrl = `https://www.cardmarket.com/fr/Pokemon/Products/Singles/${setNameSlug}/${cardSlug}`
      isDirect = true
      console.log(`🔗 Lien direct V1 pour ${card.name}: ${cardMarketUrl}`)
    } else {
      console.log(`⚠️ Extension non mappée ou slug invalide pour ${card.name}`)
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

  const handleCardMarketClick = async (e) => {
    e.preventDefault()

    try {
      // Récupérer le lien dynamique depuis RapidAPI ou cache
      const dynamicUrl = await CardMarketDynamicLinkService.getCardLink(card)

      // Rediriger immédiatement
      window.open(dynamicUrl, '_blank', 'noopener,noreferrer')

      console.log(`🔗 Redirection vers: ${dynamicUrl}`)
    } catch (error) {
      console.error('❌ Erreur récupération lien CardMarket:', error)

      // Fallback: ouvrir l'URL construite manuellement
      window.open(cardMarketUrl, '_blank', 'noopener,noreferrer')
    }

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
        {/* CardMarket - Prix EUR (dynamique via RapidAPI) */}
        <button
          onClick={handleCardMarketClick}
          className="inline-flex items-center gap-1 text-blue-500 hover:text-blue-600 hover:underline transition-colors text-sm cursor-pointer bg-transparent border-none p-0"
          title={`CardMarket EUR - Lien dynamique via RapidAPI`}
        >
          <ExternalLink className="w-4 h-4" />
          CardMarket (EUR)
        </button>

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
