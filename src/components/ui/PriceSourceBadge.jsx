import React from 'react'
import { cn } from '@/lib/utils'

/**
 * Badge indiquant la source des prix d'une carte
 *
 * @param {Object} props
 * @param {string} props.source - Source des prix ('rapidapi' ou 'pokemon-tcg-api')
 * @param {string} props.className - Classes CSS additionnelles
 * @param {'small'|'medium'} props.size - Taille du badge (défaut: small)
 */
export function PriceSourceBadge({ source, className, size = 'small' }) {
  if (!source) return null

  const isRapidAPI = source === 'rapidapi'

  const sizeClasses = {
    small: 'text-[10px] px-1.5 py-0.5',
    medium: 'text-xs px-2 py-1'
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded font-medium transition-all',
        sizeClasses[size],
        isRapidAPI
          ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-400 border border-amber-500/30'
          : 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-400 border border-blue-500/30',
        className
      )}
      title={isRapidAPI
        ? 'Prix RapidAPI - EUR précis avec détails par pays et prix gradées'
        : 'Prix Pokemon TCG API - EUR via fallback gratuit'
      }
    >
      <span className="text-[11px]" aria-hidden="true">
        {isRapidAPI ? '🚀' : '📊'}
      </span>
      <span className="hidden sm:inline">
        {isRapidAPI ? 'RapidAPI' : 'Pokemon'}
      </span>
    </span>
  )
}
