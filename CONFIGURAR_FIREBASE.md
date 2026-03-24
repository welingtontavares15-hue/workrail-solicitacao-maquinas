# Guia de Configuração — Firebase + WORKRAIL

## 1. Criar o Projeto no Firebase

1. Acesse [https://console.firebase.google.com](https://console.firebase.google.com)
2. Clique em **Adicionar projeto**
3. Dê um nome (ex: `workrail-solenis`) e conclua a criação

---

## 2. Registrar o App Web

1. No painel do projeto, clique no ícone **`</>`** (Web)
2. Dê um apelido ao app (ex: `workrail-web`)
3. Clique em **Registrar app**
4. Copie o objeto `firebaseConfig` exibido — ele terá este formato:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "workrail-solenis.firebaseapp.com",
  projectId: "workrail-solenis",
  storageBucket: "workrail-solenis.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

---

## 3. Substituir as Credenciais no workrail_v2.html

Abra o arquivo `workrail_v2.html` em qualquer editor de texto (Notepad, VS Code, etc.).

Localize o bloco (por volta da linha 3480):

```javascript
const FIREBASE_CONFIG = {
  apiKey:            'SUA_API_KEY_AQUI',
  authDomain:        'SEU_PROJETO.firebaseapp.com',
  projectId:         'SEU_PROJETO_ID',
  storageBucket:     'SEU_PROJETO.appspot.com',
  messagingSenderId: 'SEU_SENDER_ID',
  appId:             'SEU_APP_ID'
};
```

Substitua cada valor pelo correspondente copiado do Firebase Console.

---

## 4. Ativar Authentication (E-mail/Senha)

1. No Firebase Console → menu lateral → **Authentication**
2. Clique em **Começar**
3. Aba **Método de login** → selecione **E-mail/senha**
4. Ative e salve

---

## 5. Criar o Banco de Dados Firestore

1. Menu lateral → **Firestore Database**
2. Clique em **Criar banco de dados**
3. Selecione **Modo produção** e escolha a região (ex: `southamerica-east1`)
4. Conclua a criação

---

## 6. Ativar o Storage (para anexos/documentos)

1. Menu lateral → **Storage**
2. Clique em **Começar**
3. Aceite as regras padrão e escolha a mesma região do Firestore
4. Conclua

---

## 7. Criar o Primeiro Usuário Administrador

### Passo A — Criar o usuário na Authentication

1. **Authentication** → aba **Usuários** → **Adicionar usuário**
2. Preencha e-mail e senha do administrador
3. Após criar, copie o **UID** exibido (ex: `abc123xyz...`)

### Passo B — Criar o documento no Firestore

1. **Firestore Database** → **Iniciar coleção**
2. ID da coleção: `usuarios`
3. ID do documento: cole o **UID** copiado acima
4. Adicione os campos abaixo:

| Campo   | Tipo    | Valor              |
|---------|---------|--------------------|
| nome    | string  | Seu Nome Completo  |
| email   | string  | seu@email.com      |
| perfil  | string  | `super_admin`      |
| ativo   | boolean | `true`             |

---

## 8. Regras de Segurança do Firestore (recomendado)

No **Firestore → Regras**, substitua pelo conteúdo abaixo para proteger os dados:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Somente usuários autenticados leem/escrevem
    match /solicitacoes/{docId} {
      allow read, write: if request.auth != null;
    }
    match /usuarios/{docId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
        && get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.perfil == 'super_admin';
    }
    match /fornecedores/{docId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
        && get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.perfil == 'super_admin';
    }
    match /modelos_maquinas/{docId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
        && get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.perfil == 'super_admin';
    }
    match /contadores/{docId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 9. Regras de Segurança do Storage (recomendado)

No **Storage → Regras**, use:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 10. Estrutura de Coleções no Firestore

O sistema utiliza as seguintes coleções automaticamente:

| Coleção          | Descrição                                      |
|------------------|------------------------------------------------|
| `solicitacoes`   | Todos os pedidos de máquina (fluxo completo)   |
| `usuarios`       | Usuários do sistema e seus perfis de acesso    |
| `fornecedores`   | Cadastro de fornecedores (EBST, Hobart, etc.)  |
| `modelos_maquinas` | Modelos de máquinas disponíveis para seleção |
| `contadores`     | Contador automático para numeração WR-YYYY-XXXX |

---

## 11. Perfis de Acesso Disponíveis

| Perfil              | Papel no Sistema                          |
|---------------------|-------------------------------------------|
| `super_admin`       | Administrador total (usuários, cadastros) |
| `vendas`            | Abre e envia solicitações                 |
| `gestor`            | Aprova, reprova ou solicita ajuste        |
| `adm`               | ADM de Vendas (confere e encaminha)       |
| `fornecedor_ebst`   | Fornecedor EBST (recebe e anexa NF)       |
| `fornecedor_hobart` | Fornecedor Hobart (recebe e anexa NF)     |

---

## Pronto!

Após seguir todos os passos, abra o `workrail_v2.html` no navegador.
O sistema irá se conectar automaticamente ao Firebase configurado.
Faça login com o e-mail e senha do administrador criado no Passo 7.
