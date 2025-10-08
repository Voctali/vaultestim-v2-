import axios from 'axios'

const TYRADEX_BASE_URL = 'https://tyradex.vercel.app/api/v1'

export class PokemonService {

  static async searchPokemon(query, limit = 20) {
    try {
      // Récupérer la liste complète des Pokémon depuis Tyradex
      const response = await axios.get(`${TYRADEX_BASE_URL}/pokemon`)
      const allPokemon = response.data

      // Filtrer les Pokémon selon la recherche (noms français et anglais)
      const filteredPokemon = allPokemon.filter(pokemon => {
        const frenchName = pokemon.name?.fr?.toLowerCase() || ''
        const englishName = pokemon.name?.en?.toLowerCase() || ''
        const searchQuery = query.toLowerCase()

        return frenchName.includes(searchQuery) || englishName.includes(searchQuery)
      }).slice(0, limit)

      // Récupérer les détails pour chaque Pokémon trouvé
      const pokemonDetails = await Promise.all(
        filteredPokemon.map(async (pokemon) => {
          const details = await this.getPokemonDetailsFromTyradex(pokemon.pokedex_id)
          return details
        })
      )

      return pokemonDetails.filter(pokemon => pokemon !== null)
    } catch (error) {
      console.error('Erreur lors de la recherche de Pokémon:', error)
      return []
    }
  }

  static async getPokemonDetailsFromTyradex(pokemonId) {
    try {
      const response = await axios.get(`${TYRADEX_BASE_URL}/pokemon/${pokemonId}`)
      const pokemon = response.data

      return {
        id: pokemon.pokedex_id,
        name: pokemon.name?.en?.toLowerCase() || `pokemon-${pokemonId}`,
        frenchName: pokemon.name?.fr || pokemon.name?.en || 'Pokémon Inconnu',
        types: pokemon.types?.map(type => ({
          name: type.name.toLowerCase().replace('é', 'e'),
          frenchName: type.name
        })) || [],
        sprites: {
          front_default: pokemon.sprites?.regular,
          front_shiny: pokemon.sprites?.shiny,
          official_artwork: pokemon.sprites?.regular
        },
        height: pokemon.height ? parseFloat(pokemon.height.replace(' m', '').replace(',', '.')) * 10 : 0,
        weight: pokemon.weight ? parseFloat(pokemon.weight.replace(' kg', '').replace(',', '.')) * 10 : 0,
        baseExperience: pokemon.stats ? Object.values(pokemon.stats).reduce((a, b) => a + b, 0) : 0,
        abilities: pokemon.talents?.map(talent => ({
          name: talent.name.toLowerCase().replace(/[éèêë]/g, 'e').replace(/[àâä]/g, 'a'),
          frenchName: talent.name,
          is_hidden: talent.tc || false
        })) || [],
        stats: pokemon.stats ? {
          hp: pokemon.stats.hp,
          attack: pokemon.stats.atk,
          defense: pokemon.stats.def,
          'special-attack': pokemon.stats.spe_atk,
          'special-defense': pokemon.stats.spe_def,
          speed: pokemon.stats.vit
        } : null,
        category: pokemon.category
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des détails Tyradex:', error)
      return null
    }
  }

  // Méthode de fallback pour la compatibilité
  static async getPokemonDetails(nameOrId) {
    // Si c'est un nombre, utiliser Tyradex directement
    if (!isNaN(nameOrId)) {
      return await this.getPokemonDetailsFromTyradex(nameOrId)
    }

    // Sinon, essayer de trouver le Pokémon par nom
    try {
      const searchResults = await this.searchPokemon(nameOrId, 1)
      return searchResults.length > 0 ? searchResults[0] : null
    } catch (error) {
      console.error('Erreur lors de la recherche par nom:', error)
      return null
    }
  }

  static translateType(type) {
    const typeTranslations = {
      'normal': 'Normal',
      'fire': 'Feu',
      'feu': 'Feu',
      'water': 'Eau',
      'eau': 'Eau',
      'electric': 'Électrik',
      'electrik': 'Électrik',
      'grass': 'Plante',
      'plante': 'Plante',
      'ice': 'Glace',
      'glace': 'Glace',
      'fighting': 'Combat',
      'combat': 'Combat',
      'poison': 'Poison',
      'ground': 'Sol',
      'sol': 'Sol',
      'flying': 'Vol',
      'vol': 'Vol',
      'psychic': 'Psy',
      'psy': 'Psy',
      'bug': 'Insecte',
      'insecte': 'Insecte',
      'rock': 'Roche',
      'roche': 'Roche',
      'ghost': 'Spectre',
      'spectre': 'Spectre',
      'dragon': 'Dragon',
      'dark': 'Ténèbres',
      'tenebres': 'Ténèbres',
      'steel': 'Acier',
      'acier': 'Acier',
      'fairy': 'Fée',
      'fee': 'Fée'
    }
    return typeTranslations[type.toLowerCase()] || type
  }

  static capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  static getTypeColor(type) {
    const typeColors = {
      'normal': '#A8A878',
      'fire': '#F08030',
      'feu': '#F08030',
      'water': '#6890F0',
      'eau': '#6890F0',
      'electric': '#F8D030',
      'electrik': '#F8D030',
      'grass': '#78C850',
      'plante': '#78C850',
      'ice': '#98D8D8',
      'glace': '#98D8D8',
      'fighting': '#C03028',
      'combat': '#C03028',
      'poison': '#A040A0',
      'ground': '#E0C068',
      'sol': '#E0C068',
      'flying': '#A890F0',
      'vol': '#A890F0',
      'psychic': '#F85888',
      'psy': '#F85888',
      'bug': '#A8B820',
      'insecte': '#A8B820',
      'rock': '#B8A038',
      'roche': '#B8A038',
      'ghost': '#705898',
      'spectre': '#705898',
      'dragon': '#7038F8',
      'dark': '#705848',
      'tenebres': '#705848',
      'steel': '#B8B8D0',
      'acier': '#B8B8D0',
      'fairy': '#EE99AC',
      'fee': '#EE99AC'
    }
    return typeColors[type.toLowerCase()] || '#68A090'
  }
}