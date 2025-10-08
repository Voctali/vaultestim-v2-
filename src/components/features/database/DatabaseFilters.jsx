/**
 * Composant de filtres avancés pour la recherche
 */
import React from 'react'
import { Filter, X, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

export function DatabaseFilters({ filters, sets, onFiltersChange, onClear }) {
  const [isOpen, setIsOpen] = React.useState(false)

  const handleFilterChange = (key, value) => {
    onFiltersChange({ [key]: value })
  }

  const handleTypeToggle = (type) => {
    const currentTypes = filters.types || []
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type]

    onFiltersChange({ types: newTypes })
  }

  const pokemonTypes = [
    'Fire', 'Water', 'Grass', 'Electric', 'Psychic', 'Fighting',
    'Darkness', 'Metal', 'Fairy', 'Dragon', 'Colorless'
  ]

  const rarities = [
    'Common', 'Uncommon', 'Rare', 'Rare Holo', 'Rare Holo EX',
    'Rare Holo GX', 'Rare Holo V', 'Rare Holo VMAX', 'Ultra Rare',
    'Secret Rare', 'Rainbow Rare'
  ]

  const supertypes = ['Pokémon', 'Trainer', 'Energy']

  const hasActiveFilters = filters.setId || filters.type || filters.rarity || (filters.types && filters.types.length > 0)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full justify-between border border-input bg-background hover:bg-accent hover:text-accent-foreground px-3 py-2 rounded-md text-sm font-medium flex items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtres avancés
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                {[
                  filters.setId && '1',
                  filters.type && '1',
                  filters.rarity && '1',
                  filters.types?.length && filters.types.length.toString()
                ].filter(Boolean).reduce((a, b) => parseInt(a) + parseInt(b), 0)} actifs
              </Badge>
            )}
          </div>
          <ChevronDown className="h-4 w-4" />
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-4 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Extension */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Extension</label>
            <Select value={filters.setId || 'all'} onValueChange={(value) => handleFilterChange('setId', value === 'all' ? '' : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Toutes les extensions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les extensions</SelectItem>
                {sets.map(set => (
                  <SelectItem key={set.id} value={set.id}>
                    {set.name} ({set.cardCount || 0} cartes)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Type de carte */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Type de carte</label>
            <Select value={filters.type || 'all'} onValueChange={(value) => handleFilterChange('type', value === 'all' ? '' : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {supertypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Rareté */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Rareté</label>
            <Select value={filters.rarity || 'all'} onValueChange={(value) => handleFilterChange('rarity', value === 'all' ? '' : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Toutes les raretés" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les raretés</SelectItem>
                {rarities.map(rarity => (
                  <SelectItem key={rarity} value={rarity}>
                    {rarity}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Types Pokémon */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Types Pokémon</label>
          <div className="flex flex-wrap gap-2">
            {pokemonTypes.map(type => {
              const isSelected = filters.types && filters.types.includes(type)
              return (
                <Button
                  key={type}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleTypeToggle(type)}
                  className="text-xs"
                >
                  {type}
                </Button>
              )
            })}
          </div>
          {filters.types && filters.types.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {filters.types.length} type(s) sélectionné(s)
            </div>
          )}
        </div>

        {/* Tri */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Trier par</label>
            <Select value={filters.sort || 'name'} onValueChange={(value) => handleFilterChange('sort', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nom</SelectItem>
                <SelectItem value="number">Numéro</SelectItem>
                <SelectItem value="rarity">Rareté</SelectItem>
                <SelectItem value="hp">HP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Ordre</label>
            <Select value={filters.order || 'asc'} onValueChange={(value) => handleFilterChange('order', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Croissant</SelectItem>
                <SelectItem value="desc">Décroissant</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Actions */}
        {hasActiveFilters && (
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClear}>
              <X className="h-4 w-4 mr-2" />
              Effacer les filtres
            </Button>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}