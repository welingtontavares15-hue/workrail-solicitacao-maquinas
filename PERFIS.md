# 👥 Perfis de Acesso — WORKRAIL

Documentação completa dos perfis de usuário, permissões e responsabilidades.

---

## 📋 Perfis Disponíveis

| Perfil Atual | Recomendado | Descrição |
|--------------|-------------|-----------|
| `super_admin` | Administrador do Sistema | Gerencia toda plataforma |
| `adm` | Administrativo | Gerencia fluxo, fornecedores, documentação |
| `gestor` | Gestor | Avalia solicitações |
| `vendas` | Solicitante | Cria solicitações |
| `fornecedor_ebst` | Fornecedor | Atende pedidos EBST |
| `fornecedor_hobart` | Fornecedor | Atende pedidos Hobart Brasil |

---

## 🔑 Perfil 1: Administrador do Sistema

**ID:** `super_admin`

### 🎯 Responsabilidades

- Gestão completa da plataforma
- Criação e gerenciamento de usuários
- Configuração de fornecedores e modelos
- Acesso a todos os dados e relatórios
- Controle de permissões e segurança

### 📊 Acessos

| Recurso | Permissão | Descrição |
|---------|-----------|-----------|
| **Usuários** | Criar, ler, editar, desativar | Gerenciar toda base de usuários |
| **Solicitações** | Ler todas | Ver todas as solicitações |
| **Fornecedores** | Criar, ler, editar | Cadastrar e manter fornecedores |
| **Modelos** | Criar, ler, editar | Adicionar novos modelos de máquinas |
| **Dashboard Admin** | Acesso total | Painel de gestão completo |
| **Relatórios** | Todos | Gerar qualquer tipo de relatório |
| **Configurações** | Editar | Ajustar parâmetros do sistema |

### 🛠️ Menu

```
├── 🏠 Início
├── 📊 Dashboard Admin
├── ⚙️ Configurações
│   ├── Usuários
│   ├── Fornecedores
│   └── Modelos de Máquinas
├── 📈 Relatórios
├── 📋 Histórico
└── Logout
```

### 🔒 Restrições

- Não pode desativar a si próprio
- Deve manter pelo menos um admin ativo

### 👤 Exemplo

```javascript
{
  uid: "admin-001",
  nome: "Welington Tavares",
  email: "welingtontavares15@gmail.com",
  perfil: "super_admin",
  fornecedor: null,
  ativo: true
}
```

---

## 🏢 Perfil 2: Administrativo (ADM de Vendas)

**ID:** `adm`

### 🎯 Responsabilidades

- Gerenciar fluxo de solicitações
- Revisar documentação
- Encaminhar para fornecedores
- Acompanhar logística e instalação
- Validar conclusão de solicitações

### 📊 Acessos

| Recurso | Permissão | Descrição |
|---------|-----------|-----------|
| **Solicitações** | Ler, atualizar todas | Ver e mover todas solicitações |
| **Documentos** | Ler, deletar | Gerenciar anexos |
| **Fornecedores** | Ler | Ver lista de fornecedores |
| **Dashboard** | Acesso | Ver métricas gerais |
| **Histórico** | Ler completo | Ver movimentações detalhadas |

### 🛠️ Menu

```
├── 🏠 Início
├── 📊 Dashboard
├── 📋 Histórico (todas)
├── 📝 Pendentes (Gestor)
├── 🔄 Em Andamento (Fornecedor)
├── 📮 Notificações
└── Logout
```

### 🎯 Etapas do Fluxo

- **Etapa 3 (ADM)** — Revisa documentação, encaminha fornecedor
- **Etapa 5 (Entrega)** — Acompanha logística
- **Etapa 7 (Relatório)** — Valida conclusão

### 📋 Validações

- ✓ Pode revisar relatório inicial
- ✓ Pode validar checklist
- ✓ Pode encaminhar ao fornecedor
- ✗ **Não pode** criar solicitações
- ✗ **Não pode** editar dados de clientes
- ✗ **Não pode** acessar painel admin

---

## 📊 Perfil 3: Gestor

**ID:** `gestor`

### 🎯 Responsabilidades

- Avaliar solicitações de máquinas
- Aprovar ou reprovar com fundamentação
- Solicitar ajustes quando necessário
- Anexar checklist de instalação

### 📊 Acessos

| Recurso | Permissão | Descrição |
|---------|-----------|-----------|
| **Solicitações** | Ler e aprovar | Ver e processar solicitações |
| **Checklist** | Upload | Anexar checklist de instalação |
| **Documentos** | Ler | Ver relatório inicial |
| **Histórico** | Ler próprias ações | Ver seus processos |

### 🛠️ Menu

```
├── 🏠 Início
├── 📊 Dashboard
├── ⏳ Pendentes (sua etapa)
├── 📋 Histórico
├── 📮 Notificações
└── Logout
```

### 🎯 Etapa do Fluxo

- **Etapa 2 (Gestor)** — Análise e aprovação

### 🔄 Ações Possíveis

```javascript
confirmAprovar() {
  // ✓ Aprova solicitação
  // ✓ Anexa checklist
  // → Status: adm
}

confirmReprovar() {
  // ✓ Reprova com motivo
  // → Status: solicitacao (retorna)
}

confirmSolicitar() {
  // ✓ Solicita ajuste
  // → Status: solicitacao (retorna)
}
```

### ✅ Checklist Obrigatório

O gestor **DEVE** anexar checklist para aprovar:

```javascript
if (tipo === 'aprovar' && !fChecklist.files.length) {
  alert('Checklist de Instalação é obrigatório');
  return;
}
```

### 📋 Validações

- ✓ Pode ler relatório inicial
- ✓ Pode revisar modelo escolhido
- ✓ Pode aprova/reprovar
- ✗ **Não pode** editar dados da solicitação
- ✗ **Não pode** ver outros departamentos
- ✗ **Não pode** finalizar fluxo

---

## 💼 Perfil 4: Solicitante (Vendas)

**ID:** `vendas`

### 🎯 Responsabilidades

- Criar solicitações de máquinas
- Fornecer dados do cliente
- Anexar relatório inicial
- Acompanhar andamento
- Receber feedback e ajustar

### 📊 Acessos

| Recurso | Permissão | Descrição |
|---------|-----------|-----------|
| **Solicitações** | Criar e ler próprias | Novo pedido e acompanhar |
| **Edição** | Dados até aprovação | Pode ajustar antes de gestor |
| **Histórico** | Próprias solicitações | Ver apenas seus pedidos |
| **Dashboard** | Personalizado | Suas métricas |

### 🛠️ Menu

```
├── 🏠 Início
├── ➕ Nova Solicitação
├── 📋 Minhas Solicitações
├── 📊 Meu Dashboard
├── 📮 Notificações
└── Logout
```

### 🎯 Etapa do Fluxo

- **Etapa 1 (Solicitação)** — Criar e anexar relatório

### 📝 Campos Obrigatórios

```javascript
{
  cliente: "Lavanderia XYZ",           // ← Obrigatório
  endereco: "Rua A, 123",               // ← Obrigatório
  cidade: "São Paulo",                  // ← Obrigatório
  cnpj: "12.345.678/0001-90",           // ← Obrigatório
  contatoNome: "Maria",                 // ← Obrigatório
  contatoTelefone: "(11) 9999-9999",    // ← Obrigatório
  modelo: "Modelo A",                   // ← Obrigatório
  relatorioInicial: "arquivo.pdf"       // ← Obrigatório
}
```

### 📋 Validações

- ✓ Pode criar nova solicitação
- ✓ Pode editar antes de enviar
- ✓ Pode acompanhar status
- ✓ Pode receber feedback
- ✓ Pode reenviar se solicitado ajuste
- ✗ **Não pode** ver solicitações de outros
- ✗ **Não pode** aprovar/reprovar
- ✗ **Não pode** gerenciar usuários

---

## 🏭 Perfil 5: Fornecedor EBST

**ID:** `fornecedor_ebst`

### 🎯 Responsabilidades

- Receber solicitações destinadas a EBST
- Preparar máquina conforme especificação
- Anexar Nota Fiscal
- Participar de logística

### 📊 Acessos

| Recurso | Permissão | Descrição |
|---------|-----------|-----------|
| **Solicitações** | Ler e atualizar (EBST) | Ver apenas solicitações EBST |
| **NF** | Upload | Anexar nota fiscal |
| **Histórico** | Leitura | Ver andamento |

### 🛠️ Menu

```
├── 🏠 Início (redirecionado)
├── 📋 Solicitações EBST
├── ⏳ Aguardando Ação
├── 📮 Notificações
└── Logout
```

### 🎯 Etapa do Fluxo

- **Etapa 4 (Fornecedor)** — Preparar e anexar NF

### 🔄 Ação Principal

```javascript
confirmarNF() {
  // ✓ Anexa Nota Fiscal
  // → Status: logistica
}
```

### 📋 Validações

```javascript
// Firestore Rules: só vê solicitações com:
dadosAdm.fornecedor == 'EBST'

// Só pode update em:
dadosAdm.fornecedor == 'EBST' (consistência)
```

---

## 🏭 Perfil 6: Fornecedor Hobart

**ID:** `fornecedor_hobart`

### 🎯 Responsabilidades

Idênticas ao Fornecedor EBST, mas para:
- Solicitações Hobart Brasil

### 📊 Acessos

| Recurso | Permissão | Descrição |
|---------|-----------|-----------|
| **Solicitações** | Ler e atualizar (Hobart) | Ver apenas solicitações Hobart |
| **NF** | Upload | Anexar nota fiscal |

### 🎯 Etapa do Fluxo

- **Etapa 4 (Fornecedor)** — Preparar e anexar NF

### 📋 Validações

```javascript
// Firestore Rules: só vê solicitações com:
dadosAdm.fornecedor == 'Hobart Brasil'
```

---

## 📊 Matriz de Permissões

```
┌─────────────────────┬──────┬────────┬────────┬────────┬──────┐
│ Recurso             │ Super│ ADM    │ Gestor │ Vendas │ Fornec
├─────────────────────┼──────┼────────┼────────┼────────┼──────┤
│ Criar Solicitação   │  ✓   │   ✗    │   ✗    │   ✓    │  ✗   │
│ Ler (todas)         │  ✓   │   ✓    │   ✗    │   ✗    │  ✗   │
│ Ler (próprias)      │  ✓   │   ✓    │   ✓    │   ✓    │  ✓   │
│ Editar Status       │  ✓   │   ✓    │   ✓    │   ✗    │  ✓   │
│ Criar Usuário       │  ✓   │   ✗    │   ✗    │   ✗    │  ✗   │
│ Editar Usuário      │  ✓   │   ✗    │   ✗    │   ✗    │  ✗   │
│ Anexar Documentos   │  ✓   │   ✓    │   ✓    │   ✓    │  ✓   │
│ Ver Dashboard Admin │  ✓   │   ✗    │   ✗    │   ✗    │  ✗   │
│ Ver Relatórios      │  ✓   │   ✓    │   ✗    │   ✗    │  ✗   │
│ Configurações       │  ✓   │   ✗    │   ✗    │   ✗    │  ✗   │
└─────────────────────┴──────┴────────┴────────┴────────┴──────┘
```

---

## 🔐 Implementação no Código

### No HTML (`PERFIS` const)

```javascript
const PERFIS = {
  super_admin: {
    label: 'Administrador',
    chip: 'c-admin',
    cor: '#b71c1c'
  },
  adm: {
    label: 'ADM Vendas',
    chip: 'c-approved',
    cor: '#2e7d32'
  },
  gestor: {
    label: 'Gestor',
    chip: 'c-analysis',
    cor: '#1565c0'
  },
  vendas: {
    label: 'Vendas',
    chip: 'c-pending',
    cor: '#e65100'
  },
  fornecedor_ebst: {
    label: 'Fornecedor EBST',
    chip: 'c-supplier',
    cor: '#4527a0'
  },
  fornecedor_hobart: {
    label: 'Fornecedor Hobart',
    chip: 'c-supplier',
    cor: '#4527a0'
  }
};
```

### No Menu (`aplicarControleMenu`)

```javascript
const regras = {
  'sb-solicitacao': ['vendas', 'adm'],
  'sb-pendentes': ['gestor', 'adm'],
  'sb-relatorios': ['gestor', 'adm', 'super_admin'],
  'sb-configuracoes': ['adm', 'super_admin'],
  'sb-admin': ['super_admin']  // Apenas super_admin
};
```

### No Firestore (Rules)

```javascript
function isInterno() {
  return perfil() in ['super_admin', 'adm', 'gestor', 'vendas'];
}

match /usuarios/{uid} {
  allow read:  if request.auth.uid == uid || perfil() in ['adm','super_admin'];
  allow write: if perfil() in ['adm','super_admin'];
}

match /solicitacoes/{docId} {
  allow read, write: if request.auth != null && isInterno();
  allow read, update: if isFornecedorEBST()
                      && resource.data.dadosAdm.fornecedor == 'EBST';
}
```

---

## 🆕 Recomendação de Padronização

Para melhor clareza e manutenção futura, recomenda-se:

| ID Atual | ID Proposto | Label |
|----------|-------------|-------|
| `super_admin` | `administrador_sistema` | Administrador do Sistema |
| `adm` | `administrativo` | Administrativo |
| `gestor` | `gestor` | Gestor |
| `vendas` | `solicitante` | Solicitante |
| `fornecedor_ebst` | `fornecedor` | Fornecedor (com tipo) |
| `fornecedor_hobart` | `fornecedor` | Fornecedor (com tipo) |

**Nota:** Esta mudança requer migração de dados no Firestore.

---

## 📞 Criar Novo Usuário

### Via Admin Panel

```javascript
salvarUsuarioAdmin() {
  // 1. Preenche: Nome, E-mail, Perfil
  // 2. Se novo: Cria no Firebase Auth (app secundário)
  // 3. Cria documento em usuarios/{uid}
  // 4. Envia email de boas-vindas (opcional)
}
```

### Campos

```javascript
{
  nome: "João Silva",
  email: "joao@empresa.com",
  perfil: "vendas",           // ou adm, gestor, super_admin, etc
  fornecedor: null,           // ou "EBST", "Hobart Brasil"
  ativo: true
}
```

---

**Última atualização: 2026-03-23**
