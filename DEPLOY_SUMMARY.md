# WORKRAIL — Deploy Summary

> **Versão:** 2.3.0
> **Projeto Firebase:** workrail-solenis
> **Data:** 2026-03-28

---

## Arquitetura de deploy

```
GitHub (push → main)
    │
    ▼
GitHub Actions — .github/workflows/deploy.yml
    │
    ├─► firebase deploy --only functions   (Cloud Functions Gen 2, us-central1)
    │       └─ getFirebaseConfig  → /api/config
    │       └─ health             → /api/health
    │       └─ cleanupRequestLog  → agendado a cada 1 hora
    │
    ├─► firebase deploy --only firestore   (Rules + Indexes)
    │
    └─► firebase deploy --only hosting     (SPA → workrail_v2.html)
            └─ https://workrail-solenis.web.app
            └─ https://workrail-solenis.firebaseapp.com
```

---

## Comandos de deploy (em ordem)

### Deploy completo via script (Windows):
```powershell
# Definir variáveis de ambiente primeiro
$env:FIREBASE_API_KEY = "AIzaSy..."

# Deploy completo
.\deploy.ps1

# Deploy seletivo
.\deploy.ps1 -FunctionsOnly    # Apenas Cloud Functions
.\deploy.ps1 -RulesOnly        # Apenas Firestore Rules
.\deploy.ps1 -HostingOnly      # Apenas Hosting
.\deploy.ps1 -Preview          # Preview channel temporário
```

### Deploy completo via CLI (Linux/macOS):
```bash
# Pré-requisito
export FIREBASE_API_KEY="AIzaSy..."
firebase login
firebase use workrail-solenis

# 1. Cloud Functions
cd functions && npm install && cd ..
firebase deploy --only functions --project workrail-solenis

# 2. Firestore Rules e Indexes
firebase deploy --only firestore --project workrail-solenis

# 3. Hosting
firebase deploy --only hosting --project workrail-solenis
```

### Deploy individual de Cloud Functions (gcloud):
```bash
# Opção quando firebase deploy de functions falhar
gcloud functions deploy getFirebaseConfig \
  --gen2 \
  --runtime nodejs18 \
  --trigger-http \
  --allow-unauthenticated \
  --region us-central1 \
  --source functions/ \
  --entry-point getFirebaseConfig \
  --set-env-vars FIREBASE_API_KEY="AIzaSy...",FIREBASE_MESSAGING_SENDER_ID="123",FIREBASE_APP_ID="1:..." \
  --project workrail-solenis

gcloud functions deploy health \
  --gen2 \
  --runtime nodejs18 \
  --trigger-http \
  --allow-unauthenticated \
  --region us-central1 \
  --source functions/ \
  --entry-point health \
  --project workrail-solenis
```

---

## Desenvolvimento local

```bash
# Instalar dependências
cd functions && npm install && cd ..

# Emulator local (Hosting + Functions)
firebase emulators:start --only hosting,functions

# Acessar localmente
# App:    http://localhost:5000
# Config: http://localhost:5001/workrail-solenis/us-central1/getFirebaseConfig
# Health: http://localhost:5001/workrail-solenis/us-central1/health
```

---

## Testes pós-deploy

```bash
# 1. Health check
curl -s https://workrail-solenis.web.app/api/health

# Resposta esperada:
# {"status":"ok","timestamp":"...","version":"2.3.0","services":{"firestore":"ok"}}

# 2. Config endpoint
curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{}' \
  https://workrail-solenis.web.app/api/config

# Resposta esperada:
# {"apiKey":"AIzaSy...","authDomain":"workrail-solenis.firebaseapp.com","projectId":"workrail-solenis",...}

# 3. App carrega sem erros
# Abrir https://workrail-solenis.web.app e verificar F12 → Console
```

---

## Rollback

```bash
# Listar versões do Hosting
firebase hosting:versions:list --project workrail-solenis

# Fazer rollback para versão anterior
firebase hosting:releases --project workrail-solenis
# ou via Firebase Console → Hosting → Release history → Rollback

# Rollback de Cloud Functions: redeployar a versão anterior do código
git checkout <commit-anterior> -- functions/
firebase deploy --only functions --project workrail-solenis
```

---

## URLs relevantes

| Recurso | URL |
|---------|-----|
| Aplicação | https://workrail-solenis.web.app |
| Firebase Console | https://console.firebase.google.com/project/workrail-solenis |
| GCP Console | https://console.cloud.google.com/home/dashboard?project=workrail-solenis |
| Cloud Functions | https://console.cloud.google.com/functions/list?project=workrail-solenis |
| Firestore | https://console.firebase.google.com/project/workrail-solenis/firestore |
| Logs (Functions) | https://console.cloud.google.com/logs?project=workrail-solenis |
| GitHub Actions | https://github.com/welingtontavares15-hue/workrail-solicitacao-maquinas/actions |
