# Local preview: http://localhost:5173/
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

$env:PORT = '5173'
$env:BASE_PATH = '/'
$env:LOCAL_MOCK = '1'
$env:NODE_ENV = 'development'

Write-Host "Starting Vite on http://localhost:5173/ ..." -ForegroundColor Cyan
& "$env:ProgramFiles\nodejs\npx.cmd" vite --config vite.config.ts --host 0.0.0.0 --port 5173
