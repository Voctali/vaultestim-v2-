import { useState } from 'react'

export function CardImage({ card, className }) {
  const [imageError, setImageError] = useState(false)

  const handleImageError = () => {
    setImageError(true)
  }

  const Placeholder = () => (
    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-dashed border-primary/40 flex flex-col items-center justify-center text-xs text-muted-foreground">
      <div className="text-primary text-3xl mb-2">🃏</div>
      <div className="text-center px-2">
        <div className="text-primary font-semibold text-sm mb-1">{card.name}</div>
        <div className="text-xs text-primary/60">{card.setName || 'Extension'}</div>
        <div className="text-xs mt-2 text-muted-foreground">Image non disponible</div>
      </div>
    </div>
  )

  // Récupérer l'URL de l'image depuis tous les champs possibles
  const imageUrl = card.image || card.images?.large || card.images?.small || card.imageUrl

  // Si pas d'image ou si l'image a échoué, afficher le placeholder
  if (!imageUrl || imageError) {
    return <Placeholder />
  }

  // Afficher l'image de la carte TCG
  return (
    <img
      src={imageUrl}
      alt={card.name}
      className={className}
      loading="lazy"
      onError={handleImageError}
    />
  )
}
