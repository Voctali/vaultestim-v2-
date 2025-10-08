import { TCGdxService } from '@/services/TCGdxService'

export class CardScanner {
  // Base de données des acronymes de séries
  static SERIES_ACRONYMS = {
    // Générations récentes
    'mew': '151',
    'sv': 'Scarlet & Violet',
    'swsh': 'Sword & Shield',
    'sm': 'Sun & Moon',
    'xy': 'XY',
    'bw': 'Black & White',
    'hgss': 'HeartGold & SoulSilver',
    'pl': 'Platinum',
    'dp': 'Diamond & Pearl',

    // Extensions spécifiques
    'celebrations': 'Celebrations',
    'shining fates': 'Shining Fates',
    'hidden fates': 'Hidden Fates',
    'champions path': 'Champion\'s Path',
    'evolutions': 'Evolutions',
    'generations': 'Generations',

    // Codes d'extension courts
    'sv1': 'Scarlet & Violet',
    'sv2': 'Paldea Evolved',
    'sv3': 'Obsidian Flames',
    'sv4': 'Paradox Rift',
    'sv5': 'Temporal Forces',
    'swsh1': 'Sword & Shield',
    'swsh2': 'Rebel Clash',
    'swsh3': 'Darkness Ablaze',
    'swsh4': 'Vivid Voltage',
    'swsh5': 'Battle Styles',
    'swsh6': 'Chilling Reign',
    'swsh7': 'Evolving Skies',
    'swsh8': 'Fusion Strike',
    'swsh9': 'Brilliant Stars',
    'swsh10': 'Astral Radiance',
    'swsh11': 'Lost Origin',
    'swsh12': 'Silver Tempest',
    'swsh13': 'Crown Zenith'
  }

  // Mots-clés de logos à détecter
  static LOGO_KEYWORDS = {
    'sword & shield': ['sword', 'shield', 'épée', 'bouclier', 'swsh'],
    'sun & moon': ['sun', 'moon', 'soleil', 'lune', 'sm'],
    'xy': ['xy', 'x', 'y'],
    'black & white': ['black', 'white', 'noir', 'blanc', 'bw'],
    'diamond & pearl': ['diamond', 'pearl', 'diamant', 'perle', 'dp'],
    'scarlet & violet': ['scarlet', 'violet', 'écarlate', 'sv'],
    'legends arceus': ['legends', 'arceus', 'légendes'],
    'brilliant diamond': ['brilliant', 'diamond', 'diamant', 'étincelant'],
    'shining pearl': ['shining', 'pearl', 'perle', 'scintillante']
  }

  // Types de Pokémon en français et anglais
  static POKEMON_TYPES = {
    'feu': 'fire', 'fire': 'fire',
    'eau': 'water', 'water': 'water',
    'plante': 'grass', 'grass': 'grass',
    'électrik': 'electric', 'electric': 'electric',
    'psy': 'psychic', 'psychic': 'psychic',
    'combat': 'fighting', 'fighting': 'fighting',
    'poison': 'poison',
    'sol': 'ground', 'ground': 'ground',
    'vol': 'flying', 'flying': 'flying',
    'insecte': 'bug', 'bug': 'bug',
    'roche': 'rock', 'rock': 'rock',
    'spectre': 'ghost', 'ghost': 'ghost',
    'dragon': 'dragon',
    'ténèbres': 'dark', 'dark': 'dark',
    'acier': 'steel', 'steel': 'steel',
    'fée': 'fairy', 'fairy': 'fairy'
  }

  static async scanImage(imageFile) {
    console.log('🔍 Début du scan d\'image:', imageFile.name)

    try {
      // Étape 1: Extraire le texte de l'image avec OCR
      const extractedText = await this.performOCR(imageFile)
      console.log('📝 Texte extrait:', extractedText)

      // Étape 2: Analyser le texte extrait
      const analysisResult = await this.analyzeExtractedText(extractedText)
      console.log('🔬 Analyse du texte:', analysisResult)

      // Étape 3: Rechercher des cartes correspondantes
      const searchResults = await this.searchMatchingCards(analysisResult)
      console.log('🎯 Résultats de recherche:', searchResults.length)

      // Étape 4: Analyser l'illustration (simulation)
      const illustrationAnalysis = await this.analyzeIllustration(imageFile)
      console.log('🎨 Analyse illustration:', illustrationAnalysis)

      // Étape 5: Combiner tous les résultats
      const finalResults = this.combineResults(searchResults, analysisResult, illustrationAnalysis)
      console.log('✅ Résultats finaux:', finalResults.length)

      return finalResults

    } catch (error) {
      console.error('❌ Erreur lors du scan:', error)
      return []
    }
  }

  // Simulation d'OCR (Optical Character Recognition)
  static async performOCR(imageFile) {
    // En production, on utiliserait une vraie API OCR comme Tesseract.js ou Google Vision API
    // Pour la démo, on simule l'extraction de texte

    return new Promise(resolve => {
      setTimeout(() => {
        // Simulation de différents cas d'OCR selon le nom du fichier
        const fileName = imageFile.name.toLowerCase()

        if (fileName.includes('pikachu')) {
          resolve('Pikachu HP 60 Basic Pokémon Lightning 25th Anniversary Collection 001/025')
        } else if (fileName.includes('charizard')) {
          resolve('Charizard HP 150 Stage 2 Fire Burning Energy 004/102 Base Set')
        } else if (fileName.includes('mewtwo')) {
          resolve('Mewtwo HP 130 Psychic Basic Pokémon sv151 055/165')
        } else {
          // Texte générique pour simulation
          resolve('Pokémon Card HP 80 Lightning Type 045/185 Scarlet Violet')
        }
      }, 1000) // Simulation du temps de traitement OCR
    })
  }

  static async analyzeExtractedText(text) {
    console.log('🔤 Analyse du texte:', text)

    const analysis = {
      pokemonName: null,
      cardNumber: null,
      setInfo: null,
      hp: null,
      type: null,
      rarity: null,
      detectedSeries: null,
      detectedAcronym: null,
      confidence: 0.5
    }

    const textLower = text.toLowerCase()

    // 1. Rechercher le nom du Pokémon (première ligne généralement)
    const lines = text.split(/[\n\r]/).filter(line => line.trim().length > 0)
    if (lines.length > 0) {
      // Le nom est généralement le premier mot important
      const firstLine = lines[0].trim()
      const words = firstLine.split(/\s+/)

      // Filtrer les mots qui pourraient être des noms de Pokémon
      const potentialNames = words.filter(word =>
        word.length > 2 &&
        !['hp', 'basic', 'stage', 'pokémon', 'pokemon'].includes(word.toLowerCase())
      )

      if (potentialNames.length > 0) {
        analysis.pokemonName = potentialNames[0]
        analysis.confidence += 0.2
      }
    }

    // 2. Extraire les HP
    const hpMatch = text.match(/hp\s*(\d+)/i)
    if (hpMatch) {
      analysis.hp = parseInt(hpMatch[1])
      analysis.confidence += 0.1
    }

    // 3. Extraire le numéro de carte (format XXX/YYY)
    const cardNumberMatch = text.match(/(\d{1,3})\/(\d{2,3})/i)
    if (cardNumberMatch) {
      analysis.cardNumber = cardNumberMatch[0]
      analysis.confidence += 0.2
    }

    // 4. Détecter le type
    for (const [french, english] of Object.entries(this.POKEMON_TYPES)) {
      if (textLower.includes(french) || textLower.includes(english)) {
        analysis.type = english
        analysis.confidence += 0.1
        break
      }
    }

    // 5. Détecter les acronymes de séries
    for (const [acronym, series] of Object.entries(this.SERIES_ACRONYMS)) {
      if (textLower.includes(acronym.toLowerCase())) {
        analysis.detectedAcronym = acronym
        analysis.detectedSeries = series
        analysis.confidence += 0.15
        break
      }
    }

    // 6. Détecter les logos/noms de séries
    for (const [series, keywords] of Object.entries(this.LOGO_KEYWORDS)) {
      for (const keyword of keywords) {
        if (textLower.includes(keyword.toLowerCase())) {
          analysis.detectedSeries = analysis.detectedSeries || series
          analysis.confidence += 0.1
          break
        }
      }
    }

    // 7. Détections spéciales pour certaines séries
    if (textLower.includes('151') || textLower.includes('mew')) {
      analysis.detectedSeries = '151'
      analysis.detectedAcronym = 'mew'
      analysis.confidence += 0.2
    }

    return analysis
  }

  static async searchMatchingCards(analysis) {
    const results = []

    try {
      // Recherche principale par nom de Pokémon
      if (analysis.pokemonName) {
        console.log('🔍 Recherche par nom:', analysis.pokemonName)
        const nameResults = await TCGdxService.searchCards(analysis.pokemonName, 50)

        // Filtrer et scorer les résultats
        for (const card of nameResults) {
          let confidence = 0.6 // Base pour correspondance de nom
          const detectedBy = ['name']

          // Bonus si le numéro de carte correspond
          if (analysis.cardNumber && card.number) {
            const cardNumberStr = `${card.number}/${card.set?.total || ''}`
            if (cardNumberStr.includes(analysis.cardNumber) || analysis.cardNumber.includes(card.number)) {
              confidence += 0.2
              detectedBy.push('number')
            }
          }

          // Bonus si le type correspond
          if (analysis.type && card.types?.some(type => type.toLowerCase() === analysis.type)) {
            confidence += 0.1
            detectedBy.push('type')
          }

          // Bonus si la série correspond
          if (analysis.detectedSeries && (
            card.set?.series?.toLowerCase().includes(analysis.detectedSeries.toLowerCase()) ||
            card.set?.name?.toLowerCase().includes(analysis.detectedSeries.toLowerCase())
          )) {
            confidence += 0.15
            detectedBy.push('series')
          }

          // Bonus si les HP correspondent
          if (analysis.hp && card.hp && Math.abs(parseInt(card.hp) - analysis.hp) <= 10) {
            confidence += 0.1
          }

          results.push({
            ...card,
            confidence: Math.min(confidence, 1.0),
            detectedBy,
            extractedInfo: {
              detectedText: analysis.pokemonName,
              detectedNumber: analysis.cardNumber,
              detectedSeries: analysis.detectedSeries,
              detectedType: analysis.type,
              detectedHP: analysis.hp
            }
          })
        }
      }

      // Recherche par numéro de carte si pas de nom
      if (!analysis.pokemonName && analysis.cardNumber) {
        console.log('🔢 Recherche par numéro:', analysis.cardNumber)
        // Cette recherche pourrait être implémentée avec une API qui supporte la recherche par numéro
      }

      // Recherche par série détectée
      if (analysis.detectedSeries && results.length < 5) {
        console.log('📚 Recherche par série:', analysis.detectedSeries)
        // Recherche de cartes populaires de cette série
        const seriesKeywords = ['charizard', 'pikachu', 'mewtwo', 'lugia', 'ho-oh']

        for (const keyword of seriesKeywords) {
          if (results.length >= 20) break

          try {
            const seriesResults = await TCGdxService.searchCards(keyword, 5)
            const filteredResults = seriesResults
              .filter(card =>
                card.set?.series?.toLowerCase().includes(analysis.detectedSeries.toLowerCase()) ||
                card.set?.name?.toLowerCase().includes(analysis.detectedSeries.toLowerCase())
              )
              .map(card => ({
                ...card,
                confidence: 0.4,
                detectedBy: ['series'],
                extractedInfo: {
                  detectedSeries: analysis.detectedSeries
                }
              }))

            results.push(...filteredResults)
          } catch (error) {
            console.error('Erreur recherche série:', error)
          }
        }
      }

    } catch (error) {
      console.error('❌ Erreur lors de la recherche de cartes:', error)
    }

    // Trier par confiance et limiter les résultats
    return results
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
      .slice(0, 20) // Limiter à 20 résultats max
  }

  // Simulation d'analyse d'illustration
  static async analyzeIllustration(imageFile) {
    // En production, on utiliserait une IA de reconnaissance d'image comme Google Vision API,
    // AWS Rekognition, ou un modèle personnalisé entraîné sur des illustrations Pokémon

    return new Promise(resolve => {
      setTimeout(() => {
        const fileName = imageFile.name.toLowerCase()

        // Simulation basée sur le nom du fichier
        if (fileName.includes('pikachu')) {
          resolve({
            detectedPokemon: 'pikachu',
            confidence: 0.9,
            colors: ['yellow', 'red', 'brown'],
            features: ['tail', 'cheeks', 'ears']
          })
        } else if (fileName.includes('charizard')) {
          resolve({
            detectedPokemon: 'charizard',
            confidence: 0.85,
            colors: ['orange', 'yellow', 'blue'],
            features: ['wings', 'flame', 'horns']
          })
        } else {
          resolve({
            detectedPokemon: null,
            confidence: 0.3,
            colors: ['blue', 'white'],
            features: []
          })
        }
      }, 800) // Simulation du temps d'analyse d'image
    })
  }

  static combineResults(searchResults, textAnalysis, illustrationAnalysis) {
    console.log('🔄 Combinaison des résultats...')

    // Booster la confiance si l'illustration confirme le texte
    if (illustrationAnalysis.detectedPokemon && textAnalysis.pokemonName) {
      const illustrationName = illustrationAnalysis.detectedPokemon.toLowerCase()
      const textName = textAnalysis.pokemonName.toLowerCase()

      if (illustrationName === textName || illustrationName.includes(textName) || textName.includes(illustrationName)) {
        // Booster tous les résultats qui correspondent
        searchResults.forEach(result => {
          if (result.name.toLowerCase().includes(illustrationName) || result.name.toLowerCase().includes(textName)) {
            result.confidence = Math.min((result.confidence || 0.5) + 0.2, 1.0)
            result.detectedBy = result.detectedBy || []
            if (!result.detectedBy.includes('illustration')) {
              result.detectedBy.push('illustration')
            }
          }
        })
      }
    }

    // Ajouter les informations d'analyse d'illustration aux résultats
    searchResults.forEach(result => {
      result.illustrationAnalysis = illustrationAnalysis
    })

    // Retirer les doublons basés sur l'ID
    const uniqueResults = []
    const seenIds = new Set()

    for (const result of searchResults) {
      if (!seenIds.has(result.id)) {
        seenIds.add(result.id)
        uniqueResults.push(result)
      }
    }

    return uniqueResults.sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
  }

  // Méthode utilitaire pour normaliser les noms de Pokémon
  static normalizePokemonName(name) {
    if (!name) return ''

    return name
      .toLowerCase()
      .replace(/[éèêë]/g, 'e')
      .replace(/[àâä]/g, 'a')
      .replace(/[îï]/g, 'i')
      .replace(/[ôö]/g, 'o')
      .replace(/[ùûü]/g, 'u')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]/g, '')
  }

  // Méthode pour détecter la rareté depuis le texte
  static detectRarity(text) {
    const rarityKeywords = {
      'common': 0.1,
      'commune': 0.1,
      'uncommon': 0.2,
      'peu commune': 0.2,
      'rare': 0.3,
      'ultra rare': 0.8,
      'secret rare': 0.9,
      'rainbow rare': 0.95,
      'gold': 0.9,
      'prism': 0.85,
      'gx': 0.7,
      'ex': 0.6,
      'v': 0.7,
      'vmax': 0.8,
      'vstar': 0.85
    }

    const textLower = text.toLowerCase()
    let detectedRarity = 'common'
    let maxPriority = 0

    for (const [keyword, priority] of Object.entries(rarityKeywords)) {
      if (textLower.includes(keyword) && priority > maxPriority) {
        maxPriority = priority
        detectedRarity = keyword
      }
    }

    return detectedRarity
  }
}