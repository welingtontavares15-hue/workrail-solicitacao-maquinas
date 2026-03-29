#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# WORKRAIL v2.3 — Push para GitHub
# Uso: ./push_to_github.sh "mensagem de commit"
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

# ─── Cores ───────────────────────────────────────────────────
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()    { echo -e "${CYAN}ℹ️  $1${NC}"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
warn()    { echo -e "${YELLOW}⚠️  $1${NC}"; }
err()     { echo -e "${RED}❌ $1${NC}"; }

# ─── Mensagem de commit ───────────────────────────────────────
COMMIT_MSG="${1:-}"
if [ -z "$COMMIT_MSG" ]; then
  err "Informe a mensagem de commit como argumento."
  echo "  Uso: ./push_to_github.sh \"mensagem de commit\""
  exit 1
fi

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║     WORKRAIL v2.3 — Push para GitHub (main)           ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# ─── Verifica branch atual ────────────────────────────────────
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
if [ -z "$BRANCH" ]; then
  err "Não foi possível determinar o branch atual. Execute dentro do repositório Git."
  exit 1
fi
info "Branch atual: $BRANCH"

# ─── Verifica se há remote origin configurado ────────────────
if ! git remote get-url origin &>/dev/null; then
  err "Remote 'origin' não configurado."
  echo "  Configure com: git remote add origin https://github.com/SEU-USUARIO/SEU-REPO.git"
  exit 1
fi

REMOTE_URL=$(git remote get-url origin)
info "Remote: $REMOTE_URL"

# ─── Verifica credenciais/login ──────────────────────────────
info "Verificando status do repositório..."
git fetch origin "$BRANCH" 2>/dev/null || warn "Não foi possível fazer fetch. Verifique a conexão e credenciais."

# ─── Mostra alterações pendentes ─────────────────────────────
CHANGED=$(git status --porcelain)
if [ -z "$CHANGED" ]; then
  warn "Nenhuma alteração detectada. Nada a commitar."
  exit 0
fi

echo ""
info "Arquivos alterados:"
git status --short
echo ""

# ─── Adiciona ao staging ──────────────────────────────────────
info "Adicionando arquivos ao staging..."
git add -A
success "Staging concluído"

# ─── Commit ───────────────────────────────────────────────────
info "Criando commit: \"$COMMIT_MSG\""
git commit -m "$COMMIT_MSG"
success "Commit criado"

# ─── Push ─────────────────────────────────────────────────────
info "Fazendo push para origin/$BRANCH..."
git push origin "$BRANCH"
success "Push concluído"

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║          ✅ PUSH CONCLUÍDO COM SUCESSO!                ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
success "Repositório: $REMOTE_URL"
success "Branch: $BRANCH"
echo ""
info "O GitHub Actions iniciará o deploy automaticamente se houver push para main."
info "Acompanhe em: https://github.com/welingtontavares15-hue/workrail-solicitacao-maquinas/actions"
echo ""
