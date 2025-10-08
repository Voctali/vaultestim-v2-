import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export function ImportBackup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [currentUser, setCurrentUser] = useState(null)
  const [backupData, setBackupData] = useState(null)
  const [stats, setStats] = useState({ cards: 0, series: 0, blocks: 0, extensions: 0 })
  const [progress, setProgress] = useState(0)
  const [logs, setLogs] = useState([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, { message, type, timestamp }])
  }

  const handleLogin = async (e) => {
    e.preventDefault()

    try {
      addLog('🔄 Connexion en cours...', 'warning')

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      setCurrentUser(data.user)
      addLog(`✅ Connecté: ${data.user.email}`, 'success')
    } catch (error) {
      addLog(`❌ Erreur: ${error.message}`, 'error')
    }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result)

        if (!json.data || !json.data.database) {
          throw new Error('Format de backup invalide')
        }

        const db = json.data.database
        setBackupData(db)
        setStats({
          cards: db.discoveredCards?.length || 0,
          series: db.seriesDatabase?.length || 0,
          blocks: db.customBlocks?.length || 0,
          extensions: db.customExtensions?.length || 0
        })

        addLog(`✅ Fichier chargé: ${file.name}`, 'success')
        addLog(`📦 ${db.discoveredCards?.length || 0} cartes trouvées`, 'success')
      } catch (error) {
        addLog(`❌ Erreur: ${error.message}`, 'error')
      }
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (!currentUser || !backupData) {
      addLog('❌ Veuillez vous connecter et charger un fichier', 'error')
      return
    }

    setImporting(true)
    setProgress(0)
    const startTime = Date.now()
    const userId = currentUser.id

    try {
      // Étape 1: Importer les cartes (par batch de 500)
      const cards = backupData.discoveredCards || []
      if (cards.length > 0) {
        addLog(`📦 Import de ${cards.length} cartes...`, 'warning')

        const BATCH_SIZE = 500
        for (let i = 0; i < cards.length; i += BATCH_SIZE) {
          const batch = cards.slice(i, i + BATCH_SIZE)
          const cardsWithUserId = batch.map(card => ({
            ...card,
            user_id: userId
          }))

          const { error } = await supabase
            .from('discovered_cards')
            .upsert(cardsWithUserId, { onConflict: 'id,user_id' })

          if (error) throw error

          setProgress(Math.min(25, ((i + BATCH_SIZE) / cards.length) * 25))
          addLog(`  ✅ Batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(cards.length/BATCH_SIZE)} importé`, 'success')
        }
      }

      // Étape 2: Importer les extensions
      const series = backupData.seriesDatabase || []
      if (series.length > 0) {
        setProgress(50)
        addLog(`📦 Import de ${series.length} extensions...`, 'warning')

        const seriesWithUserId = series.map(s => ({
          ...s,
          user_id: userId
        }))

        const { error } = await supabase
          .from('series_database')
          .upsert(seriesWithUserId, { onConflict: 'id,user_id' })

        if (error) throw error
        addLog(`✅ ${series.length} extensions importées!`, 'success')
      }

      // Étape 3: Importer les blocs
      const blocks = backupData.customBlocks || []
      if (blocks.length > 0) {
        setProgress(75)
        addLog(`📦 Import de ${blocks.length} blocs...`, 'warning')

        const blocksWithUserId = blocks.map(b => ({
          ...b,
          user_id: userId
        }))

        const { error } = await supabase
          .from('custom_blocks')
          .upsert(blocksWithUserId, { onConflict: 'id,user_id' })

        if (error) throw error
        addLog(`✅ ${blocks.length} blocs importés!`, 'success')
      }

      // Étape 4: Importer les extensions déplacées
      const customExt = backupData.customExtensions || []
      if (customExt.length > 0) {
        setProgress(90)
        addLog(`📦 Import de ${customExt.length} extensions déplacées...`, 'warning')

        const extWithUserId = customExt.map(e => ({
          ...e,
          user_id: userId
        }))

        const { error } = await supabase
          .from('custom_extensions')
          .upsert(extWithUserId, { onConflict: 'series_id,user_id' })

        if (error) throw error
        addLog(`✅ ${customExt.length} extensions déplacées importées!`, 'success')
      }

      setProgress(100)
      const duration = Math.round((Date.now() - startTime) / 1000)
      addLog(`🎉 Import terminé en ${duration}s!`, 'success')

      setResult({
        success: true,
        cards: cards.length,
        series: series.length,
        blocks: blocks.length,
        customExt: customExt.length,
        duration
      })

    } catch (error) {
      addLog(`❌ Erreur: ${error.message}`, 'error')
      setResult({ success: false, error: error.message })
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-yellow-500 mb-2 font-['Cinzel']">
            📤 Import Backup vers Supabase
          </h1>
          <p className="text-gray-400">Importez votre fichier JSON directement dans Supabase</p>
        </div>

        {/* Étape 1: Connexion */}
        {!currentUser && (
          <div className="bg-gray-800/50 border border-yellow-500/20 rounded-xl p-6 mb-6">
            <h2 className="text-2xl font-bold text-yellow-500 mb-4">🔐 Étape 1: Connexion</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="email"
                placeholder="Email Supabase"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900/50 border border-yellow-500/20 rounded-lg text-white"
              />
              <input
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900/50 border border-yellow-500/20 rounded-lg text-white"
              />
              <button
                type="submit"
                className="w-full px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold rounded-lg hover:scale-105 transition"
              >
                🔑 Se connecter
              </button>
            </form>
          </div>
        )}

        {/* Étape 2: Upload fichier */}
        {currentUser && !backupData && (
          <div className="bg-gray-800/50 border border-yellow-500/20 rounded-xl p-6 mb-6">
            <h2 className="text-2xl font-bold text-yellow-500 mb-4">📁 Étape 2: Charger le backup</h2>
            <div className="text-green-500 mb-4">✅ Connecté: {currentUser.email}</div>
            <label className="block w-full p-8 border-2 border-dashed border-yellow-500/30 rounded-lg cursor-pointer hover:border-yellow-500/60 transition text-center">
              <div className="text-gray-400">
                📂 Cliquez pour sélectionner votre fichier JSON
                <br />
                <small>vaultestim-backup-2025-10-08T17-16-36.json</small>
              </div>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* Étape 3: Statistiques et Import */}
        {backupData && (
          <div className="bg-gray-800/50 border border-yellow-500/20 rounded-xl p-6 mb-6">
            <h2 className="text-2xl font-bold text-yellow-500 mb-4">📊 Données à importer</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-500">{stats.cards}</div>
                <div className="text-gray-400 text-sm">Cartes</div>
              </div>
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-500">{stats.series}</div>
                <div className="text-gray-400 text-sm">Extensions</div>
              </div>
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-500">{stats.blocks}</div>
                <div className="text-gray-400 text-sm">Blocs</div>
              </div>
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-500">{stats.extensions}</div>
                <div className="text-gray-400 text-sm">Ext. déplacées</div>
              </div>
            </div>

            <button
              onClick={handleImport}
              disabled={importing}
              className="w-full px-6 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold text-xl rounded-lg hover:scale-105 transition disabled:opacity-50"
            >
              {importing ? '⏳ Import en cours...' : '📤 Importer vers Supabase'}
            </button>
          </div>
        )}

        {/* Progression */}
        {importing && (
          <div className="bg-gray-800/50 border border-yellow-500/20 rounded-xl p-6 mb-6">
            <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
              <div
                className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Logs */}
        {logs.length > 0 && (
          <div className="bg-black/50 border border-yellow-500/20 rounded-xl p-4 mb-6">
            <div className="font-mono text-sm max-h-96 overflow-y-auto">
              {logs.map((log, i) => (
                <div
                  key={i}
                  className={`mb-1 ${
                    log.type === 'success' ? 'text-green-500' :
                    log.type === 'error' ? 'text-red-500' :
                    log.type === 'warning' ? 'text-yellow-500' :
                    'text-gray-400'
                  }`}
                >
                  [{log.timestamp}] {log.message}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Résultat */}
        {result && (
          <div className={`border rounded-xl p-6 ${
            result.success
              ? 'bg-green-500/10 border-green-500/20'
              : 'bg-red-500/10 border-red-500/20'
          }`}>
            <h2 className={`text-2xl font-bold mb-4 ${
              result.success ? 'text-green-500' : 'text-red-500'
            }`}>
              {result.success ? '🎉 Import réussi!' : '❌ Erreur'}
            </h2>

            {result.success ? (
              <div className="space-y-2 text-gray-300">
                <p>✅ {result.cards} cartes importées</p>
                <p>✅ {result.series} extensions importées</p>
                <p>✅ {result.blocks} blocs importés</p>
                <p>✅ {result.customExt} extensions déplacées importées</p>
                <p>⏱️ Durée: {result.duration}s</p>

                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="font-bold text-blue-400 mb-2">🎯 Prochaines étapes:</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Ouvrez <a href="/clean-storage.html" className="text-yellow-500 underline">la page de nettoyage</a></li>
                    <li>Nettoyez le localStorage</li>
                    <li>Allez sur <a href="/login" className="text-yellow-500 underline">la page de connexion</a></li>
                    <li>Connectez-vous avec vos identifiants Supabase</li>
                    <li>Profitez de la synchronisation! 🚀</li>
                  </ol>
                </div>
              </div>
            ) : (
              <p className="text-red-400">{result.error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
