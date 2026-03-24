# 🏢 WORKRAIL — Sistema de Gestão de Máquinas de Lavar Louças

**Plataforma web para controle completo do fluxo de solicitação, aprovação, fornecimento e instalação de máquinas de lavanderia industrial.**

[![Status](https://img.shields.io/badge/status-active-brightgreen)]()
[![License](https://img.shields.io/badge/license-proprietary-red)]()
[![Firebase](https://img.shields.io/badge/backend-Firebase-orange)]()

---

## 📋 Sobre

WORKRAIL é uma aplicação web de página única (SPA) que gerencia o fluxo completo de solicitações de máquinas:

1. **Vendedor** (Solicitante) — Cria nova solicitação
2. **Gestor** — Avalia e aprova com checklist
3. **ADM de Vendas** — Revisa documentação e encaminha fornecedor
4. **Fornecedor** — Prepara máquina e anexa nota fiscal
5. **Logística & Instalação** — Acompanha entrega e instala máquina
6. **Relatório** — Documenta conclusão da instalação

---

## 🚀 Quick Start

### 1. Abrir a Aplicação

```bash
# Simplesmente abra em um navegador:
file:///caminho/para/workrail.html
```

### 2. Configurar Firebase

Siga o guia em [`CONFIGURAR_FIREBASE.md`](./CONFIGURAR_FIREBASE.md):

```javascript
// Você precisará de:
const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};

const FORMSUBMIT_EMAIL = "seu-email@dominio.com";
```

### 3. Criar Primeiro Admin

No console do navegador (F12 → Console):

```javascript
criarPrimeiroAdmin()
// Preencha: email, senha (mín. 6 chars), nome completo
```

### 4. Fazer Login

Use as credenciais criadas para acessar como Administrador.

---

## 👥 Perfis de Acesso

| Perfil | Acesso | Descrição |
|--------|--------|-----------|
| **Administrador do Sistema** | Total | Gerencia usuários, configurações, fornecedores |
| **ADM de Vendas** | Total (solicitações) | Revisa docs, encaminha fornecedor, acompanha |
| **Gestor** | Avaliação | Aprova/reprova, anexa checklist |
| **Solicitante** (Vendas) | Criar & acompanhar | Cria solicitação, vê histórico |
| **Fornecedor EBST** | Filtrado | Vê apenas solicitações EBST |
| **Fornecedor Hobart** | Filtrado | Vê apenas solicitações Hobart Brasil |

[Documentação completa de perfis →](./docs/PERFIS.md)

---

## 📂 Estrutura do Projeto

```
workrail/
├── workrail.html                    # Aplicação principal (SPA)
├── CONFIGURAR_FIREBASE.md           # Setup do Firebase
├── CHANGELOG.md                     # Histórico de versões
│
└── docs/
    ├── DATABASE.md                  # Estrutura do Firestore
    ├── FLUXO.md                     # Fluxo de solicitação
    ├── PERFIS.md                    # Descrição de perfis
    ├── setup/
    │   └── admin_firebase.md        # Instruções admin
    ├── technical/
    │   ├── analise_super_admin_fix.md
    │   └── mudancas_codigo.txt
    └── utilitarios/
        └── criar_admin_firebase.html
```

---

## 🛠️ Tecnologias

- **Frontend**: HTML5 + CSS3 + JavaScript (Vanilla)
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Notificações**: FormSubmit (Email)
- **Hospedagem**: GitHub Pages (recomendado)

---

## 🔐 Segurança

✅ **Autenticação Firebase** — Baseada em email/senha
✅ **Firestore Rules** — Controle de acesso por perfil
✅ **Validações** — Frontend e regras de banco de dados
✅ **Transações Firestore** — Integridade de dados
✅ **Contadores sequenciais** — Protocolo único por ano

[Detalhes de segurança →](./docs/SECURITY.md) (futuro)

---

## 📖 Documentação

### Setup
- [Como Configurar Firebase](./CONFIGURAR_FIREBASE.md) — **Comece aqui**
- [Instruções Admin](./docs/setup/admin_firebase.md) — Gerenciar usuários

### Técnico
- [Estrutura do Banco de Dados](./docs/DATABASE.md) — Schema Firestore
- [Fluxo de Solicitação](./docs/FLUXO.md) — Etapas e transições
- [Análise de Correções](./docs/technical/analise_super_admin_fix.md) — Bug fixes

### Uso
- [Perfis de Acesso](./docs/PERFIS.md) — Permissões por perfil
- [Utilitários](./docs/utilitarios/) — Ferramentas auxiliares

---

## 📋 Funcionalidades

### ✓ Implementadas

- [x] Autenticação multi-perfil
- [x] Fluxo de solicitação com 7 etapas
- [x] Validação de documentos obrigatórios
- [x] Upload de arquivos (Relatório, Checklist, NF, Relatório Final)
- [x] Histórico de movimentações com timestamps
- [x] Notificações por email (FormSubmit)
- [x] Painel Admin (criar/editar/desativar usuários)
- [x] Dashboard com métricas
- [x] Filtro de solicitações por status
- [x] Suporte a múltiplos fornecedores
- [x] Protocolo único por solicitação (sequencial)

### 🔄 Planejadas

- [ ] Padronização de nomes de perfis
- [ ] Relatórios analíticos avançados
- [ ] Agendamento de instalações
- [ ] API REST para integrações
- [ ] Aplicativo mobile

---

## 🐛 Reportar Issues

Encontrou um bug? Siga estes passos:

1. Abra o DevTools (F12 → Console)
2. Procure por mensagens `[WORKRAIL]`
3. Copie a mensagem de erro completa
4. Abra uma [issue no GitHub](https://github.com/welingtontavares15-hue/workrail-solicitacao-maquinas/issues)

---

## 📞 Suporte

Para dúvidas ou sugestões:
- Email: welingtontavares15@gmail.com
- GitHub Issues: [Abrir issue](https://github.com/welingtontavares15-hue/workrail-solicitacao-maquinas/issues)

---

## 📜 Changelog

Ver [CHANGELOG.md](./CHANGELOG.md) para histórico completo de versões.

**Última atualização:** Março 2026

---

## ⚖️ Licença

Proprietary — Diversey Brasil / Solenis LLC

---

**Desenvolvido com ❤️ para otimizar o fluxo de solicitações.**
