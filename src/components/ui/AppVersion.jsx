/**
 * Composant d'affichage de la version de l'application
 */

import { APP_VERSION, APP_NAME, BUILD_DATE } from '@/version'

export function AppVersion({ showBuildDate = false, className = '' }) {
  return (
    <div className={`text-xs text-muted-foreground ${className}`}>
      <span className="font-medium">{APP_NAME}</span>
      <span className="ml-1">v{APP_VERSION}</span>
      {showBuildDate && (
        <span className="ml-2 opacity-70">({BUILD_DATE})</span>
      )}
    </div>
  )
}

export function AppVersionBadge({ className = '' }) {
  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 ${className}`}>
      <span className="text-xs font-medium text-amber-400">
        v{APP_VERSION}
      </span>
    </div>
  )
}
