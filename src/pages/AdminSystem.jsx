import { Settings } from 'lucide-react'
import { BackendDataViewer } from '@/components/features/settings/BackendDataViewer'
import { DataMigration } from '@/components/features/settings/DataMigration'

export function AdminSystem() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold golden-glow flex items-center">
            <Settings className="w-8 h-8 mr-3" />
            Système
          </h1>
          <p className="text-muted-foreground">
            Gestion des données et migration du système
          </p>
        </div>
      </div>

      {/* Données serveur */}
      <BackendDataViewer />

      {/* Migration de données */}
      <DataMigration />
    </div>
  )
}
