# WORKRAIL v2.3 - Deploy Script
# Firebase: Hosting + Functions + Firestore Rules

param(
  [switch]$Force,
  [switch]$Preview,
  [switch]$Serve,
  [switch]$NoPrompt,
  [switch]$FunctionsOnly,
  [switch]$RulesOnly,
  [switch]$HostingOnly
)

function Write-Header {
  Write-Host ""
  Write-Host "WORKRAIL v2.3 - Deploy Firebase (workrail-solenis)" -ForegroundColor Cyan
  Write-Host ""
}

function Write-Info($msg)    { Write-Host "INFO: $msg" -ForegroundColor Cyan }
function Write-Success($msg) { Write-Host "OK:   $msg" -ForegroundColor Green }
function Write-Err($msg)     { Write-Host "ERR:  $msg" -ForegroundColor Red }
function Write-Warn($msg)    { Write-Host "WARN: $msg" -ForegroundColor Yellow }

function Check-Prerequisites {
  Write-Info "Verificando Firebase CLI..."
  $fbVersion = firebase --version 2>&1
  if ($LASTEXITCODE -ne 0) { Write-Err "Firebase CLI nao encontrado! npm install -g firebase-tools"; exit 1 }
  Write-Success "Firebase CLI: $fbVersion"

  Write-Info "Verificando Node.js..."
  $nodeVersion = node --version 2>&1
  if ($LASTEXITCODE -ne 0) { Write-Err "Node.js nao encontrado!"; exit 1 }
  Write-Success "Node.js: $nodeVersion"

  firebase use workrail-solenis
  if ($LASTEXITCODE -ne 0) { Write-Err "Falha: firebase login && firebase use workrail-solenis"; exit 1 }
  Write-Success "Projeto: workrail-solenis"
}

function Check-EnvVars {
  if (-not $HostingOnly -and -not $RulesOnly) {
    $apiKey = [System.Environment]::GetEnvironmentVariable("FIREBASE_API_KEY")
    if (-not $apiKey) {
      Write-Warn "FIREBASE_API_KEY nao definido! A funcao getFirebaseConfig retornara erro 500."
      Write-Info "Configure: Set-Item Env:FIREBASE_API_KEY 'AIzaSy...'"
      Write-Info "Veja FIREBASE_MANUAL_CHECKLIST.md para detalhes."
      if (-not $Force -and -not $NoPrompt) {
        $c = Read-Host "Continuar sem FIREBASE_API_KEY? (S/N)"
        if ($c -ne "S") { exit 1 }
      }
    } else { Write-Success "FIREBASE_API_KEY configurado" }
  }
}

function Check-GitStatus {
  $s = git status --porcelain 2>$null
  if ($s -and -not $Force) {
    Write-Warn "Alteracoes nao commitadas: $s"
    if (-not $NoPrompt) {
      $c = Read-Host "Continuar deploy sem commitar? (S/N)"
      if ($c -ne "S") { exit 1 }
    }
  }
}

function Deploy-Functions {
  Write-Info "Instalando dependencias..."
  Push-Location functions
  npm install
  if ($LASTEXITCODE -ne 0) { Pop-Location; Write-Err "npm install falhou"; exit 1 }
  Pop-Location
  Write-Info "Deploy das Cloud Functions..."
  firebase deploy --only functions --project workrail-solenis
  if ($LASTEXITCODE -ne 0) { Write-Err "Deploy functions falhou!"; exit 1 }
  Write-Success "Cloud Functions deployadas"
}

function Deploy-Rules {
  Write-Info "Deploy das Firestore Rules e Indexes..."
  firebase deploy --only firestore --project workrail-solenis
  if ($LASTEXITCODE -ne 0) { Write-Err "Deploy rules falhou!"; exit 1 }
  Write-Success "Firestore Rules deployadas"
}

function Deploy-Hosting {
  Write-Info "Deploy do Firebase Hosting..."
  firebase deploy --only hosting --project workrail-solenis
  if ($LASTEXITCODE -ne 0) { Write-Err "Deploy hosting falhou!"; exit 1 }
  Write-Success "Hosting deployado"
}

Write-Header
Check-Prerequisites

if ($Serve) { firebase serve --only hosting; exit 0 }
if ($Preview) {
  $ch = "preview-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
  firebase hosting:channel:deploy $ch --project workrail-solenis; exit 0
}

Check-GitStatus
Check-EnvVars

if ($FunctionsOnly) { Deploy-Functions }
elseif ($RulesOnly) { Deploy-Rules }
elseif ($HostingOnly) { Deploy-Hosting }
else {
  Write-Info "Deploy completo: Functions + Rules + Hosting"
  Deploy-Functions; Write-Host ""
  Deploy-Rules; Write-Host ""
  Deploy-Hosting
}

Write-Host ""
Write-Success "DEPLOY CONCLUIDO! https://workrail-solenis.web.app"
Write-Info "POST /api/config | GET /api/health"
Write-Host ""
Write-Info "Uso: .\deploy.ps1 | -FunctionsOnly | -RulesOnly | -HostingOnly | -Preview | -Serve"
