# CHANGELOG — WORKRAIL

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.  
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [2.2.0] — 2026-03-27 · SECURITY & PRODUCTION RELEASE

### 🔒 Segurança
- **AuthRateLimiter**: proteção contra força bruta — máx. 5 tentativas / 15 min por sessão
- **Input sanitizer** (`sanitizeText`): escapamento de caracteres HTML para prevenção de XSS
- **Validação de e-mail** no formulário de login com regex antes de chamar Firebase
- **Feedback progressivo** de tentativas restantes no login (aviso nos últimas 2 tentativas)
- **Metadados de segurança** no `<head>`: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`
- **CSP headers** no Firebase Hosting: `Content-Security-Policy` abrangente para todas as rotas HTML
- **`Permissions-Policy`**: câmera, microfone e geolocalização desabilitados
- **`crossorigin="anonymous"`** nos scripts Firebase SDK
- **`robots: noindex, nofollow`**: sistema interno não indexável por motores de busca
- Firestore Security Rules com RBAC (roles: `vendas`, `gestor`, `adm`, `fornecedor_*`, `super_admin`)
- Validação de tipo e tamanho de arquivos (PDF, JPEG, PNG, WebP, Word — máx. 20 MB)

### ✨ Funcionalidades Novas
- **Modal "Recuperar Senha"** funcional — `sendPasswordResetEmail` via Firebase Auth
- **Link "Esqueceu a senha?"** no rodapé do formulário de login
- **Keyboard shortcut ESC** para fechar modais (recuperar senha + modais do app)
- **`mostrarAppSemLogin`**: modo offline/desenvolvimento com perfil `super_admin` automático

### 🎨 UI/UX
- Rodapé do login atualizado com link de recuperação de senha estilizado
- Botão de recuperação de senha com feedback visual (`Enviando…` → `✔ Link enviado!`)
- Auto-fechamento do modal de recuperação após envio bem-sucedido (3 s)
- Responsividade: breakpoints 320 px, 480 px, 768 px, 1024 px, 1440 px+
- Toast notifications (success / error / info / warn) com auto-hide 4,5 s
- Loading overlay com spinner animado

### 🛠️ Qualidade de Código
- Remoção de funções `showToast` / `showLoading` duplicadas
- Guard `if (dateEl)` no init para evitar null reference
- Modularização: `AuthRateLimiter`, `sanitizeText`, `abrirRecuperarSenha`, `enviarRecuperacao`
- Comentários JSDoc e seções delimitadas para fácil manutenção
- Firebase Firestore Rules documentadas inline no HTML (para copiar ao Console)

### 📦 Infraestrutura / Deploy
- **`firebase.json`** atualizado com headers de segurança em todas as rotas
- Ignore list expandida (exclui `.bak`, `.ps1`, `firebaseProxy.js`, docs internos)
- **`.nojekyll`** mantido para compatibilidade com GitHub Pages
- **`.github/workflows/deploy.yml`** — CI/CD automático com GitHub Actions (Firebase Hosting)

---

## [2.1.2] — 2026-03-24

### Adicionado
- Toggle de visibilidade de senha (ícone de olho)
- Modal básico de recuperação de senha (CSS/HTML, sem lógica de envio)
- Animações slideUp e fadeIn

### Corrigido
- CSS refatorizado e otimizado
- Responsividade aprimorada para dispositivos móveis

---

## [2.1.0] — 2026-03-01

### Adicionado
- Lançamento inicial do WORKRAIL v2
- Fluxo de 7 etapas: Solicitação → Gestor → ADM → Fornecedor → Logística → Instalação → Relatório
- Firebase Auth + Firestore + Storage
- Dashboard com KPIs, gráficos donut e barras
- Painel Admin com CRUD de usuários, fornecedores e modelos de máquinas
- Sidebar navegável com breadcrumbs
- Sistema de notificações
- Relatórios com cards exportáveis

---

> **Formato de versão**: MAJOR.MINOR.PATCH  
> Desenvolvido para **Solenis Brasil** · Uso interno restrito
