import { Settings } from 'lucide-react'
import { BackendDataViewer } from '@/components/features/settings/BackendDataViewer'
import { DataMigration } from '@/components/features/settings/DataMigration'
import { QuotaAlert } from '@/components/ui/QuotaAlert'
import { PriceRefreshToggle } from '@/components/features/admin/PriceRefreshToggle'
import { SealedPriceRefreshToggle } from '@/components/features/admin/SealedPriceRefreshToggle'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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

      {/* Quota RapidAPI */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 Quota RapidAPI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <QuotaAlert />
        </CardContent>
      </Card>

      {/* Actualisation automatique des prix */}
      <div className="grid gap-6 md:grid-cols-2">
        <PriceRefreshToggle />
        <SealedPriceRefreshToggle />
      </div>

      {/* Données serveur */}
      <BackendDataViewer />

      {/* Migration de données */}
      <DataMigration />
    </div>
  )
}
