# WORKRAIL - GitHub Setup

> Repositorio: workrail-solicitacao-maquinas
> Data de revisao: 2026-03-28

---

## 1. Secrets necessarios

GitHub > Settings > Secrets and variables > Actions > New repository secret

| Secret | Como obter |
|--------|------------|
| `FIREBASE_TOKEN` | `firebase login:ci` |
| `FIREBASE_API_KEY` | Firebase Console > Project Settings > Web app > apiKey |
| `FIREBASE_MESSAGING_SENDER_ID` | Firebase Console > Project Settings > Web app |
| `FIREBASE_APP_ID` | Firebase Console > Project Settings > Web app |
| `FIREBASE_SERVICE_ACCOUNT_WORKRAIL_SOLENIS` | GCP > IAM > Service Accounts > Keys > JSON |

### Gerar FIREBASE_TOKEN:
```bash
firebase login:ci
# Copie o token e salve no secret FIREBASE_TOKEN
```

---

## 2. Permissoes necessarias

### No GitHub:
- Owner ou Admin do repositorio para configurar Secrets

### No Firebase / GCP:
A Service Account precisa de:
- `Firebase Hosting Admin`
- `Cloud Functions Developer`
- `Firebase Rules Admin`

---

## 3. Branches e gatilhos de deploy

| Branch | Evento | Acao |
|--------|--------|------|
| `main` | push | Deploy completo automatico |
| qualquer | PR aberta | Preview channel (comentado no PR) |
| qualquer | manual | Deploy com alvo selecionavel |

### Deploy manual via GitHub:
1. Repositorio > aba Actions
2. Workflow 'WORKRAIL - Deploy Firebase'
3. Clicar 'Run workflow'
4. Escolher alvo: all, hosting, functions ou rules
5. Clicar 'Run workflow'

---

## 4. Protecao da branch main

GitHub > Settings > Branches > Add rule:
- [ ] Branch name pattern: `main`
- [ ] Require pull request before merging
- [ ] Require status checks: 'Validacao do repositorio'
- [ ] Do not allow bypassing

---

## 5. Verificacao pos-configuracao

```bash
# Triggerar deploy manual
gh workflow run deploy.yml \
  --repo welingtontavares15-hue/workrail-solicitacao-maquinas \
  --field target=hosting

# Ver status
gh run list --repo welingtontavares15-hue/workrail-solicitacao-maquinas
```

- [ ] Primeiro deploy manual bem-sucedido
- [ ] Preview channel funcionando em PRs
- [ ] Deploy automatico em push para main funcionando
