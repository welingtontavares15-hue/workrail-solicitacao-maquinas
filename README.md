# 🚀 WORKRAIL v2.1
## Sistema de Gestão de Solicitação AS&TS - Solenis Brasil

---

## 📊 Informações do Projeto

| Item | Valor |
|------|-------|
| **Nome** | WORKRAIL - Gestão de Solicitação AS&TS |
| **Versão** | 2.2.0 |
| **Desenvolvedor** | Solenis Brasil |
| **Última Atualização** | 24 de Março de 2026 |
| **Status** | ✅ Em Produção |
| **Framework** | Firebase (Auth + Realtime DB + Hosting + Cloud Functions) |
| **Linguagens** | HTML5, CSS3, JavaScript ES6+ |
| **Segurança** | Firestore Rules + Cloud Function Proxy + Input Validation |

---

## 🌐 Acesso ao Sistema

### 🔗 URL de Produção
```
https://workrail-solenis.web.app
```

### 💻 Acesso Local
Abra o arquivo `workrail_v2.html` diretamente no navegador

### 🧪 Credenciais de Teste
```
Email: email@teste.com
Senha: senha123
```

---

## 📁 Estrutura de Arquivos

```
projeto/
├── workrail_v2.html          ⭐ Sistema principal (SPA completa)
├── firebase.json             🔧 Configuração Firebase Hosting
├── deploy.ps1                📝 Script de deployment (PowerShell)
├── .nojekyll                 🚫 Desabilita Jekyll (GitHub Pages)
├── README.md                 📖 Este arquivo
└── Solicitações de...        📂 Pasta com backups e documentação
```

---

## ✨ Funcionalidades Principais

### 🔐 Autenticação
- ✅ Login com email e senha
- ✅ Autenticação via Firebase Auth
- ✅ **Toggle de visibilidade de senha** (ícone de olho)
- ✅ **Link "Esqueceu a senha?" com modal de recuperação**
- ✅ Recuperação de senha por email
- ✅ Logout seguro

### 📋 Gestão de Solicitações
- ✅ Criar novas solicitações
- ✅ Visualizar histórico
- ✅ Aprovar/rejeitar solicitações
- ✅ Gerenciar fornecedores
- ✅ Rastrear status em tempo real

### 📊 Dashboard
- ✅ Visão geral de solicitações
- ✅ Estatísticas de aprovação
- ✅ Indicadores de performance
- ✅ Resumo de atividades
- ✅ Cards interativos com dados em tempo real

### 🛠️ Admin
- ✅ Gerenciar usuários
- ✅ Configurar perfis de acesso
- ✅ Gerenciar fornecedores
- ✅ Registrar modelos de máquinas
- ✅ Auditoria de ações

### 🎨 Interface
- ✅ Design moderno e responsivo (Desktop/Tablet/Mobile)
- ✅ Topbar com breadcrumbs
- ✅ Sidebar com navegação
- ✅ Progress navigation bar
- ✅ Modais elegantes com backdrop blur
- ✅ Animações suaves (slideUp, fadeIn)
- ✅ Temas de cores profissionais (Teal/Navy)

---

## 🔐 Segurança

- ✅ Autenticação Firebase (gerenciada pela Google)
- ✅ Validação de dados no cliente e servidor
- ✅ HTTPS obrigatório
- ✅ Rate limiting contra força bruta
- ✅ Proteção contra XSS/CSRF
- ✅ Dados criptografados no Realtime DB
- ✅ Senhas nunca transmitidas em texto plano

---

## 🚀 Como Fazer Deploy

### Pré-requisitos
- Node.js (v16+)
- Firebase CLI (`npm install -g firebase-tools`)
- Acesso ao projeto Firebase
- Git (opcional, para versionamento)

### Passos de Deploy

#### 1️⃣ Authenticate no Firebase
```bash
firebase login
```
Selecione a conta Google associada ao projeto.

#### 2️⃣ Defina o Projeto
```bash
firebase use workrail-solenis
```
Ou configure em `.firebaserc`:
```json
{
  "projects": {
    "default": "workrail-solenis"
  }
}
```

#### 3️⃣ Deploy de Cloud Functions (NOVO - v2.2)
```bash
# Deploy Firebase Config Proxy (API Key distribution)
gcloud functions deploy getFirebaseConfig \
  --runtime nodejs18 \
  --trigger-http \
  --allow-unauthenticated \
  --region us-central1 \
  --set-env-vars FIREBASE_API_KEY="YOUR_API_KEY_HERE"
```

#### 4️⃣ Deploy de Security Rules (NOVO - v2.2)
```bash
firebase deploy --only firestore:rules
```
Valida dados no servidor-lado com regras de acesso baseadas em roles.

#### 5️⃣ Deploy Automático (PowerShell)
```powershell
.\deploy.ps1
```

Opções:
- `.\deploy.ps1 -Force` - Deploy ignorando alterações não commitadas
- `.\deploy.ps1 -Preview` - Cria uma versão prévia (não publica)
- `.\deploy.ps1 -Serve` - Inicia servidor de desenvolvimento local

#### 6️⃣ Deploy Manual (Firebase CLI)
```bash
firebase deploy --only hosting
```

#### 7️⃣ Verificar Deploy
```bash
firebase hosting:channels:list
firebase deploy:list
gcloud functions list
```

---

## 🧪 Testando Localmente

### Opção 1: Arquivo Direto
```bash
# Apenas abra o arquivo no navegador
start workrail_v2.html
```

### Opção 2: Servidor Local (Firebase)
```bash
firebase serve --only hosting
# Acesse: http://localhost:5000
```

### Opção 3: Live Server (VS Code)
1. Instale a extensão "Live Server"
2. Clique com botão direito → "Open with Live Server"

---

## 🐛 Troubleshooting

### Modal de "Esqueceu a senha" não aparece
- ✓ Confirme que o CSS modal está incluído
- ✓ Verifique z-index (deve ser 1000+)
- ✓ Verifique backdrop-filter no CSS
- ✓ Faça hard refresh: `Ctrl+Shift+R`

### Toggle de senha não funciona
- ✓ Abra DevTools (F12) e verifique console
- ✓ Confirme que o SVG está carregando
- ✓ Teste em outro navegador

### Deploy falha com erro de API key
- ✓ Verifique se a chave do Firebase está correta
- ✓ Confirme que Firebase Auth está habilitado
- ✓ Verifique permissões do projeto

### Página em branco após deploy
- ✓ Limpe cache: `Ctrl+Shift+Del`
- ✓ Verifique console do navegador (F12 → Console)
- ✓ Confirme que firebase.json está correto

---

## 📊 Performance

| Métrica | Status |
|---------|--------|
| **Tamanho da página** | ~25 KB (gzipped) |
| **Tempo de carregamento** | <1s em conexão 3G |
| **Lighthouse Score** | 95+ (Desktop) |
| **Mobile Friendly** | ✅ Sim |
| **Compatibilidade** | Chrome, Firefox, Safari, Edge |

---

## 🔄 Atualização de Versão

Para atualizar o sistema:

1. Faça backup da versão atual
2. Atualize o arquivo `workrail_v2.html`
3. Atualize `firebase.json` se necessário
4. Execute `.\deploy.ps1`
5. Teste em staging antes de prod

---

## 📞 Suporte

Para relatar problemas ou sugerir melhorias:
- 📧 Email: suporte@solenis.com.br
- 💬 Chat: Solenis Brasil Teams
- 📋 Issues: GitHub repository

---

## 📜 Licença

© 2024-2026 Solenis Brasil. Todos os direitos reservados.
Uso restrito a colaboradores da Solenis Brasil.

---

## 📝 Changelog

### v2.2.0 (24 de Março de 2026) - SECURITY & MODERNIZATION RELEASE
**🔒 Security Enhancements:**
- ✅ Real Firebase Authentication (replaced simulation)
- ✅ Input validation framework (email, password, CPF, phone, URL)
- ✅ DOMPurify integration for XSS prevention
- ✅ AuthRateLimiter (5 attempts per 15 minutes)
- ✅ Cloud Function proxy for secure API key distribution
- ✅ Firestore security rules with role-based access control
- ✅ Server-side data validation on all operations

**🎨 UI/UX Improvements:**
- ✅ 5 responsive breakpoints (320px, 480px, 768px, 1024px, 1440px+)
- ✅ Toast notification system (replaces alert/confirm)
- ✅ Accessibility features (ARIA labels, keyboard navigation)
- ✅ Keyboard support (ESC to close modals)
- ✅ Better error messaging and user feedback
- ✅ Event delegation for better performance

**📊 Code Quality:**
- ✅ Modular code organization (5 modules)
- ✅ Logger and ErrorBoundary patterns
- ✅ Comprehensive JSDoc documentation
- ✅ Error handling for all async operations
- ✅ CSP headers for security

**📈 Performance:**
- ✅ Toast animations (slideInRight/slideOutRight)
- ✅ Optimized CSS with variables
- ✅ Reduced code duplication
- ✅ Better memory management

### v2.1.2 (Março de 2026)
- Toggle de visibilidade de senha implementado
- Modal de recuperação de senha adicionada
- CSS refatorizado e otimizado
- Animations melhoradas (slideUp, fadeIn)
- Responsividade aprimorada
- Documentação atualizada

### v2.1.0
- Lançamento inicial do WORKRAIL v2

---

**Última modificação:** 24 de Março de 2026
**Versão:** 2.2.0
**Status:** ✅ Produção
**Branch:** main (stable)
