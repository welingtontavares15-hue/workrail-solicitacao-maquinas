# WORKRAIL — Revisão Firebase + GitHub

> **Auditoria realizada em:** 2026-03-28
> **Repositório auditado:** https://github.com/welingtontavares15-hue/workrail-solicitacao-maquinas

---

## Diagnóstico encontrado (antes das correções)

### firebase.json — 4 problemas críticos
1. **Sem seção `functions`** → impossível fazer `firebase deploy --only functions`
2. **Sem rewrites para `/api/config` e `/api/health`** → a Cloud Function existe mas nunca é chamada via Hosting
3. **Sem seção `firestore`** → `firebase deploy --only firestore:rules` falha sem apontar o arquivo
4. **`X-Frame-Options: DENY`** → quebra Firebase Auth que usa iframes para autenticação; deve ser `SAMEORIGIN`

### firebaseProxy.js — 5 problemas
1. **Arquivo na raiz do repositório**, não em `functions/` → Firebase não consegue fazer deploy das funções
2. **Ausência de `functions/package.json`** → deploy falha com "missing package.json in functions directory"
3. **`cors` declarado como dependência mas sem `package.json`** → erro de runtime "Cannot find module 'cors'"
4. **Rate limiting em memória (`new Map()`)** → não persiste entre cold starts, não funciona com múltiplas instâncias
5. **`cleanupRequestLog` limpa apenas memória** → a coleção `_rateLimit` no Firestore nunca é limpa (leak de dados)

### .firebaserc — ausente
- Arquivo não existe no repositório → `firebase use workrail-solenis` falha no CI/CD

### deploy.ps1 — 2 problemas
- Header diz "WORKRAIL v2.1" enquanto o projeto está em v2.3
- `firebase deploy --only hosting` → não deploya functions nem rules (deploy parcial silencioso)

### GitHub — 3 problemas críticos
- Sem `.github/workflows/` → zero automação; todos os deploys são manuais
- Sem `.gitignore` → `.env`, `node_modules/`, credenciais JSON podem ser commitados acidentalmente
- Sem proteção de branch `main`

---

## Mudanças aplicadas (arquivos criados/alterados)

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `firebase.json` | **Alterado** | Adicionado seções `functions` e `firestore`; rewrites `/api/config` e `/api/health`; corrigido `X-Frame-Options: DENY` → `SAMEORIGIN` |
| `functions/index.js` | **Criado** | Reorganização do `firebaseProxy.js` para estrutura padrão Firebase Functions Gen 2; rate limiting via Firestore |
| `functions/package.json` | **Criado** | Declara todas as dependências: `cors`, `firebase-admin`, `firebase-functions`; engines Node.js 18 |
| `.firebaserc` | **Criado** | Aponta default para `workrail-solenis` |
| `firestore.rules` | **Atualizado** | Adicionadas regras para `_rateLimit` e `_health` (somente Admin SDK) |
| `firestore.indexes.json` | **Criado** | Indexes para `requestLog` (timestamp) e `_rateLimit` (lastSeen) |
| `deploy.ps1` | **Atualizado** | Versão bumped para v2.3; suporte a `-FunctionsOnly`, `-RulesOnly`, `-HostingOnly` |
| `.gitignore` | **Criado** | Ignora `.env`, credenciais JSON, `node_modules/`, `.firebase/`, artefatos temporários |
| `.github/workflows/deploy.yml` | **Criado** | CI/CD: validação + deploy automático em push para `main` + workflow_dispatch + preview channels |
| `.github/pull_request_template.md` | **Criado** | Template de PR com checklist de segurança |
| `.github/ISSUE_TEMPLATE/bug_report.md` | **Criado** | Template de bug report |
| `.github/ISSUE_TEMPLATE/change_request.md` | **Criado** | Template de solicitação de mudança |
| `DEPLOY_SUMMARY.md` | **Criado** | Resumo de arquitetura de deploy, comandos, rollback e URLs |
| `FIREBASE_MANUAL_CHECKLIST.md` | **Criado** | Checklist detalhado de configuração manual do Firebase |
| `GITHUB_SETUP.md` | **Criado** | Guia completo de configuração do GitHub: secrets, permissões, branches |

---

## Pendências manuais no Firebase

1. **Configurar variável de ambiente `FIREBASE_API_KEY` nas Cloud Functions**
   - Obter em: Firebase Console → Project Settings → Web app → `apiKey`
   - Configurar via Secret Manager ou `--set-env-vars` no deploy
2. **Configurar `FIREBASE_MESSAGING_SENDER_ID` e `FIREBASE_APP_ID`** nas Cloud Functions
   - Mesma origem: Firebase Console → Project Settings → Web app
3. **Verificar e ativar todos os serviços Firebase:** Auth, Firestore, Storage, Functions, Hosting
4. **Configurar Custom Claims (roles)** para ao menos 1 `super_admin` e 1 `adm`
5. **Fazer deploy das Firestore Rules** via `firebase deploy --only firestore`
6. **Cadastrar fornecedores** (EBST e Hobart) na coleção `fornecedores`
7. **Testar health check pós-deploy:** `GET /api/health` deve retornar `{"status":"ok"}`

Detalhes completos: **FIREBASE_MANUAL_CHECKLIST.md**

---

## Pendências manuais no GitHub

1. **Configurar 5 secrets no repositório** (ver GITHUB_SETUP.md)
2. **Proteger branch `main`** com regra de status check obrigatório
3. **Criar Environment `production`** com aprovação manual obrigatória antes do deploy
4. **Dar permissões corretas** à Service Account no GCP IAM

---

## Checklist de validação final

- [ ] `firebase.json` válido (node: `node -e "JSON.parse(require('fs').readFileSync('firebase.json','utf8'))""`)
- [ ] `functions/package.json` válido e todas as dependências declaradas
- [ ] `functions/index.js` sintaxe válida (node: `node --check functions/index.js`)
- [ ] `.firebaserc` aponta para `workrail-solenis`
- [ ] Nenhuma credencial hardcoded no código (grep por `AIzaSy`)
- [ ] `GET /api/health` retorna 200 após deploy
- [ ] `POST /api/config` retorna configuração real (não placeholder)
- [ ] Login funciona no sistema
- [ ] Firestore Rules deployadas e testadas
- [ ] GitHub Actions com pelo menos 1 run bem-sucedido
