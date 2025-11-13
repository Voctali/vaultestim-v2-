$file = "F:\Logiciels\Appli Vaultestim\vaultestim-v2\src\utils\trainerTranslations.js"
$content = Get-Content $file -Raw -Encoding UTF8

$old = "  'gants desherbants': 'weeding gloves', // Variante sans accent"
$new = @"
  'gants desherbants': 'weeding gloves', // Variante sans accent
  'gants dévastateurs': 'crushing gloves', // Objet Dresseur
  'gants devastateurs': 'crushing gloves', // Variante sans accent
"@

$content = $content.Replace($old, $new)
$content | Out-File $file -Encoding UTF8 -NoNewline

Write-Host "Done!" -ForegroundColor Green
