# WORKRAIL — Firebase Manual Checklist

> **Projeto:** workrail-solenis
> **Data de revisão:** 2026-03-28
> **Status:** Pendências manuais listadas abaixo devem ser executadas por um admin com acesso ao Firebase Console e GCP.

---

## 1. Pré-requisitos

- [ ] Conta Google com acesso ao projeto `workrail-solenis`
- [ ] Firebase CLI instalado: `npm install -g firebase-tools`
- [ ] Node.js 18+ instalado
- [ ] `firebase login` executado com sucesso
- [ ] Projeto ativo: `firebase use workrail-solenis`

---

## 2. Firebase Console — Serviços a habilitar

Acesse [console.firebase.google.com](https://console.firebase.google.com/project/workrail-solenis) e verifique que os seguintes serviços estão **ativos**:

- [ ] **Authentication** → Email/Password habilitado
  - Caminho: Authentication → Sign-in method → Email/Password
- [ ] **Firestore** (modo nativo, região `us-central1`)
  - Caminho: Firestore Database → Create database
- [ ] **Cloud Storage** (`workrail-solenis.appspot.com`)
- [ ] **Cloud Functions** (geração 2, Node.js 18)
- [ ] **Hosting** (configuração automática via `firebase.json`)

---

## 3. Configuração obrigatória da Cloud Function

A função `getFirebaseConfig` requer a variável de ambiente `FIREBASE_API_KEY`.

### Onde encontrar o valor:
Firebase Console → Project Settings → General → Your apps → Web app → SDK snippet → `apiKey`

### Como configurar (escolha uma opção):

**Opção A — Secret Manager (recomendado para produção):**
```bash
# Criar o secret
echo -n "AIzaSy..." | gcloud secrets create FIREBASE_API_KEY \
  --data-file=- --project=workrail-solenis

# Dar acesso à conta de serviço das Functions
gcloud secrets add-iam-policy-binding FIREBASE_API_KEY \
  --member="serviceAccount:workrail-solenis@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=workrail-solenis
```

**Opção B — Variável de ambiente direto no deploy:**
```bash
# Via gcloud (para atualizar variáveis de uma function específica)
gcloud functions deploy getFirebaseConfig \
  --gen2 \
  --runtime nodejs18 \
  --region us-central1 \
  --set-env-vars FIREBASE_API_KEY="AIzaSy...,FIREBASE_MESSAGING_SENDER_ID=123456789,FIREBASE_APP_ID=1:123:web:abc"
```

**Opção C — Para testes locais com emulator:**
```bash
# Arquivo .env.local na pasta functions/ (nunca commitar!)
FIREBASE_API_KEY=AIzaSy...
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abc123
```

---

## 4. Custom Claims (Roles)

Os papéis dos usuários são implementados via **Firebase Custom Claims**. Eles NÃO são definidos pelas Firestore Rules — são injetados no token de autenticação pelo backend.

**Papéis disponíveis:**
| Role | Permissões |
|------|-----------|
| `super_admin` | Acesso total |
| `adm` | Painel administrativo |
| `gestor` | Aprovação e workflow |
| `vendas` | Criação de solicitações |
| `fornecedor_ebst` | Fornecedor EBST |
| `fornecedor_hobart` | Fornecedor Hobart |

**Como definir um Custom Claim:**
```javascript
// Script Node.js a executar localmente com Admin SDK
const admin = require('firebase-admin');
admin.initializeApp();

await admin.auth().setCustomUserClaims('UID_DO_USUARIO', {
  role: 'adm'  // ou 'gestor', 'vendas', etc.
});
```

- [ ] Ao menos 1 usuário com role `super_admin` configurado
- [ ] Ao menos 1 usuário com role `adm` configurado
- [ ] Roles dos usuários existentes revisados e ajustados

---

## 5. Coleções Firestore — inicialização

As coleções são criadas automaticamente na primeira escrita. Mas alguns documentos devem ser criados manualmente:

- [ ] Coleção `fornecedores` — cadastrar EBST e Hobart com CNPJ real
- [ ] Coleção `users` — verificar se perfis de usuários existentes estão completos

---

## 6. Firestore Rules — deploy

```bash
# Deploy das rules e indexes
firebase deploy --only firestore --project workrail-solenis

# Testar no Firestore Rules Playground (Firebase Console)
# Firestore → Rules → Rules Playground
```

- [ ] Rules deployadas com sucesso
- [ ] Indexes deployados (`firestore.indexes.json`)
- [ ] Testado no Rules Playground para ao menos 3 cenários

---

## 7. Cloud Functions — deploy

```bash
# Instalar dependências
cd functions && npm install && cd ..

# Deploy
firebase deploy --only functions --project workrail-solenis
```

Após o deploy, verificar no Firebase Console:
- [ ] Function `getFirebaseConfig` aparece como **ativa** em `us-central1`
- [ ] Function `health` aparece como **ativa** em `us-central1`
- [ ] Function `cleanupRequestLog` aparece como **scheduled** em `us-central1`

---

## 8. Firebase Hosting — verificação pós-deploy

```bash
firebase deploy --only hosting --project workrail-solenis
```

- [ ] `https://workrail-solenis.web.app` abre a aplicação
- [ ] `POST https://workrail-solenis.web.app/api/config` retorna JSON com configuração (não placeholder)
- [ ] `GET https://workrail-solenis.web.app/api/health` retorna `{"status":"ok"}`
- [ ] Console do navegador (F12) sem erros críticos

---

## 9. Valores que precisam ser preenchidos (placeholders atuais)

| Onde | Campo | Ação necessária |
|------|-------|----------------|
| `functions/index.js` | `messagingSenderId` | Substituir `CONFIGURE_NO_ENV` pelo valor do Firebase Console |
| `functions/index.js` | `appId` | Substituir `CONFIGURE_NO_ENV` pelo valor do Firebase Console |
| `.github/workflows/deploy.yml` | Secret `FIREBASE_TOKEN` | Gerar com `firebase login:ci` |
| `.github/workflows/deploy.yml` | Secret `FIREBASE_API_KEY` | Copiar do Firebase Console |
| `.github/workflows/deploy.yml` | Secret `FIREBASE_MESSAGING_SENDER_ID` | Copiar do Firebase Console |
| `.github/workflows/deploy.yml` | Secret `FIREBASE_APP_ID` | Copiar do Firebase Console |
| `.github/workflows/deploy.yml` | Secret `FIREBASE_SERVICE_ACCOUNT_WORKRAIL_SOLENIS` | Baixar JSON do GCP IAM |

---

## 10. Validação final

```bash
# Health check
curl -s https://workrail-solenis.web.app/api/health | python3 -m json.tool

# Teste da config (deve retornar JSON sem placeholder)
curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{}' \
  https://workrail-solenis.web.app/api/config | python3 -m json.tool
```

- [ ] Health check retorna `{"status":"ok",...}`
- [ ] Config retorna objeto com `apiKey` real (não vazio nem placeholder)
- [ ] Login funciona no sistema
- [ ] Pelo menos 1 solicitação de teste criada com sucesso
