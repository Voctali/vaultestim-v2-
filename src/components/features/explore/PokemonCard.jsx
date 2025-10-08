import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PokemonService } from "@/api/services/PokemonService"

export function PokemonCard({ pokemon, onAddToCollection, onAddToWishlist, isInCollection = false, isInWishlist = false }) {
  return (
    <Card className="group hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold text-foreground">
            {pokemon.frenchName}
            {pokemon.frenchName !== pokemon.name && (
              <span className="text-sm text-muted-foreground font-normal block">
                {PokemonService.capitalizeFirst(pokemon.name)}
              </span>
            )}
          </CardTitle>
          <span className="text-sm text-muted-foreground">#{pokemon.id.toString().padStart(3, '0')}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Image */}
        <div className="relative aspect-square bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg overflow-hidden group-hover:scale-105 transition-transform duration-200">
          <img
            src={pokemon.sprites.front_default || pokemon.sprites.official_artwork}
            alt={pokemon.frenchName}
            className="w-full h-full object-contain p-4"
            loading="lazy"
            onError={(e) => {
              e.target.src = pokemon.sprites.official_artwork || '/placeholder-pokemon.png'
            }}
          />
        </div>

        {/* Types */}
        <div className="flex flex-wrap gap-1">
          {pokemon.types.map((type) => (
            <Badge
              key={type.name}
              variant="secondary"
              className="text-xs"
              style={{
                backgroundColor: PokemonService.getTypeColor(type.name),
                color: 'white'
              }}
            >
              {type.frenchName}
            </Badge>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1"
            onClick={() => onAddToCollection?.(pokemon)}
            disabled={isInCollection}
          >
            <Plus className="w-4 h-4 mr-1" />
            {isInCollection ? 'Dans la collection' : 'Ajouter'}
          </Button>
          <Button
            size="sm"
            variant={isInWishlist ? "default" : "outline"}
            onClick={() => onAddToWishlist?.(pokemon)}
          >
            <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-current' : ''}`} />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}