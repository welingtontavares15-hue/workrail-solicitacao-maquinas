# ═══════════════════════════════════════════════════════════════
# WORKRAIL v2.1 Deployment Script
# Firebase Hosting Deployment
# ═══════════════════════════════════════════════════════════════

param(
  [switch]$Force,
  [switch]$Preview,
  [switch]$Serve,
  [switch]$NoPrompt
)

# ═══════════════════════════════════════════════════════════════
# UTILITY FUNCTIONS
# ═══════════════════════════════════════════════════════════════

function Write-Header {
  Write-Host ""
  Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
  Write-Host "║  WORKRAIL v2.1 — Deploy Automático Firebase Hosting   ║" -ForegroundColor Cyan
  Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
  Write-Host ""
}

function Write-Info($msg) { Write-Host "ℹ️  $msg" -ForegroundColor Cyan }
function Write-Success($msg) { Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Error($msg) { Write-Host "❌ $msg" -ForegroundColor Red }
function Write-Warning($msg) { Write-Host "⚠️  $msg" -ForegroundColor Yellow }

# ═══════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════

Write-Header

# Check Firebase CLI
Write-Info "Verificando Firebase CLI..."
firebase --version
if ($LASTEXITCODE -ne 0) {
  Write-Error "Firebase CLI não encontrado!"
  Write-Warning "Instale com: npm install -g firebase-tools"
  exit 1
}
Write-Success "Firebase CLI detectado"

# Check Node.js
Write-Info "Verificando Node.js..."
node --version
if ($LASTEXITCODE -ne 0) {
  Write-Error "Node.js não encontrado!"
  exit 1
}
Write-Success "Node.js detectado"

# Handle deployment options
if ($Serve) {
  Write-Info ""
  Write-Info "Iniciando servidor de desenvolvimento..."
  firebase serve --only hosting
  exit 0
}

if ($Preview) {
  $channelId = "preview-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
  Write-Info ""
  Write-Info "Criando versão prévia: $channelId"
  firebase hosting:channel:deploy $channelId
  exit 0
}

# Check for uncommitted changes
$gitStatus = git status --porcelain 2>$null
if ($gitStatus -and -not $Force) {
  Write-Warning "Alterações não commitadas detectadas:"
  Write-Host $gitStatus
  if (-not $NoPrompt) {
    $continue = Read-Host "Deseja continuar? (S/N)"
    if ($continue -ne "S") {
      exit 1
    }
  }
}

# Deploy
Write-Info ""
Write-Info "🚀 Iniciando deploy..."
firebase deploy --only hosting --project workrail-solenis

if ($LASTEXITCODE -eq 0) {
  Write-Host ""
  Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
  Write-Host "║  ✅ DEPLOY CONCLUÍDO COM SUCESSO!                    ║" -ForegroundColor Green
  Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Green
  Write-Host ""
  Write-Success "Sistema disponível em:"
  Write-Host "   https://workrail-solenis.web.app" -ForegroundColor Cyan
  Write-Host ""
  Write-Success "Dicas:"
  Write-Host "   • Limpe o cache: Ctrl+Shift+Del" -ForegroundColor Gray
  Write-Host "   • Hard refresh: Ctrl+Shift+R" -ForegroundColor Gray
  Write-Host "   • Verifique console: F12" -ForegroundColor Gray
  Write-Host ""
} else {
  Write-Host ""
  Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Red
  Write-Host "║  ❌ ERRO NO DEPLOY!                                  ║" -ForegroundColor Red
  Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Red
  Write-Host ""
  Write-Warning "Tente novamente ou execute: firebase login"
  Write-Warning "Para mais informações: firebase hosting:channels:list"
  Write-Host ""
  exit 1
}
