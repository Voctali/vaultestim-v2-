$filePath = "F:\Logiciels\Appli Vaultestim\vaultestim-v2\src\utils\trainerTranslations.js"

Write-Host "Recherche des processus utilisant le fichier..." -ForegroundColor Yellow

# Méthode 1 : Vérifier les handles ouverts
$processes = Get-Process | ForEach-Object {
    try {
        $processName = $_.Name
        $processId = $_.Id

        # Tenter d'ouvrir le fichier en mode exclusif
        $fileStream = $null
        try {
            $fileStream = [System.IO.File]::Open($filePath, 'Open', 'ReadWrite', 'None')
            $fileStream.Close()
        } catch {
            if ($_.Exception.Message -like "*being used by another process*") {
                [PSCustomObject]@{
                    ProcessName = $processName
                    ProcessId = $processId
                    Status = "Peut bloquer le fichier"
                }
            }
        }
    } catch {
        # Ignorer les erreurs d'accès aux processus
    }
}

if ($processes) {
    Write-Host "`nProcessus suspects trouvés:" -ForegroundColor Red
    $processes | Format-Table -AutoSize
} else {
    Write-Host "`nAucun processus ne semble bloquer le fichier" -ForegroundColor Green
}

# Vérifier si on peut écrire dans le fichier
Write-Host "`nTest d'écriture..." -ForegroundColor Yellow
try {
    $testStream = [System.IO.File]::Open($filePath, 'Open', 'ReadWrite', 'None')
    $testStream.Close()
    Write-Host "Le fichier peut être modifié sans problème!" -ForegroundColor Green
} catch {
    Write-Host "ERREUR: Le fichier est verrouillé!" -ForegroundColor Red
    Write-Host "Raison: $($_.Exception.Message)" -ForegroundColor Red
}
