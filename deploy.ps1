# Script para fazer deploy automático no Firebase Hosting
# Execute com: powershell .\deploy.ps1

Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  WORKRAIL — Deploy Automático Firebase Hosting        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Verificar se Firebase CLI está instalado
Write-Host "📋 Verificando Firebase CLI..." -ForegroundColor Yellow
firebase --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Firebase CLI não encontrado!" -ForegroundColor Red
    Write-Host "📥 Instale com: npm install -g firebase-tools" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Firebase CLI encontrado!" -ForegroundColor Green
Write-Host ""

# Fazer deploy
Write-Host "🚀 Iniciando deploy..." -ForegroundColor Cyan
Write-Host ""

firebase deploy --only hosting

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║  ✅ DEPLOY CONCLUÍDO COM SUCESSO!                    ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Seu sistema está disponível em:" -ForegroundColor Green
    Write-Host "   https://workrail-solenis.web.app" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🔐 Login com:" -ForegroundColor Green
    Write-Host "   Email: wbastostavares@solenis.com" -ForegroundColor Yellow
    Write-Host "   Senha: Reset via 'Problemas de acesso?'" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Erro no deploy!" -ForegroundColor Red
    Write-Host "📞 Tente novamente ou execute: firebase login" -ForegroundColor Yellow
}
