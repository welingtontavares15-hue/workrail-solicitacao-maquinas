# 🗄️ Estrutura do Banco de Dados — Firestore

Documentação da estrutura de coleções, documentos e campos no Firestore do WORKRAIL.

---

## 📊 Overview

```
Firestore (workrail-solenis)
├── usuarios/                    (Usuários do sistema)
├── solicitacoes/                (Pedidos de máquinas)
├── documentos/                  (Arquivos anexados)
├── contadores/                  (Sequenciais)
├── fornecedores/                (Cadastro de fornecedores)
└── modelos_maquinas/            (Modelos disponíveis)
```

---

## 👥 Coleção: `usuarios/`

**Propósito:** Armazenar usuários e seus perfis de acesso.

### Documento: `{uid}`

Onde `uid` = UID do Firebase Auth

```javascript
{
  uid: "abc123def456",                    // UID do Firebase Auth
  nome: "Welington Tavares",              // Nome completo
  email: "welingtontavares15@gmail.com",  // E-mail
  perfil: "super_admin",                  // Perfil de acesso
  fornecedor: null,                       // Fornecedor (se aplicável)
  ativo: true,                            // Usuário ativo?
  criadoEm: Timestamp(2026-03-23),        // Data de criação
  criadoPor: "SISTEMA",                   // Quem criou
  migradoEm: Timestamp(2026-03-23)        // Data de migração (opcional)
}
```

### Campos

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-----------|-----------|
| `uid` | string | Sim | UID do Firebase Auth |
| `nome` | string | Sim | Nome completo |
| `email` | string | Sim | E-mail para login |
| `perfil` | string | Sim | Um de: `super_admin`, `adm`, `gestor`, `vendas`, `fornecedor_ebst`, `fornecedor_hobart` |
| `fornecedor` | string | Não | Fornecedor (se fornecedor_*) |
| `ativo` | boolean | Sim | Se usuário pode fazer login |
| `criadoEm` | timestamp | Sim | Data de criação |
| `criadoPor` | string | Sim | UID de quem criou |
| `migradoEm` | timestamp | Não | Data de migração de documento |

---

## 📋 Coleção: `solicitacoes/`

**Propósito:** Armazenar solicitações de máquinas e seu andamento.

### Documento: `{docId}`

```javascript
{
  // ── Identificação ──
  protocolo: "WR-2026-0001",          // Protocolo único por ano
  docId: "uuid-gerado",               // ID do documento
  status: "gestor",                   // Etapa atual: solicitacao|gestor|adm|fornecedor|logistica|instalacao|relatorio
  tipo: "aprovar",                    // Tipo: aprovar|reprovar|ajuste

  // ── Datas ──
  dataCriacao: Timestamp(2026-03-23),
  dataUltimaAtualizacao: Timestamp(2026-03-23),

  // ── Vendedor/Solicitante ──
  vendedorUid: "uid-vendedor",
  vendedorNome: "João Silva",
  vendedorEmail: "joao@empresa.com",

  // ── Dados da Solicitação ──
  dadosVendas: {
    cliente: "Lavanderia XYZ",
    endereco: "Rua A, 123",
    cidade: "São Paulo",
    cnpj: "12.345.678/0001-90",
    contatoNome: "Maria",
    contatoTelefone: "(11) 9999-9999",
    modelo: "Modelo A"
  },

  // ── Dados Administrativos ──
  dadosAdm: {
    fornecedor: "EBST",                 // EBST ou Hobart Brasil
    statusInstalacao: "agendado",       // agendado|concluido
    dataInstalacao: Timestamp(2026-04-01),
    responsavelInstalacao: "Carlos"
  },

  // ── Documentos Anexados ──
  documentos: {
    relatarioInicial: {
      nome: "relatorio_inicial.pdf",
      url: "gs://..../relatorio_inicial.pdf",
      anexadoPor: "uid-vendedor",
      anexadoEm: Timestamp(2026-03-23)
    },
    checklistInstalacao: {
      nome: "checklist.pdf",
      url: "gs://..../checklist.pdf",
      anexadoPor: "uid-gestor",
      anexadoEm: Timestamp(2026-03-24)
    },
    notaFiscal: {
      nome: "nf.pdf",
      url: "gs://..../nf.pdf",
      anexadoPor: "uid-fornecedor",
      anexadoEm: Timestamp(2026-03-25)
    },
    relatorioFinal: {
      nome: "relatorio_final.pdf",
      url: "gs://..../relatorio_final.pdf",
      anexadoPor: "uid-instalador",
      anexadoEm: Timestamp(2026-03-26)
    }
  },

  // ── Histórico ──
  historico: [
    {
      etapa: "solicitacao",
      acao: "criado",
      responsavel: "João Silva",
      responsavelUid: "uid-vendedor",
      data: Timestamp(2026-03-23),
      observacoes: "Solicitação inicial"
    },
    {
      etapa: "gestor",
      acao: "aprovado",
      responsavel: "Carlos",
      responsavelUid: "uid-gestor",
      data: Timestamp(2026-03-24),
      observacoes: "Checklist anexado"
    }
  ]
}
```

### Campos Principais

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `protocolo` | string | Formato: WR-YYYY-NNNN (ano + sequencial) |
| `status` | string | Etapa atual do fluxo |
| `tipo` | string | aprovar / reprovar / ajuste |
| `documentos` | object | Mapa de documentos anexados |
| `historico` | array | Log de movimentações |

---

## 📦 Coleção: `documentos/`

**Propósito:** Metadados dos arquivos (opcional, usada principalmente Storage).

### Documento: `{docId}`

```javascript
{
  solicitacaoId: "uuid-solicitacao",
  tipo: "relatorio_inicial",         // relatorio_inicial|checklist|nf|relatorio_final
  nome: "relatorio_inicial.pdf",
  tamanho: 2048576,
  url: "gs://bucket/path/file.pdf",
  uploadedAt: Timestamp(2026-03-23),
  uploadedBy: "uid-usuario"
}
```

---

## 🔢 Coleção: `contadores/`

**Propósito:** Manter sequenciais únicos por ano (para protocolo).

### Documento: `protocolos_2026`

```javascript
{
  ano: 2026,
  proximo: 2,      // Próximo número a usar
  total: 1         // Total de solicitações este ano
}
```

---

## 🏭 Coleção: `fornecedores/`

**Propósito:** Cadastro de fornecedores.

### Documento: `{docId}`

```javascript
{
  nome: "EBST",
  email: "contato@ebst.com",
  telefone: "(11) 3333-3333",
  endereco: "Rua B, 456",
  cidade: "São Paulo",
  ativo: true,
  dataCadastro: Timestamp(2026-03-23),
  usuariosAssociados: [
    "uid-fornecedor-1",
    "uid-fornecedor-2"
  ]
}
```

---

## 💾 Coleção: `modelos_maquinas/`

**Propósito:** Catálogo de modelos disponíveis.

### Documento: `{docId}`

```javascript
{
  nome: "Modelo A",
  descricao: "Máquina de grande capacidade",
  especificacoes: "220V, 500kg/h",
  ativo: true,
  dataCadastro: Timestamp(2026-03-23)
}
```

---

## 🔐 Firebase Storage

**Bucket:** `workrail-solenis.appspot.com`

### Estrutura de Pastas

```
gs://workrail-solenis.appspot.com/
├── solicitacoes/
│   └── {solicitacaoId}/
│       ├── relatorio_inicial/
│       ├── checklists/
│       ├── notas_fiscais/
│       └── relatorios_finais/
```

---

## 🔒 Firestore Rules (Resumo)

```javascript
service cloud.firestore {
  match /databases/{database}/documents {
    function isInterno() {
      return perfil() in ['super_admin','vendas','gestor','adm'];
    }

    match /usuarios/{uid} {
      allow read:  if request.auth.uid == uid || perfil() in ['adm','super_admin'];
      allow write: if perfil() in ['adm','super_admin'];
    }

    match /solicitacoes/{docId} {
      allow read, write: if request.auth != null && isInterno();
      allow read, update: if fornecedor() pode acessar suas solicitações;
      allow create, delete: if request.auth != null && isInterno();
    }
  }
}
```

[Detalhes completos de Rules →](../CONFIGURAR_FIREBASE.md)

---

## 📈 Índices Recomendados

Para melhor performance, crie os seguintes índices no Firestore:

| Coleção | Campos | Descrição |
|---------|--------|-----------|
| `solicitacoes` | status, dataCriacao | Filtrar por status e data |
| `solicitacoes` | vendedorUid, status | Ver solicitações do vendedor |
| `usuarios` | perfil, ativo | Listar usuários por perfil |

---

## 🔄 Transações Importantes

### Criação de Solicitação

```javascript
// 1. Lê contador do ano
// 2. Incrementa contador
// 3. Cria documento com protocolo
// 4. Escreve na coleção
```

### Transição de Etapa

```javascript
// 1. Lê solicitação
// 2. Valida documentos obrigatórios
// 3. Atualiza status
// 4. Adiciona ao histórico
```

---

## 💡 Boas Práticas

- **Sempre use UID como ID de usuário** — Garante unicidade
- **Manter histórico na solicitação** — Facilita rastreamento
- **Usar timestamps do servidor** — Evita diferenças de relógio
- **Índices para queries frequentes** — Melhora performance
- **Validar perfis nas Rules** — Segurança em banco de dados

---

## 🆘 Troubleshooting

### "Permission denied"
- Verifique Firestore Rules
- Confirme que usuário tem perfil válido
- Verifique `isInterno()` function

### "Document not found"
- Verifique se documento foi criado
- Confirme que ID está correto
- Procure por documento com query no email

---

**Última atualização: 2026-03-23**
