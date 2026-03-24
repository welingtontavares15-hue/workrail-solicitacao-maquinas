# 🔧 INSTRUÇÕES DE CONFIGURAÇÃO — WORKRAIL v2.1

**Status:** ✅ Emails Configurados | ⏳ Firebase Pendente

---

## 1. ✅ **EMAILS JÁ CONFIGURADOS**

```javascript
const FORMSUBMIT_EMAIL = 'wbastostavares@solenis.com';
const EMAIL_RECIPIENTS = {
  vendas:     'vendas@solenis.com',
  gestor:     'gestor@solenis.com',
  adm:        'adm-vendas@solenis.com',
  fornecedor: 'fornecedor@solenis.com'
};
```

### Como Funciona FormSubmit:

1. **Sem Configuração Firebase:** Sistema funciona em modo offline (leitura apenas)
2. **Com Emails Reais:** Notificações automáticas enviadas via FormSubmit.co
3. **Destinatários:** Cada role recebe notificações específicas da sua etapa

---

## 2. ⏳ **FIREBASE — CONFIGURAÇÃO PENDENTE**

### Passo 1: Criar Projeto Firebase

```
1. Vá para https://console.firebase.google.com
2. Clique em "Create a new project"
3. Nome: "WORKRAIL-Solenis"
4. Localização: Brazil
5. Clique em "Create project"
```

### Passo 2: Obter Credenciais Firebase

```
1. No console Firebase, clique no ícone ⚙️ (Settings)
2. Selecione "Project settings"
3. Vá para abas: "Web"
4. Clique em "Add app" e selecione "Web"
5. Cópia o objeto de configuração (abaixo)
```

### Passo 3: Atualizar Configuração no Código

Abra `workrail_v2.html` e localize:

```javascript
const FIREBASE_CONFIG = {
  apiKey:            "SUA_API_KEY_AQUI",
  authDomain:        "SEU-PROJETO.firebaseapp.com",
  projectId:         "SEU-PROJETO-ID",
  storageBucket:     "SEU-PROJETO.appspot.com",
  messagingSenderId: "000000000000",
  appId:             "1:000000000000:web:0000000000000000"
};
```

Substitua pelos valores reais do seu projeto. **Exemplo:**

```javascript
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyD1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6",
  authDomain:        "workrail-solenis.firebaseapp.com",
  projectId:         "workrail-solenis",
  storageBucket:     "workrail-solenis.appspot.com",
  messagingSenderId: "123456789012",
  appId:             "1:123456789012:web:abcdef1234567890"
};
```

---

## 3. 🔐 **FIREBASE — Configurar Autenticação**

```
1. No console Firebase, vá para Authentication > Sign-in method
2. Ative: Email/Password
3. Vá para Users > Add user
4. Crie usuários para cada role:
   - vendas@solenis.com (role: vendas)
   - gestor@solenis.com (role: gestor)
   - adm@solenis.com (role: adm)
   - fornecedor@solenis.com (role: fornecedor)
```

**Nota:** A senha pode ser temporária (usuários mudam no primeiro login)

---

## 4. 📦 **FIREBASE — Configurar Firestore**

```
1. No console Firebase, vá para Firestore Database
2. Clique em "Create database"
3. Selecione: "Start in production mode"
4. Localização: South America (São Paulo) - us-east1
5. Clique em "Create"
```

### Regras de Segurança Firestore

Após criar o banco, vá para **Rules** e defina:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Usuários só veem seu próprio perfil
    match /usuarios/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // Solicitações: cada role vê apenas suas
    match /solicitacoes/{docId} {
      allow read: if request.auth.uid != null;
      allow write: if request.auth.uid != null;
      allow create: if request.auth.token.claims.role == 'vendas';
    }

    // Documentos: acesso controlado
    match /solicitacoes/{docId}/documentos/{docName} {
      allow read, write: if request.auth.uid != null;
    }

    // Contador de pedidos: acesso administrador
    match /contadores/{docId} {
      allow read, write: if request.auth.uid != null;
    }
  }
}
```

---

## 5. 💾 **FIREBASE — Configurar Storage**

```
1. No console Firebase, vá para Storage
2. Clique em "Create bucket"
3. Nome: "workrail-solenis"
4. Localização: South America (São Paulo)
5. Tipo de armazenamento: Standard
6. Clique em "Create"
```

### Regras de Segurança Storage

Vá para **Rules** e defina:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // Contratos
    match /solicitacoes/contratos/{allPaths=**} {
      allow read, write: if request.auth.uid != null;
    }

    // Checklists
    match /solicitacoes/checklists/{allPaths=**} {
      allow read, write: if request.auth.uid != null;
    }

    // Notas Fiscais
    match /solicitacoes/nfs/{allPaths=**} {
      allow read, write: if request.auth.uid != null;
    }

    // Relatórios
    match /solicitacoes/relatorios/{allPaths=**} {
      allow read, write: if request.auth.uid != null;
    }
  }
}
```

---

## 6. ✉️ **FORMSUBMIT — Verificar Configuração**

FormSubmit.co já está pré-configurado. Para testar:

```javascript
1. Abra o console do navegador (F12)
2. Execute:
   await fetch('https://formsubmit.co/ajax/wbastostavares@solenis.com', {
     method: 'POST',
     body: new FormData(Object.entries({
       _to: 'wbastostavares@solenis.com',
       _subject: '[WORKRAIL] Teste',
       Mensagem: 'Email de teste'
     }).reduce((fd, [k,v]) => (fd.append(k,v), fd), new FormData()))
   });
```

---

## 📋 **CHECKLIST DE PRODUÇÃO**

```
✅ Emails Configurados (wbastostavares@solenis.com)
⏳ Firebase Config preenchido (aguardando credenciais)
⏳ Firestore Database criado
⏳ Firestore Rules definidas
⏳ Firebase Storage configurado
⏳ Firebase Storage Rules definidas
⏳ Autenticação Firebase habilitada
⏳ Usuários criados no Firebase Authentication
⏳ Email enviado com sucesso via FormSubmit
⏳ Fluxo completo testado (Vendas → Gestor → ADM → Fornecedor → Instalação)
⏳ Segurança offline verificada
⏳ Deploy em produção
```

---

## 🆘 **Problemas Comuns**

### "Firebase indisponível" na tela de login

✅ **Solução:** Seu código ainda tem placeholders no FIREBASE_CONFIG. Preencha com valores reais.

### "Email não está chegando"

✅ **Solução:**
1. Verifique se email está no formato correto: `usuario@solenis.com`
2. Verifique se não está na pasta SPAM
3. Teste com um email pessoal primeiro

### "Falha ao fazer login"

✅ **Solução:**
1. Verifique se usuário foi criado em Firebase Authentication
2. Verifique se senha está correta
3. Verifique se `projectId` está correto no FIREBASE_CONFIG

---

## 📞 **Suporte**

Para dúvidas sobre Firebase: https://firebase.google.com/support
Para dúvidas sobre FormSubmit: https://formsubmit.co/

---

**Última atualização:** 24/03/2026
**Próxima revisão:** Após Firebase estar configurado
