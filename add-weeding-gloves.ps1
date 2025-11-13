# Script pour ajouter la traduction "gants désherbants"
$filePath = "F:\Logiciels\Appli Vaultestim\vaultestim-v2\src\utils\trainerTranslations.js"

# Lire le contenu
$content = Get-Content -Path $filePath -Raw -Encoding UTF8

# Mise à jour de la version
$content = $content -replace "TRAINER_TRANSLATIONS_VERSION = '1\.9\.2' // Dernière mise à jour: 2025-01-07 - Ajout `"hunting gloves`"", "TRAINER_TRANSLATIONS_VERSION = '1.9.3' // Dernière mise à jour: 2025-01-09 - Ajout `"weeding gloves`""

# Ajout de la traduction après "gants de chasse"
$oldText = "  'gants de chasse': 'hunting gloves', // Objet Dresseur`r`n  'recycleur d\'énergie': 'energy recycler', // Objet"
$newText = "  'gants de chasse': 'hunting gloves', // Objet Dresseur`r`n  'gants désherbants': 'weeding gloves', // Objet Dresseur`r`n  'gants desherbants': 'weeding gloves', // Variante sans accent`r`n  'recycleur d\'énergie': 'energy recycler', // Objet"

$content = $content -replace [regex]::Escape($oldText), $newText

# Écrire le contenu modifié
$content | Set-Content -Path $filePath -Encoding UTF8 -NoNewline

Write-Host "Traduction ajoutée avec succès !" -ForegroundColor Green
