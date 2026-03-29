# ═══════════════════════════════════════════════════════════════
# WORKRAIL v2.3 — Deploy Script
# Firebase: Hosting + Functions + Firestore Rules
# ═══════════════════════════════════════════════════════════════

param(
  [switch]$Force,
  [switch]$Preview,
  [switch]$Serve,
  [switch]$NoPrompt,
  [switch]$FunctionsOnly,
  [switch]$RulesOnly,
  [switch]$HostingOnly,
  [switch]$All
)

# ───────────────────────────────────────────────────────────────
# Funções de UI
# ───────────────────────────────────────────────────────────────

function Write-Header {
  Write-Host ""
  Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
  Write-Host "║     WORKRAIL v2.3 — Deploy Firebase (workrail-solenis) ║" -ForegroundColor Cyan
  Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
  Write-Host ""
}

function Write-Info($msg)    { Write-Host "ℹ️  $msg" -ForegroundColor Cyan }
function Write-Success($msg) { Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Err($msg)     { Write-Host "❌ $msg" -ForegroundColor Red }
function Write-Warn($msg)    { Write-Host "⚠️  $msg" -ForegroundColor Yellow }

# ───────────────────────────────────────────────────────────────
# Verificações de pré-requisitos
# ───────────────────────────────────────────────────────────────

function Check-Prerequisites {
  Write-Info "Verificando Firebase CLI..."
  $fbVersion = firebase --version 2>&1
  if ($LASTEXITCODE -ne 0) {
    Write-Err "Firebase CLI não encontrado!"
    Write-Warn "Instale com: npm install -g firebase-tools"
    exit 1
  }
  Write-Success "Firebase CLI: $fbVersion"

  Write-Info "Verificando Node.js..."
  $nodeVersion = node --version 2>&1
  if ($LASTEXITCODE -ne 0) {
    Write-Err "Node.js não encontrado!"
    Write-Warn "Instale em: https://nodejs.org"
    exit 1
  }
  Write-Success "Node.js: $nodeVersion"

  Write-Info "Verificando projeto Firebase ativo..."
  firebase use workrail-solenis
  if ($LASTEXITCODE -ne 0) {
    Write-Err "Falha ao selecionar projeto workrail-solenis"
    Write-Warn "Execute: firebase login && firebase use workrail-solenis"
    exit 1
  }
  Write-Success "Projeto: workrail-solenis"
}

# ───────────────────────────────────────────────────────────────
# Verificação de FIREBASE_API_KEY (obrigatório para functions)
# ───────────────────────────────────────────────────────────────

function Check-EnvVars {
  if (-not $HostingOnly -and -not $RulesOnly) {
    $apiKey = [System.Environment]::GetEnvironmentVariable("FIREBASE_API_KEY")
    if (-not $apiKey) {
      Write-Warn "FIREBASE_API_KEY não está definido no ambiente!"
      Write-Warn "A Cloud Function getFirebaseConfig retornará erro 500 sem esta variável."
      Write-Info "Configure antes do deploy de functions:"
      Write-Host "  Set-Item Env:FIREBASE_API_KEY 'AIzaSy...'" -ForegroundColor Gray
      Write-Host "  (ou use Secret Manager — veja FIREBASE_MANUAL_CHECKLIST.md)" -ForegroundColor Gray
      if (-not $Force -and -not $NoPrompt) {
        $continue = Read-Host "Continuar mesmo sem FIREBASE_API_KEY? (S/N)"
        if ($continue -ne "S") { exit 1 }
      }
    } else {
      Write-Success "FIREBASE_API_KEY configurado"
    }
  }
}

# ───────────────────────────────────────────────────────────────
# Verificação de alterações não commitadas
# ───────────────────────────────────────────────────────────────

function Check-GitStatus {
  $gitStatus = git status --porcelain 2>$null
  if ($gitStatus -and -not $Force) {
    Write-Warn "Alterações não commitadas detectadas:"
    Write-Host $gitStatus
    if (-not $NoPrompt) {
      $continue = Read-Host "Deseja continuar o deploy sem commitar? (S/N)"
      if ($continue -ne "S") { exit 1 }
    }
  }
}

# ───────────────────────────────────────────────────────────────
# Deploy de Cloud Functions
# ───────────────────────────────────────────────────────────────

function Deploy-Functions {
  Write-Info "Instalando dependências das Cloud Functions..."
  Push-Location functions
  # Usa npm ci para garantir versões exatas do package-lock.json
  if (Test-Path "package-lock.json") {
    npm ci
  } else {
    Write-Warn "package-lock.json não encontrado em functions/. Executando npm install para gerá-lo."
    Write-Warn "Após este deploy, commite o package-lock.json gerado."
    npm install
  }
  if ($LASTEXITCODE -ne 0) {
    Write-Err "Instalação de dependências falhou no diretório functions/"
    Pop-Location
    exit 1
  }
  Pop-Location
  Write-Success "Dependências instaladas"

  Write-Info "Fazendo deploy das Cloud Functions..."
  firebase deploy --only functions --project workrail-solenis
  if ($LASTEXITCODE -ne 0) {
    Write-Err "Deploy de Cloud Functions falhou!"
    exit 1
  }
  Write-Success "Cloud Functions deployadas"
}

# ───────────────────────────────────────────────────────────────
# Deploy de Firestore Rules + Indexes
# ───────────────────────────────────────────────────────────────

function Deploy-Rules {
  Write-Info "Fazendo deploy das Firestore Rules e Indexes..."
  firebase deploy --only firestore --project workrail-solenis
  if ($LASTEXITCODE -ne 0) {
    Write-Err "Deploy das Firestore Rules falhou!"
    exit 1
  }
  Write-Success "Firestore Rules e Indexes deployados"
}

# ───────────────────────────────────────────────────────────────
# Deploy do Firebase Hosting
# ───────────────────────────────────────────────────────────────

function Deploy-Hosting {
  Write-Info "Fazendo deploy do Firebase Hosting..."
  firebase deploy --only hosting --project workrail-solenis
  if ($LASTEXITCODE -ne 0) {
    Write-Err "Deploy do Hosting falhou!"
    exit 1
  }
  Write-Success "Hosting deployado"
}

# ───────────────────────────────────────────────────────────────
# MAIN
# ───────────────────────────────────────────────────────────────

Write-Header
Check-Prerequisites

# Modo: servidor local
if ($Serve) {
  Write-Info "Iniciando servidor de desenvolvimento local..."
  firebase serve --only hosting
  exit 0
}

# Modo: preview channel
if ($Preview) {
  $channelId = "preview-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
  Write-Info "Criando canal de preview: $channelId"
  firebase hosting:channel:deploy $channelId --project workrail-solenis
  exit 0
}

Check-GitStatus
Check-EnvVars

# ── Deploy seletivo ──────────────────────────────────────────
if ($FunctionsOnly) {
  Deploy-Functions
} elseif ($RulesOnly) {
  Deploy-Rules
} elseif ($HostingOnly) {
  Deploy-Hosting
} else {
  # Deploy completo (padrão): Functions → Rules → Hosting
  Write-Info "Deploy completo: Functions + Firestore Rules + Hosting"
  Write-Host ""

  Deploy-Functions
  Write-Host ""
  Deploy-Rules
  Write-Host ""
  Deploy-Hosting
}

# ─── Resultado ──────────────────────────────────────────────────
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║            ✅ DEPLOY CONCLUÍDO COM SUCESSO!            ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Success "Sistema disponível em:"
Write-Host "  https://workrail-solenis.web.app" -ForegroundColor Cyan
Write-Host ""
Write-Success "Endpoints:"
Write-Host "  POST https://workrail-solenis.web.app/api/config" -ForegroundColor Gray
Write-Host "  GET  https://workrail-solenis.web.app/api/health" -ForegroundColor Gray
Write-Host ""
Write-Info "Dicas:"
Write-Host "  • Limpe o cache: Ctrl+Shift+Del" -ForegroundColor Gray
Write-Host "  • Hard refresh:  Ctrl+Shift+R" -ForegroundColor Gray
Write-Host "  • Console:       F12" -ForegroundColor Gray
Write-Host ""
Write-Info "Uso do script:"
Write-Host "  .\deploy.ps1                  # Deploy completo" -ForegroundColor Gray
Write-Host "  .\deploy.ps1 -FunctionsOnly   # Apenas Cloud Functions" -ForegroundColor Gray
Write-Host "  .\deploy.ps1 -RulesOnly       # Apenas Firestore Rules" -ForegroundColor Gray
Write-Host "  .\deploy.ps1 -HostingOnly     # Apenas Hosting" -ForegroundColor Gray
Write-Host "  .\deploy.ps1 -Preview         # Cria canal de preview" -ForegroundColor Gray
Write-Host "  .\deploy.ps1 -Serve           # Servidor local" -ForegroundColor Gray
