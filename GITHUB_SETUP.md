# WORKRAIL — GitHub Setup

> **Repositório:** [workrail-solicitacao-maquinas](https://github.com/welingtontavares15-hue/workrail-solicitacao-maquinas)
> **Data de revisão:** 2026-03-28

---

## 1. Secrets necessários

Acesse: **GitHub → Settings → Secrets and variables → Actions → New repository secret**

| Secret | Descrição | Como obter |
|--------|-----------|------------|
| `FIREBASE_TOKEN` | Token CI do Firebase CLI | `firebase login:ci` (copiar a saída) |
| `FIREBASE_API_KEY` | API Key pública do Firebase | Firebase Console → Project Settings → General → Web app → `apiKey` |
| `FIREBASE_MESSAGING_SENDER_ID` | Sender ID | Firebase Console → Project Settings → General → Web app → `messagingSenderId` |
| `FIREBASE_APP_ID` | App ID da web app | Firebase Console → Project Settings → General → Web app → `appId` |
| `FIREBASE_SERVICE_ACCOUNT_WORKRAIL_SOLENIS` | JSON completo da Service Account | GCP → IAM → Service Accounts → `workrail-solenis@appspot.gserviceaccount.com` → Keys → Add key → JSON |

### Como gerar FIREBASE_TOKEN:
```bash
firebase login:ci
# Copie o token gerado e adicione ao secret FIREBASE_TOKEN
```

### Como obter a Service Account (para preview channels):
1. Acesse [GCP IAM](https://console.cloud.google.com/iam-admin/serviceaccounts?project=workrail-solenis)
2. Selecione `firebase-adminsdk-...@workrail-solenis.iam.gserviceaccount.com`
3. Aba "Keys" → "Add Key" → "Create new key" → JSON
4. **Não commite o arquivo JSON** — cole o conteúdo no secret do GitHub

---

## 2. Permissões necessárias

### No GitHub:
- O usuário que configurar os Secrets precisa ser **Owner** ou **Admin** do repositório
- O GitHub Actions precisa de permissão `contents: read` e `id-token: write` (já configurado no workflow)

### No Firebase / GCP:
A Service Account usada no CI/CD precisa ter os seguintes papéis no projeto `workrail-solenis`:
- `Firebase Hosting Admin` — para deploy do Hosting
- `Cloud Functions Developer` — para deploy das Functions
- `Cloud Datastore User` (ou `Firebase Rules Admin`) — para deploy das Rules
- `Service Account Token Creator` — para autenticação no CI

```bash
# Verificar papéis atuais
gcloud projects get-iam-policy workrail-solenis \
  --flatten="bindings[].members" \
  --format='table(bindings.role)' \
  --filter="bindings.members:firebase-adminsdk"
```

---

## 3. Branches e gatilhos de deploy

| Branch | Evento | Ação |
|--------|--------|------|
| `main` | push | Deploy completo automático (Functions + Rules + Hosting) |
| qualquer | PR aberta | Deploy de preview channel (comentado automaticamente no PR) |
| qualquer | manual | Deploy com alvo selecionável via workflow_dispatch |

### Deploy manual via interface do GitHub:
1. Acesse o repositório → aba **Actions**
2. Selecione o workflow **"WORKRAIL — Deploy Firebase"**
3. Clique em **"Run workflow"**
4. Escolha o alvo: `all`, `hosting`, `functions`, ou `rules`
5. Clique em **"Run workflow"**

---

## 4. Proteção da branch main

Configure no GitHub → Settings → Branches → Add rule:
- [ ] **Branch name pattern:** `main`
- [ ] Require a pull request before merging
- [ ] Require status checks to pass before merging
  - Check obrigatório: `Validação do repositório`
- [ ] Require branches to be up to date before merging
- [ ] Do not allow bypassing the above settings

---

## 5. Environments (recomendado)

Configure um Environment chamado `production` para controle de aprovação manual antes do deploy:

GitHub → Settings → Environments → New environment → `production`
- [ ] Marque "Required reviewers" e adicione ao menos 1 revisor
- [ ] Configure apenas os secrets de produção neste environment

---

## 6. Verificação pós-configuração

```bash
# Triggerar deploy manual via CLI do GitHub
gh workflow run deploy.yml \
  --repo welingtontavares15-hue/workrail-solicitacao-maquinas \
  --field target=hosting

# Acompanhar o run
gh run list --repo welingtontavares15-hue/workrail-solicitacao-maquinas

# Ver logs do último run
gh run view --repo welingtontavares15-hue/workrail-solicitacao-maquinas --log
```

- [ ] Primeiro deploy manual bem-sucedido
- [ ] Preview channel funcionando em PRs
- [ ] Deploy automático em push para main funcionando
