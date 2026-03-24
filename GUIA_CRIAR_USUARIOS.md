# 🔑 GUIA — Como Criar Usuários Automaticamente

**Tempo estimado:** 10 minutos

---

## 📋 Opção 1: Via Cloud Shell (Recomendado - Mais Fácil)

### Passo 1: Copiar Script JavaScript

1. Abra este arquivo: `criar_usuarios_firebase.js`
2. Copie TODO o conteúdo

### Passo 2: Abrir Cloud Shell no Firebase

1. Vá para https://console.firebase.google.com
2. Selecione seu projeto **WORKRAIL-Solenis**
3. Vá para **Firestore Database**
4. Clique no ícone `>_` (Cloud Shell) no canto superior direito

### Passo 3: Executar Script

Cole este código no Cloud Shell:

```javascript
const admin = require('firebase-admin');
admin.initializeApp();

const USUARIOS = [
  {
    email: 'vendas@solenis.com',
    senha: 'senha123',
    nome: 'Representante Vendas',
    perfil: 'vendas',
    fornecedor: null
  },
  {
    email: 'gestor@solenis.com',
    senha: 'senha123',
    nome: 'Gestor de Vendas',
    perfil: 'gestor',
    fornecedor: null
  },
  {
    email: 'adm@solenis.com',
    senha: 'senha123',
    nome: 'Administrador de Vendas',
    perfil: 'adm',
    fornecedor: null
  },
  {
    email: 'fornecedor-ebst@solenis.com',
    senha: 'senha123',
    nome: 'Fornecedor EBST',
    perfil: 'fornecedor_ebst',
    fornecedor: 'EBST'
  },
  {
    email: 'fornecedor-hobart@solenis.com',
    senha: 'senha123',
    nome: 'Fornecedor Hobart',
    perfil: 'fornecedor_hobart',
    fornecedor: 'Hobart Brasil'
  },
  {
    email: 'instalacao@solenis.com',
    senha: 'senha123',
    nome: 'Supervisor Técnico',
    perfil: 'instalacao',
    fornecedor: null
  }
];

async function criarUsuario(usuario) {
  try {
    const userRecord = await admin.auth().createUser({
      email: usuario.email,
      password: usuario.senha,
      displayName: usuario.nome,
      emailVerified: false
    });

    console.log(`✅ ${usuario.email} criado`);

    await admin.firestore().collection('usuarios').doc(userRecord.uid).set({
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      fornecedor: usuario.fornecedor,
      ativo: true,
      criadoEm: new Date().toISOString(),
      ultimoAcesso: null,
      emailVerificado: false
    });

    return { email: usuario.email, status: 'sucesso' };
  } catch (erro) {
    console.error(`❌ ${usuario.email}: ${erro.message}`);
    return { email: usuario.email, status: 'erro', erro: erro.message };
  }
}

async function executar() {
  console.log('🚀 Criando usuários...\n');
  for (const usuario of USUARIOS) {
    await criarUsuario(usuario);
  }
  console.log('\n✨ Concluído!');
}

executar();
```

### Passo 4: Aguardar Conclusão

Você verá algo como:

```
🚀 Criando usuários...

✅ vendas@solenis.com criado
✅ gestor@solenis.com criado
✅ adm@solenis.com criado
✅ fornecedor-ebst@solenis.com criado
✅ fornecedor-hobart@solenis.com criado
✅ instalacao@solenis.com criado

✨ Concluído!
```

---

## 💻 Opção 2: Via Python (Se Preferir Local)

### Pré-requisitos

```bash
# Instalar Firebase Admin SDK
pip install firebase-admin
```

### Passo 1: Baixar Chave de Serviço

1. Vá para https://console.firebase.google.com
2. Clique ⚙️ → **Project Settings**
3. Vá para **Service Accounts**
4. Clique **"Generate New Private Key"**
5. Salve como `firebase-key.json` na mesma pasta do script

### Passo 2: Executar Script

```bash
python criar_usuarios_firebase.py
```

### Passo 3: Verificar Resultado

Arquivo `resultado_criacao_usuarios.json` será criado com detalhes.

---

## ⚙️ Personalizar Senhas

Antes de executar, você pode mudar as senhas padrão:

```javascript
// ANTES:
{
  email: 'vendas@solenis.com',
  senha: 'senha123',  // ← Mudar para algo mais seguro
  ...
}

// DEPOIS:
{
  email: 'vendas@solenis.com',
  senha: 'MinhaS3nh@F0rt3', // ← Melhor
  ...
}
```

---

## 🔐 Segurança: Trocar Senhas Iniciais

Após criar os usuários, peça a cada pessoa para:

1. Entrar no WORKRAIL com email + senha inicial
2. Clicar em perfil (canto superior direito)
3. "Trocar Senha"
4. Definir nova senha pessoal

---

## ✅ Verificar Usuários Criados

### Via Firebase Console

1. Vá para **Authentication**
2. Abra aba **Users**
3. Você deve ver 6 usuários listados

### Via Firestore

1. Vá para **Firestore Database**
2. Abra coleção **usuarios**
3. Você deve ver 6 documentos (um para cada usuário)

---

## 🆘 Troubleshooting

### Erro: "Email já existe"

**Causa:** Usuário já foi criado anteriormente.

**Solução:**
1. Vá para **Firebase Authentication**
2. Delete o usuário existente
3. Execute o script novamente

### Erro: "Permission denied"

**Causa:** Suas regras do Firestore não permitem escrita.

**Solução:**
1. Vá para **Firestore Database** → **Rules**
2. Use regras de teste (abra para todos):
```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```
3. **Depois** configure regras reais (veja INSTRUCOES_CONFIGURACAO.md)

### Erro: "Cloud Shell não aparece"

**Solução:** Tente outro navegador (Chrome recomendado)

---

## 📊 Próximos Passos

Após criar os usuários:

```
1. ✅ Usuários criados (este guia)
2. ⏳ Testar login com vendas@solenis.com
3. ⏳ Testar fluxo completo (Vendas → Gestor → ADM)
4. ⏳ Verificar emails chegando
5. ⏳ Deploy em produção
```

---

## 🎯 Resumo de Usuários Criados

| Email | Senha | Perfil | Função |
|-------|-------|--------|--------|
| vendas@solenis.com | senha123 | vendas | Criar solicitações |
| gestor@solenis.com | senha123 | gestor | Aprovar/rejeitar |
| adm@solenis.com | senha123 | adm | Revisar contrato |
| fornecedor-ebst@solenis.com | senha123 | fornecedor_ebst | Confirmar entrega |
| fornecedor-hobart@solenis.com | senha123 | fornecedor_hobart | Confirmar entrega |
| instalacao@solenis.com | senha123 | instalacao | Agendar instalação |

---

**Dúvidas?** Consulte INSTRUCOES_CONFIGURACAO.md para mais detalhes.

**Última atualização:** 24/03/2026
