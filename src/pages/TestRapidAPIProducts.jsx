import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export function TestRapidAPIProducts() {
  const [search, setSearch] = useState('booster')
  const [limit, setLimit] = useState(100)
  const [offset, setOffset] = useState(0)
  const [results, setResults] = useState('Appuyez sur "Tester" pour voir les résultats...')
  const [loading, setLoading] = useState(false)

  const testEndpoint = async () => {
    setLoading(true)
    setResults('⏳ Chargement...\n\n')

    try {
      const apiKey = import.meta.env.VITE_RAPIDAPI_KEY
      const params = new URLSearchParams({
        search,
        limit: limit.toString(),
        ...(offset > 0 && { offset: offset.toString() })
      })

      const url = `https://cardmarket-api-tcg.p.rapidapi.com/pokemon/products/search?${params}`
      setResults(prev => prev + `📡 URL: ${url}\n\n`)

      const response = await fetch(url, {
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'cardmarket-api-tcg.p.rapidapi.com'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      let output = '✅ Requête réussie!\n\n'
      output += '📊 RÉSULTATS:\n'
      output += `   - Nombre de produits: ${data.data?.length || 0}\n`
      output += `   - Paging: ${JSON.stringify(data.paging || 'Non disponible', null, 2)}\n\n`
      output += '📦 Premiers produits:\n'

      data.data?.slice(0, 10).forEach((product, i) => {
        output += `   ${i+1}. ${product.name} (ID: ${product.id})\n`
      })

      output += '\n📄 Réponse complète:\n'
      output += JSON.stringify(data, null, 2)

      setResults(output)
    } catch (error) {
      setResults(prev => prev + `\n❌ ERREUR:\n${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testPagination = async () => {
    setLoading(true)
    setResults('⏳ Test de pagination (3 pages de 20)...\n\n')

    try {
      const apiKey = import.meta.env.VITE_RAPIDAPI_KEY
      let allProducts = []
      let output = ''

      for (let page = 0; page < 3; page++) {
        const offsetValue = page * 20
        output += `📄 Page ${page + 1} (offset=${offsetValue})...\n`

        const params = new URLSearchParams({
          search,
          limit: '20',
          offset: offsetValue.toString()
        })

        const response = await fetch(
          `https://cardmarket-api-tcg.p.rapidapi.com/pokemon/products/search?${params}`,
          {
            headers: {
              'x-rapidapi-key': apiKey,
              'x-rapidapi-host': 'cardmarket-api-tcg.p.rapidapi.com'
            }
          }
        )

        const data = await response.json()
        const count = data.data?.length || 0

        output += `   ✅ ${count} produits récupérés\n`
        allProducts.push(...(data.data || []))

        setResults(output)

        if (count < 20) {
          output += `   ⚠️ Moins de 20 résultats → dernière page\n`
          break
        }
      }

      output += `\n📊 TOTAL: ${allProducts.length} produits récupérés\n\n`
      output += 'Premiers produits:\n'
      allProducts.slice(0, 15).forEach((p, i) => {
        output += `   ${i+1}. ${p.name}\n`
      })

      setResults(output)
    } catch (error) {
      setResults(prev => prev + `\n❌ ERREUR: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-white font-cinzel">
            🧪 Test RapidAPI Products
          </h1>
          <p className="text-gray-300">
            Testez l'endpoint /pokemon/products/search pour vérifier la pagination
          </p>
        </div>

        <div className="space-y-6">
          {/* Contrôles */}
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Recherche</label>
                <Input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="booster"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Limit</label>
                  <Input
                    type="number"
                    value={limit}
                    onChange={(e) => setLimit(parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Offset</label>
                  <Input
                    type="number"
                    value={offset}
                    onChange={(e) => setOffset(parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={testEndpoint}
                  disabled={loading}
                  className="flex-1"
                >
                  🚀 Tester
                </Button>
                <Button
                  onClick={testPagination}
                  disabled={loading}
                  variant="outline"
                  className="flex-1"
                >
                  📄 Tester Pagination (3 pages)
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Résultats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Résultats
                {loading && <Badge variant="outline">Chargement...</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-slate-950 p-4 rounded-lg overflow-auto max-h-[600px] text-sm font-mono text-green-400 whitespace-pre-wrap">
                {results}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
