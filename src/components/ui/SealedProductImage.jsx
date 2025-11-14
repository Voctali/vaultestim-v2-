import { Package } from 'lucide-react'

/**
 * Composant d'image produit scellé avec fallback intelligent
 */
export function SealedProductImage({ src, alt, className = '', size = 'medium' }) {
  const sizeClasses = {
    small: 'w-24 h-24',
    medium: 'w-40 h-40',
    large: 'w-full h-40'
  }

  const handleError = (e) => {
    // Fallback: essayer .jpg si .png échoue
    if (e.target.src.endsWith('.png')) {
      e.target.src = e.target.src.replace('.png', '.jpg')
    } else if (e.target.src.endsWith('.jpg')) {
      // Si .jpg échoue aussi, afficher placeholder
      e.target.style.display = 'none'
      if (e.target.nextSibling) {
        e.target.nextSibling.style.display = 'flex'
      }
    }
  }

  return (
    <div className="relative">
      {src && (
        <img
          src={src}
          alt={alt}
          className={`${sizeClasses[size] || sizeClasses.medium} object-contain bg-slate-100 dark:bg-slate-800 rounded`}
          referrerPolicy="no-referrer"
          onError={handleError}
        />
      )}
      {/* Placeholder si image échoue */}
      <div
        className={`${sizeClasses[size] || sizeClasses.medium} bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 rounded flex items-center justify-center ${!src ? 'flex' : 'hidden'}`}
        style={{ display: !src ? 'flex' : 'none' }}
      >
        <Package className="w-12 h-12 text-purple-500 dark:text-purple-300" />
      </div>
    </div>
  )
}
