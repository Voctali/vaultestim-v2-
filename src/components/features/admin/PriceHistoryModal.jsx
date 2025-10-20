import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PriceHistoryChart } from './PriceHistoryChart'
import { UserSealedProductsService } from '@/services/UserSealedProductsService'

export function PriceHistoryModal({ isOpen, onClose, product }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen && product) {
      loadHistory()
    }
  }, [isOpen, product])

  const loadHistory = async () => {
    try {
      setLoading(true)
      const data = await UserSealedProductsService.getPriceHistory(product.id)
      setHistory(data)
    } catch (error) {
      console.error('❌ Erreur chargement historique:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Historique des Prix</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Chargement de l'historique...</p>
          </div>
        ) : (
          <PriceHistoryChart history={history} productName={product?.name} />
        )}
      </DialogContent>
    </Dialog>
  )
}
