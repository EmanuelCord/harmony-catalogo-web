[CmdletBinding()]
param(
    [int]$MaxDimension = 1600,
    [long]$JpegQuality = 82
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$projectRoot = Split-Path -Parent $PSScriptRoot
$sourceRoot = Join-Path $projectRoot 'assets\images\products'
$descriptionsPath = Join-Path $projectRoot 'assets\md\descriptions.md'
$optimizedRoot = Join-Path $projectRoot 'assets\images\catalog'
$dataOutput = Join-Path $projectRoot 'assets\js\products-data.js'
$supportedExtensions = @('.png', '.jpg', '.jpeg', '.webp', '.bmp')
$jpegEncoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
    Where-Object MimeType -eq 'image/jpeg' |
    Select-Object -First 1
$encoderParameters = [System.Drawing.Imaging.EncoderParameters]::new(1)
$encoderParameters.Param[0] = [System.Drawing.Imaging.EncoderParameter]::new(
    [System.Drawing.Imaging.Encoder]::Quality,
    [long]$JpegQuality
)
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)

function ConvertTo-Slug([string]$Value) {
    $normalized = $Value.Normalize([Text.NormalizationForm]::FormD)
    $builder = [System.Text.StringBuilder]::new()
    foreach ($character in $normalized.ToCharArray()) {
        if ([Globalization.CharUnicodeInfo]::GetUnicodeCategory($character) -ne [Globalization.UnicodeCategory]::NonSpacingMark) {
            [void]$builder.Append($character)
        }
    }

    $slug = $builder.ToString().ToLowerInvariant() -replace '[^a-z0-9]+', '-'
    return $slug.Trim('-')
}

function Get-ProductCategory([string]$ProductName) {
    if ($ProductName -match '^Banco\b') {
        return 'bancos'
    }

    if ($ProductName -match 'Abductor|Gluteador|Hack|N[oó]rdic|Prensa|Sill[oó]n|Hip Thrust|B[uú]lgara') {
        return 'piernas'
    }

    return 'fuerza'
}

if (-not (Test-Path -LiteralPath $sourceRoot)) {
    throw "No se encontró la carpeta de fotos fuente: $sourceRoot"
}

if (-not (Test-Path -LiteralPath $descriptionsPath)) {
    throw "No se encontró el archivo de descripciones: $descriptionsPath"
}

if ($MaxDimension -lt 640 -or $MaxDimension -gt 2400) {
    throw 'MaxDimension debe estar entre 640 y 2400 píxeles.'
}

if ($JpegQuality -lt 45 -or $JpegQuality -gt 95) {
    throw 'JpegQuality debe estar entre 45 y 95.'
}

New-Item -ItemType Directory -Force -Path $optimizedRoot, (Split-Path -Parent $dataOutput) | Out-Null
$descriptionMarkdown = [System.IO.File]::ReadAllText($descriptionsPath, [System.Text.Encoding]::UTF8)
$descriptionEntries = [regex]::Matches(
    $descriptionMarkdown,
    '(?ms)^\s*\*\s+\*\*(?<name>[^*]+):\*\*\s*(?<description>.*?)(?=^\s*\*\s+\*\*|^##|\z)'
)
$descriptions = @{}
foreach ($entry in $descriptionEntries) {
    $productName = $entry.Groups['name'].Value.Trim()
    $description = ($entry.Groups['description'].Value -replace '\s+', ' ').Trim()
    if ($productName -and $description) {
        $descriptions[$productName] = $description
    }
}

$products = [System.Collections.Generic.List[object]]::new()
$sourceFolders = Get-ChildItem -LiteralPath $sourceRoot -Directory | Sort-Object Name

foreach ($folder in $sourceFolders) {
    if (-not $descriptions.ContainsKey($folder.Name)) {
        throw "Falta una descripción para '$($folder.Name)' en assets/md/descriptions.md."
    }

    $sourceImages = @(
        Get-ChildItem -LiteralPath $folder.FullName -File |
            Where-Object { $supportedExtensions -contains $_.Extension.ToLowerInvariant() } |
            Sort-Object Name
    )

    if ($sourceImages.Count -eq 0) {
        Write-Warning "Se omite '$($folder.Name)': no contiene imágenes compatibles."
        continue
    }

    $slug = ConvertTo-Slug $folder.Name
    $productOutput = Join-Path $optimizedRoot $slug
    New-Item -ItemType Directory -Force -Path $productOutput | Out-Null
    $imagePaths = [System.Collections.Generic.List[string]]::new()

    for ($index = 0; $index -lt $sourceImages.Count; $index++) {
        $sourceImage = $sourceImages[$index]
        $sourceBitmap = [System.Drawing.Image]::FromFile($sourceImage.FullName)
        $scale = [Math]::Min(1.0, $MaxDimension / [double][Math]::Max($sourceBitmap.Width, $sourceBitmap.Height))
        $width = [Math]::Max(1, [int][Math]::Round($sourceBitmap.Width * $scale))
        $height = [Math]::Max(1, [int][Math]::Round($sourceBitmap.Height * $scale))
        $bitmap = [System.Drawing.Bitmap]::new(
            $width,
            $height,
            [System.Drawing.Imaging.PixelFormat]::Format24bppRgb
        )
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        $graphics.Clear([System.Drawing.Color]::FromArgb(10, 10, 12))
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics.DrawImage($sourceBitmap, 0, 0, $width, $height)

        $filename = '{0:D2}.jpg' -f ($index + 1)
        $outputPath = Join-Path $productOutput $filename
        $bitmap.Save($outputPath, $jpegEncoder, $encoderParameters)
        $graphics.Dispose()
        $bitmap.Dispose()
        $sourceBitmap.Dispose()

        $imagePaths.Add("assets/images/catalog/$slug/$filename")
    }

    $category = Get-ProductCategory $folder.Name
    $categoryLabel = switch ($category) {
        'bancos' { 'Bancos & Estaciones' }
        'piernas' { 'Tren Inferior / Piernas' }
        default { 'Fuerza / Tren Superior' }
    }

    $catalogLabel = 'Cat' + [char]0x00E1 + 'logo HARMONY'
    $photoLabel = 'Fotograf' + [char]0x00ED + 'as disponibles'
    $categoryLabelText = 'Categor' + [char]0x00ED + 'a'
    $lineLabel = 'l' + [char]0x00ED + 'nea profesional'
    $installationLabel = 'instalaci' + [char]0x00F3 + 'n'
    $configurationLabel = 'configuraci' + [char]0x00F3 + 'n'

    $products.Add([PSCustomObject]@{
        id = $slug
        name = $folder.Name
        category = $category
        categoryLabel = $categoryLabel
        subtitle = "$catalogLabel - $categoryLabel"
        image = $imagePaths[0]
        images = @($imagePaths)
        description = $descriptions[$folder.Name]
        specs = @(
            "${photoLabel}: $($imagePaths.Count)."
            "${categoryLabelText}: $categoryLabel."
            'Consulta con nuestro equipo para conocer medidas, disponibilidad y especificaciones.'
        )
        usage = "Solicita asesoramiento para recibir recomendaciones de $installationLabel, $configurationLabel y uso del equipo."
    })

    Write-Host ("{0}: {1} imágenes preparadas" -f $folder.Name, $imagePaths.Count)
}

$json = ConvertTo-Json -InputObject @($products) -Depth 6
$data = "window.HARMONY_PRODUCTS = $json;`n"
[System.IO.File]::WriteAllText($dataOutput, $data, $utf8NoBom)
$encoderParameters.Dispose()

Write-Host ("Catálogo listo: {0} productos, {1} imágenes." -f $products.Count, (($products | ForEach-Object { $_.images.Count } | Measure-Object -Sum).Sum))
Write-Host "Datos guardados en: $dataOutput"