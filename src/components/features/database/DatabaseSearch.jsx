/**
 * Composant de recherche avancée dans la base de données
 */
import React, { useState, useEffect, useCallback } from 'react'
import { Search, Filter, Grid, List, Loader2, Database, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { DatabaseService } from '@/services/DatabaseService'
import { DatabaseCard } from './DatabaseCard'
import { DatabaseFilters } from './DatabaseFilters'
import { DatabaseStats } from './DatabaseStats'

export function DatabaseSearch() {
  // États pour la recherche
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  // États pour les résultats
  const [results, setResults] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // États pour les filtres
  const [filters, setFilters] = useState({
    setId: '',
    type: '',
    rarity: '',
    types: [],
    sort: 'name',
    order: 'asc'
  })

  // États pour l'affichage
  const [viewMode, setViewMode] = useState('grid') // grid | list
  const [currentPage, setCurrentPage] = useState(1)

  // États pour les métadonnées
  const [sets, setSets] = useState([])
  const [stats, setStats] = useState(null)

  /**
   * Rechercher des cartes
   */
  const searchCards = useCallback(async (page = 1, resetResults = true) => {
    try {
      setLoading(true)
      setError(null)

      const searchOptions = {
        query: DatabaseService.formatSearchQuery(query),
        ...filters,
        page,
        limit: 50
      }

      const response = await DatabaseService.searchCards(searchOptions)

      if (resetResults || page === 1) {
        setResults(response.data)
      } else {
        // Pagination - ajouter aux résultats existants
        setResults(prev => [...prev, ...response.data])
      }

      setPagination(response.pagination)
      setCurrentPage(page)

    } catch (err) {
      setError(err.message)
      console.error('Erreur recherche:', err)
    } finally {
      setLoading(false)
    }
  }, [query, filters])

  /**
   * Autocomplétion
   */
  const updateSuggestions = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    try {
      const response = await DatabaseService.getAutocompleteSuggestions(searchQuery, 8)
      setSuggestions(response.suggestions || [])
      setShowSuggestions(true)
    } catch (err) {
      console.warn('Erreur autocomplétion:', err)
      setSuggestions([])
    }
  }, [])

  /**
   * Charger les métadonnées
   */
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        // Charger les extensions
        const setsResponse = await DatabaseService.getSets()
        setSets(setsResponse.data || [])

        // Charger les statistiques
        const statsResponse = await DatabaseService.getStats()
        setStats(statsResponse)

      } catch (err) {
        console.error('Erreur chargement métadonnées:', err)
      }
    }

    loadMetadata()
  }, [])

  /**
   * Recherche initiale
   */
  useEffect(() => {
    const initialSearch = async () => {
      await searchCards(1, true)
    }

    const debounceTimer = setTimeout(initialSearch, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchCards])

  /**
   * Autocomplétion avec debounce
   */
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      updateSuggestions(query)
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [query, updateSuggestions])

  /**
   * Gestionnaires d'événements
   */
  const handleSearch = (e) => {
    e.preventDefault()
    searchCards(1, true)
    setShowSuggestions(false)
  }

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion.name)
    setShowSuggestions(false)
    setTimeout(() => searchCards(1, true), 100)
  }

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setCurrentPage(1)
  }

  const handleLoadMore = () => {
    if (pagination && pagination.hasNext && !loading) {
      searchCards(currentPage + 1, false)
    }
  }

  const handleClearFilters = () => {
    setFilters({
      setId: '',
      type: '',
      rarity: '',
      types: [],
      sort: 'name',
      order: 'asc'
    })
    setQuery('')
    setCurrentPage(1)
  }

  return (
    <div className="space-y-6">
      {/* Statistiques en haut */}
      {stats && (
        <DatabaseStats stats={stats} />
      )}

      {/* Barre de recherche */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Recherche dans la base de données
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Champ de recherche principal */}
          <div className="relative">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une carte (ex: Dracaufeu, Pikachu...)"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setShowSuggestions(suggestions.length > 0)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="pl-10"
                />

                {/* Suggestions d'autocomplétion */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border rounded-md shadow-lg max-h-64 overflow-y-auto">
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {suggestion.image && (
                          <img
                            src={suggestion.image}
                            alt={suggestion.name}
                            className="w-8 h-11 object-cover rounded"
                          />
                        )}
                        <div>
                          <div className="font-medium">{suggestion.name}</div>
                          {suggestion.name_fr && suggestion.name_fr !== suggestion.name && (
                            <div className="text-sm text-muted-foreground">{suggestion.name_fr}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button type="submit" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>

          {/* Filtres avancés */}
          <DatabaseFilters
            filters={filters}
            sets={sets}
            onFiltersChange={handleFilterChange}
            onClear={handleClearFilters}
          />

          {/* Options d'affichage */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            {pagination && (
              <div className="text-sm text-muted-foreground">
                {pagination.total} cartes trouvées • Page {pagination.page}/{pagination.totalPages}
              </div>
            )}
          </div>

          {/* Filtres actifs */}
          {(query || filters.setId || filters.type || filters.rarity || filters.types.length > 0) && (
            <div className="flex flex-wrap gap-2">
              {query && (
                <Badge variant="secondary">
                  Recherche: "{query}"
                </Badge>
              )}
              {filters.setId && (
                <Badge variant="secondary">
                  Extension: {sets.find(s => s.id === filters.setId)?.name || filters.setId}
                </Badge>
              )}
              {filters.type && (
                <Badge variant="secondary">
                  Type: {filters.type}
                </Badge>
              )}
              {filters.rarity && (
                <Badge variant="secondary">
                  Rareté: {filters.rarity}
                </Badge>
              )}
              {filters.types.map(type => (
                <Badge key={type} variant="secondary">
                  {type}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Résultats */}
      <div>
        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="text-destructive text-center">
                ❌ Erreur: {error}
              </div>
            </CardContent>
          </Card>
        )}

        {!error && results.length === 0 && !loading && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune carte trouvée avec ces critères</p>
              </div>
            </CardContent>
          </Card>
        )}

        {results.length > 0 && (
          <>
            <div className={`grid gap-6 ${
              viewMode === 'grid'
                ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                : 'grid-cols-1'
            }`}>
              {results.map((card) => (
                <DatabaseCard
                  key={card.id}
                  card={card}
                  viewMode={viewMode}
                />
              ))}
            </div>

            {/* Bouton charger plus */}
            {pagination && pagination.hasNext && (
              <div className="text-center mt-8">
                <Button
                  onClick={handleLoadMore}
                  disabled={loading}
                  variant="outline"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Chargement...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Charger plus ({pagination.total - results.length} restantes)
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}

        {loading && results.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p>Recherche en cours...</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}