# 📜 Changelog — WORKRAIL

Todas as mudanças significativas do projeto estão documentadas neste arquivo.

---

## [3.1.0] — 2026-03-23

### 🔧 Correções Críticas

- **[CRITICAL]** Corrigido bug onde usuários `super_admin` entravam como `vendas`
  - Root cause: Função `carregarPerfilUsuario()` tinha `catch()` genérico que forçava perfil para `vendas`
  - Solução: Removido fallback automático, adicionado logging detalhado
  - [Detalhes →](./docs/technical/analise_super_admin_fix.md)

### ✨ Melhorias

- Logging detalhado em `carregarPerfilUsuario()` para diagnóstico
- Validação de perfis contra lista de perfis válidos
- Migração de documentos agora é não-bloqueante
- Tratamento de erros específico por tipo (permission-denied, unavailable, etc.)
- Firestore Rules documentação atualizada

### 🧹 Organização

- Reestruturação de pasta para GitHub
- Criação de `/docs` com documentação técnica
- Remoção de arquivos temporários
- Criação de README.md e CHANGELOG.md

---

## [3.0.0] — 2026-03-20

### 🚀 Lançamento Completo

Sistema totalmente revisado com:

- Autenticação segura via Firebase
- Firestore como banco de dados principal
- Storage para documentos
- Fluxo de 7 etapas funcional
- Notificações por email (FormSubmit)
- Painel Admin completo
- Suporte a múltiplos fornecedores

### ✨ Novas Funcionalidades

- Criação de usuários via admin panel (usando app secundário Firebase)
- Protocolo sequencial por ano (via Firestore transactions)
- Validação de documentos obrigatórios por etapa
- Histórico de movimentações com rastreabilidade completa
- Dashboard com métricas
- Filtro de solicitações por status

### 🔐 Segurança

- Firestore Rules com controle de acesso por perfil
- Validação de entrada em formulários
- Proteção contra login automático como `vendas`
- Transações Firestore para integridade de dados

### 📚 Documentação

- CONFIGURAR_FIREBASE.md
- INSTRUCOES_CRIACAO_ADMIN.txt
- Comentários inline no código

---

## [2.5.0] — 2026-03-15

### 🔧 Correções

- Corrigido storageBucket: `firebasestorage.app` → `appspot.com`
- Validação de checklist obrigatório na etapa de Gestor
- Histórico vazio mostra mensagem apropriada
- FormSubmit guard não bloqueia email de admin configurado

### ✨ Melhorias

- Protocolo dinâmico no modal de sucesso
- Melhor feedback visual nos uploads
- Logs mais informativos no console

---

## [2.0.0] — 2026-03-10

### 🎨 Interface Completa

- Telas de todas as 7 etapas do fluxo
- Sidebar com navegação por perfil
- Menu Admin funcional
- Dashboard com métricas
- Histórico de solicitações
- Modal de detalhes

### 🔄 Fluxo de Solicitação

1. **Solicitação** — Vendedor cria solicitação
2. **Gestor** — Avalia e aprova/reprova
3. **ADM Vendas** — Revisa e encaminha fornecedor
4. **Fornecedor** — Prepara e anexa NF
5. **Entrega** — Acompanha logística
6. **Instalação** — Instala máquina
7. **Relatório** — Documenta conclusão

---

## [1.5.0] — 2026-03-05

### 🔐 Autenticação

- Firebase Auth integrado
- Perfil carregado do Firestore
- Logout funcional
- Proteção de telas (login overlay)

### 💾 Persistência

- Firestore como banco de dados
- Firebase Storage para documentos
- Sincronização automática

---

## [1.0.0] — 2026-03-01

### 🚀 MVP Inicial

- Estrutura HTML básica
- Estilos e tema visual
- Login com email/senha
- Páginas de demo

---

## 📝 Formato

As mudanças estão organizadas por:

- **Seção**: Tipo de mudança (🚀 Feature, 🔧 Fix, ✨ Improvement, 🐛 Bug, 📚 Docs, etc.)
- **Descrição**: O que foi alterado
- **Impacto**: Como afeta os usuários

---

## 🔮 Próximas Versões

### v3.2 (Planejada)

- [ ] Padronização de nomes de perfis
- [ ] Relatórios analíticos avançados
- [ ] Agendamento de instalações

### v4.0 (Futuro)

- [ ] API REST para integrações
- [ ] Aplicativo mobile
- [ ] Dark mode
- [ ] Multi-idioma

---

## 🙏 Contribuidores

- **Welington Tavares** — Desenvolvimento, testes, documentação

---

**Última atualização: 2026-03-23**
