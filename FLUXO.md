# 🔄 Fluxo de Solicitação — Etapas e Transições

Documentação completa do fluxo de solicitação de máquinas.

---

## 📊 Visão Geral

```
VENDAS
  ↓ (Cria solicitação + Relatório Inicial)
GESTOR
  ↓ (Aprova/reprova + Checklist)
ADM de VENDAS
  ↓ (Revisa documentação)
FORNECEDOR
  ↓ (Prepara máquina + Nota Fiscal)
LOGÍSTICA & ENTREGA
  ↓ (Acompanha transporte)
INSTALAÇÃO
  ↓ (Instala máquina)
RELATÓRIO
  ↓ (Documenta conclusão)
FIM
```

---

## 1️⃣ Etapa: SOLICITAÇÃO (Vendas)

### 🎯 Objetivo
Criar nova solicitação de máquina com informações do cliente.

### 👤 Responsável
**Perfil:** Solicitante (vendas)
- Pode criar solicitação
- Pode visualizar suas próprias solicitações
- Pode acompanhar status

### 📝 Ações

```javascript
goScreen('screen-solicitacao')  // Abre tela de solicitação
```

**Campos Obrigatórios:**
- Cliente: Nome da lavanderia
- Endereço: Local da instalação
- Cidade: Localização
- CNPJ: Identificação da empresa
- Contato: Nome e telefone
- Modelo: Escolha do modelo de máquina

**Documentos Obrigatórios:**
- Relatório Inicial (PDF)

### ✅ Validação

```javascript
validateStep_Solicitacao() {
  // Verifica todos os campos
  // Verifica arquivo anexado
  // Gera protocolo único
  // Salva no Firestore
}
```

### 📤 Envio

```javascript
confirmarSolicitacao() {
  // 1. Valida
  // 2. Gera protocolo (Firestore transaction)
  // 3. Salva documentos (Storage)
  // 4. Cria registro em solicitacoes/
  // 5. Envia notificação (FormSubmit)
  // 6. Mostra modal de sucesso
}
```

### 📧 Notificação
```
Assunto: [WORKRAIL] Nova Solicitação — WR-2026-0001
Para: gestor@empresa.com
Corpo: "Nova solicitação criada por João Silva"
```

### ➡️ Próxima Etapa
**GESTOR**

---

## 2️⃣ Etapa: GESTOR (Avaliação)

### 🎯 Objetivo
Avaliar solicitação, aprovar ou solicitar ajustes.

### 👤 Responsável
**Perfil:** Gestor
- Vê todas as solicitações pendentes
- Pode aprovar ou reprovar
- Deve anexar checklist de instalação

### 📋 Ações Disponíveis

#### A) APROVAR
```javascript
confirmAprovar() {
  // 1. Valida relatório inicial
  // 2. Anexa checklist (OBRIGATÓRIO)
  // 3. Atualiza status → "adm"
  // 4. Adiciona ao histórico
  // 5. Envia notificação
}
```

**Documentos Obrigatórios:**
- Checklist de Instalação (PDF) ← **Novo**

**Status Resultante:** `adm`

#### B) REPROVAR
```javascript
confirmReprovar() {
  // 1. Solicita motivo (opcional)
  // 2. Retorna status → "solicitacao"
  // 3. Vendas pode ajustar e reenviar
  // 4. Envia notificação
}
```

**Status Resultante:** `solicitacao` (retorna ao início)

#### C) SOLICITAR AJUSTE
```javascript
confirmSolicitar() {
  // 1. Solicita descrição do ajuste
  // 2. Retorna status → "solicitacao"
  // 3. Vendas faz ajuste e resubmete
  // 4. Envia notificação específica
}
```

**Status Resultante:** `solicitacao` (retorna ao início)

### 📧 Notificações

**Se APROVADO:**
```
Assunto: [WORKRAIL] Solicitação Aprovada — WR-2026-0001
Para: adm@empresa.com
Corpo: "Solicitação de João Silva foi aprovada. Checklist anexado."
```

**Se REPROVADO:**
```
Assunto: [WORKRAIL] Solicitação Reprovada — WR-2026-0001
Para: joao@empresa.com
Corpo: "Sua solicitação foi reprovada. Motivo: [...]"
```

### ➡️ Próxima Etapa
**ADM de VENDAS** (se aprovado) ou **SOLICITAÇÃO** (se ajuste/reprovado)

---

## 3️⃣ Etapa: ADM DE VENDAS (Revisão)

### 🎯 Objetivo
Revisar documentação, validar consistência e encaminhar fornecedor.

### 👤 Responsável
**Perfil:** Administrativo (ADM de Vendas)
- Revê relatório e checklist
- Valida CNPJ e dados do cliente
- Encaminha para fornecedor correto
- Seleciona data/hora de instalação

### 📝 Ações

```javascript
confirmAprovar() {
  // 1. Valida documentos (relatório + checklist)
  // 2. Seleciona fornecedor
  // 3. Define data/hora instalação
  // 4. Atualiza status → "fornecedor"
  // 5. Envia notificação
}
```

**Informações para Preencher:**
- Fornecedor: EBST ou Hobart Brasil
- Data de Instalação: Agendada
- Responsável de Instalação: Técnico

**Status Resultante:** `fornecedor`

### 📧 Notificação
```
Assunto: [WORKRAIL] Solicitação Encaminhada — WR-2026-0001
Para: fornecedor@ebst.com
Corpo: "Nova solicitação aguardando sua ação. Cliente: Lavanderia XYZ"
```

### ➡️ Próxima Etapa
**FORNECEDOR**

---

## 4️⃣ Etapa: FORNECEDOR

### 🎯 Objetivo
Preparar máquina e anexar Nota Fiscal.

### 👤 Responsível
**Perfil:** Fornecedor (EBST ou Hobart)
- Vê apenas solicitações do seu fornecedor
- Prepara máquina
- Anexa Nota Fiscal

### 📝 Ações

```javascript
confirmarNF() {
  // 1. Valida Nota Fiscal (OBRIGATÓRIO)
  // 2. Atualiza status → "logistica"
  // 3. Adiciona ao histórico
  // 4. Envia notificação
}
```

**Documentos Obrigatórios:**
- Nota Fiscal (NF) - PDF

**Status Resultante:** `logistica`

### 📧 Notificação
```
Assunto: [WORKRAIL] NF Anexada — WR-2026-0001
Para: adm@empresa.com
Corpo: "Fornecedor EBST anexou NF. Máquina pronta para entrega."
```

### ➡️ Próxima Etapa
**LOGÍSTICA & ENTREGA**

---

## 5️⃣ Etapa: LOGÍSTICA & ENTREGA

### 🎯 Objetivo
Acompanhar transporte e preparar para instalação.

### 👤 Responsável
**Perfil:** ADM de Vendas
- Acompanha rastreamento
- Confirma recebimento
- Valida condição da máquina

### 📝 Ações

```javascript
confirmarEntrega() {
  // 1. Confirma recebimento
  // 2. Atualiza status → "instalacao"
  // 3. Prepara para próxima etapa
  // 4. Envia notificação
}
```

**Informações:**
- Data de Recebimento
- Condição da Máquina (OK/Dano)

**Status Resultante:** `instalacao`

### 📧 Notificação
```
Assunto: [WORKRAIL] Máquina Entregue — WR-2026-0001
Para: responsavel@instalacao.com
Corpo: "Máquina pronta para instalação em 2026-04-01"
```

### ➡️ Próxima Etapa
**INSTALAÇÃO**

---

## 6️⃣ Etapa: INSTALAÇÃO

### 🎯 Objetivo
Instalar máquina no local do cliente.

### 👤 Responsável
**Perfil:** ADM de Vendas / Técnico
- Realiza instalação
- Testa funcionamento
- Obtém assinatura de cliente

### 📝 Ações

```javascript
confirmarInstalacao() {
  // 1. Valida relatório final (OBRIGATÓRIO)
  // 2. Atualiza status → "relatorio"
  // 3. Marca como pronto para conclusão
  // 4. Envia notificação
}
```

**Documentos Obrigatórios:**
- Relatório Final de Instalação (PDF) ← **Obrigatório**

**Conteúdo do Relatório:**
- Teste de funcionamento
- Consumo de energia
- Tempo de ciclo
- Observações
- Assinatura do cliente

**Status Resultante:** `relatorio`

### 📧 Notificação
```
Assunto: [WORKRAIL] Instalação Concluída — WR-2026-0001
Para: adm@empresa.com
Corpo: "Máquina instalada em Lavanderia XYZ. Aguardando validação."
```

### ➡️ Próxima Etapa
**RELATÓRIO**

---

## 7️⃣ Etapa: RELATÓRIO (Conclusão)

### 🎯 Objetivo
Validar conclusão e encerrar solicitação.

### 👤 Responsável
**Perfil:** ADM de Vendas
- Revê relatório final
- Valida instalação
- Encerra solicitação

### 📝 Ações

```javascript
finalizarSolicitacao() {
  // 1. Valida relatório final
  // 2. Atualiza status → "concluido"
  // 3. Registra data de conclusão
  // 4. Gera resumo para arquivo
  // 5. Envia notificação
}
```

**Status Resultante:** `concluido`

### 📊 Resumo Final

```javascript
{
  protocolo: "WR-2026-0001",
  cliente: "Lavanderia XYZ",
  status: "concluido",
  dataCriacao: "2026-03-23",
  dataInstalacao: "2026-04-01",
  dataConclusao: "2026-04-05",
  modelo: "Modelo A",
  fornecedor: "EBST",
  tempoTotal: "13 dias"
}
```

### 📧 Notificação Final
```
Assunto: [WORKRAIL] Solicitação Concluída — WR-2026-0001
Para: joao@empresa.com, adm@empresa.com
Corpo: "Solicitação finalizada com sucesso. Cliente: Lavanderia XYZ"
```

### 🎯 FIM DO FLUXO

---

## ⚡ Fluxos Alternativos

### Reprovação/Ajuste do Gestor

```
SOLICITAÇÃO → GESTOR (Reprova/Ajuste) → SOLICITAÇÃO
```

Vendas pode:
- Revisar dados
- Corrigir documentação
- Reenviar ao Gestor

---

## 📊 Matriz de Responsabilidades

| Etapa | Responsável | Ação Principal | Documento |
|-------|-------------|----------------|-----------|
| 1 | Vendas | Criar | Relatório Inicial |
| 2 | Gestor | Avaliar | Checklist |
| 3 | ADM Vendas | Revisar | (nenhum novo) |
| 4 | Fornecedor | Preparar | Nota Fiscal |
| 5 | ADM Vendas | Acompanhar | (rastreamento) |
| 6 | Técnico | Instalar | Relatório Final |
| 7 | ADM Vendas | Validar | (nenhum novo) |

---

## 🔒 Validações por Etapa

| Etapa | Validações |
|-------|-----------|
| **Solicitação** | Campos obrigatórios, relatório anexado |
| **Gestor** | Checklist obrigatório |
| **ADM** | Documentação completa |
| **Fornecedor** | Nota Fiscal obrigatória |
| **Entrega** | Confirmação de recebimento |
| **Instalação** | Relatório final obrigatório |
| **Relatório** | Validação final |

---

## 🐛 Situações Especiais

### Máquina Danificada na Entrega
```
Etapa ENTREGA → Documentar dano → Retornar ao FORNECEDOR
```

### Atraso na Instalação
```
Contato com cliente → Reagendar data → Atualizar no sistema
```

### Documento Faltando
```
Etapa bloqueada → Solicitar documento → Validar quando receber
```

---

**Última atualização: 2026-03-23**
