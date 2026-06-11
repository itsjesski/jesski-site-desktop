$ErrorActionPreference = 'Stop'

Write-Host "Starting optimized build process..."

$env:NODE_OPTIONS = '--max-old-space-size=4096'
$env:GENERATE_SOURCEMAP = 'false'
$env:DISABLE_ESLINT_PLUGIN = 'true'

Write-Host "Cleaning previous builds..."
$buildDirs = @('dist', 'build', '.next', 'out')
foreach ($dir in $buildDirs) {
  if (Test-Path $dir) {
    Remove-Item $dir -Recurse -Force -ErrorAction SilentlyContinue
  }
}

Write-Host "Installing dependencies..."
npm ci --silent --no-audit --no-fund --prefer-offline
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Building application..."
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Optimizing build output..."
if (Test-Path 'dist') {
  Get-ChildItem 'dist' -Recurse -Filter '*.map' -File -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
}

$gzipCommand = Get-Command gzip -ErrorAction SilentlyContinue
if ($gzipCommand -and (Test-Path 'dist')) {
  $compressibleFiles = Get-ChildItem 'dist' -Recurse -File | Where-Object { $_.Extension -in @('.js', '.css', '.html') }
  foreach ($file in $compressibleFiles) {
    & gzip -9 -k $file.FullName
  }
  Write-Host "Compressed static assets"
}

if (Test-Path 'dist') {
  $files = Get-ChildItem 'dist' -Recurse -File
  $totalBytes = ($files | Measure-Object -Property Length -Sum).Sum
  if (-not $totalBytes) { $totalBytes = 0 }

  if ($totalBytes -ge 1MB) {
    $sizeText = '{0:N2} MB' -f ($totalBytes / 1MB)
  } elseif ($totalBytes -ge 1KB) {
    $sizeText = '{0:N2} KB' -f ($totalBytes / 1KB)
  } else {
    $sizeText = "$totalBytes B"
  }

  Write-Host "Build size: $sizeText"
  Write-Host "Largest build files:"
  $files |
    Sort-Object Length -Descending |
    Select-Object -First 5 FullName, @{ Name = 'SizeKB'; Expression = { '{0:N2}' -f ($_.Length / 1KB) } } |
    Format-Table -AutoSize
}

Write-Host "Build optimization complete!"
Write-Host "Ready for deployment to Digital Ocean"
