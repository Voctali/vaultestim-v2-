/**
 * Composant d'upload de fichiers JSON/CSV pour la base de données
 */
import React, { useState, useRef } from 'react'
import { Upload, File, AlertCircle, CheckCircle, X, Eye, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { UploadService } from '@/services/UploadService'

export function FileUpload({ onUpload }) {
  const [dragActive, setDragActive] = useState(false)
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState([])
  const [preview, setPreview] = useState(null)
  const fileInputRef = useRef(null)

  // Types de fichiers acceptés
  const acceptedTypes = {
    'application/json': '.json',
    'text/csv': '.csv',
    'application/vnd.ms-excel': '.csv',
    'text/plain': '.csv'
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    processFiles(droppedFiles)
  }

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files)
    processFiles(selectedFiles)
  }

  const processFiles = (newFiles) => {
    const validFiles = []
    const newErrors = []

    newFiles.forEach(file => {
      // Validation du type de fichier
      if (!Object.keys(acceptedTypes).includes(file.type) &&
          !file.name.toLowerCase().endsWith('.json') &&
          !file.name.toLowerCase().endsWith('.csv')) {
        newErrors.push(`${file.name}: Type de fichier non supporté`)
        return
      }

      // Validation de la taille (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        newErrors.push(`${file.name}: Fichier trop volumineux (max 10MB)`)
        return
      }

      validFiles.push({
        file,
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.name.toLowerCase().endsWith('.json') ? 'json' : 'csv',
        status: 'pending'
      })
    })

    setFiles(prev => [...prev, ...validFiles])
    setErrors(newErrors)
  }

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
    if (preview && preview.id === fileId) {
      setPreview(null)
    }
  }

  const previewFile = async (fileData) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const content = e.target.result
      let parsedData = null
      let error = null

      try {
        if (fileData.type === 'json') {
          parsedData = JSON.parse(content)
        } else if (fileData.type === 'csv') {
          // Parse CSV simple
          const lines = content.split('\n').filter(line => line.trim())
          const headers = lines[0].split(',').map(h => h.trim())
          const rows = lines.slice(1, 6).map(line => {
            const values = line.split(',').map(v => v.trim())
            return headers.reduce((obj, header, index) => {
              obj[header] = values[index] || ''
              return obj
            }, {})
          })
          parsedData = { headers, preview: rows, totalRows: lines.length - 1 }
        }
      } catch (err) {
        error = `Erreur de parsing: ${err.message}`
      }

      setPreview({
        id: fileData.id,
        name: fileData.name,
        type: fileData.type,
        data: parsedData,
        error
      })
    }

    reader.readAsText(fileData.file)
  }

  const uploadFiles = async () => {
    if (files.length === 0) return

    setUploading(true)
    const results = []

    for (const fileData of files) {
      try {
        console.log(`📤 Upload en cours: ${fileData.name} (${fileData.type})`)

        const formData = new FormData()
        formData.append('file', fileData.file)
        formData.append('type', fileData.type)

        // Appel réel à l'API
        const response = await UploadService.uploadFile(fileData.file, fileData.type)
        console.log(`✅ Upload réussi: ${fileData.name}`, response)

        // Mettre à jour le statut
        setFiles(prev => prev.map(f =>
          f.id === fileData.id
            ? { ...f, status: 'success' }
            : f
        ))

        results.push({
          file: fileData.name,
          status: 'success',
          message: response.message || `${fileData.name} importé avec succès`,
          stats: response.processed || {}
        })

      } catch (error) {
        console.error(`❌ Erreur upload ${fileData.name}:`, error)

        setFiles(prev => prev.map(f =>
          f.id === fileData.id
            ? { ...f, status: 'error', error: error.message }
            : f
        ))

        results.push({
          file: fileData.name,
          status: 'error',
          message: error.message || `Erreur lors de l'import de ${fileData.name}`
        })
      }
    }

    setUploading(false)

    if (onUpload) {
      onUpload(results)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      {/* Zone de drop */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importer des fichiers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">
              Glissez vos fichiers ici
            </h3>
            <p className="text-muted-foreground mb-4">
              ou cliquez pour sélectionner des fichiers
            </p>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              Sélectionner des fichiers
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".json,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="mt-4 text-sm text-muted-foreground">
              <p>Formats supportés: JSON, CSV</p>
              <p>Taille maximale: 10MB par fichier</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Erreurs */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div>Erreurs détectées:</div>
            <ul className="mt-2 list-disc list-inside">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Liste des fichiers */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Fichiers sélectionnés ({files.length})</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFiles([])}
                  disabled={uploading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Tout effacer
                </Button>
                <Button
                  onClick={uploadFiles}
                  disabled={uploading || files.length === 0}
                >
                  <Database className="h-4 w-4 mr-2" />
                  {uploading ? 'Import en cours...' : 'Importer'}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {files.map((fileData) => (
                <div
                  key={fileData.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <File className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{fileData.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatFileSize(fileData.size)} • {fileData.type.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {fileData.status === 'success' && (
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Importé
                      </Badge>
                    )}
                    {fileData.status === 'error' && (
                      <Badge variant="destructive">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Erreur
                      </Badge>
                    )}
                    {fileData.status === 'pending' && (
                      <Badge variant="secondary">
                        En attente
                      </Badge>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => previewFile(fileData)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFile(fileData.id)}
                      disabled={uploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prévisualisation */}
      {preview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Prévisualisation: {preview.name}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreview(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {preview.error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{preview.error}</AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {preview.type === 'json' && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Structure JSON détectée:
                    </p>
                    <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto max-h-64">
                      {JSON.stringify(preview.data, null, 2)}
                    </pre>
                  </div>
                )}

                {preview.type === 'csv' && preview.data && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {preview.data.totalRows} lignes détectées, aperçu des 5 premières:
                    </p>
                    <div className="overflow-auto">
                      <table className="w-full border-collapse border border-border">
                        <thead>
                          <tr className="bg-muted">
                            {preview.data.headers.map((header, index) => (
                              <th key={index} className="border border-border p-2 text-left">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {preview.data.preview.map((row, index) => (
                            <tr key={index}>
                              {preview.data.headers.map((header, cellIndex) => (
                                <td key={cellIndex} className="border border-border p-2">
                                  {row[header]}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}