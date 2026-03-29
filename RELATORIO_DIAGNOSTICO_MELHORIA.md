# WORKRAIL — Relatório de Diagnóstico e Melhoria
> **Data da análise:** 2026-03-28
> **Escopo:** Arquivos locais da pasta `workrail-repo`
> **Classificação:** [FATO] evidenciado | [INFERÊNCIA] derivado | [SUGESTÃO] melhoria | [HIPÓTESE] depende de validação externa

---

## 1. RESUMO EXECUTIVO

A análise dos arquivos locais do projeto WORKRAIL revela **um problema crítico bloqueante**: o arquivo `workrail_v2.html` nunca consome o endpoint `/api/config` (que existe e está funcional em `functions/index.js`). Em vez disso, usa um objeto `FIREBASE_CONFIG` com `apiKey: "SUA_API_KEY_AQUI"` hardcoded. Ao detectar esse placeholder, o sistema executa `mostrarAppSemLogin('super_admin')`, concedendo acesso total sem autenticação — tornando toda a infraestrutura de segurança (Firestore Rules, Custom Claims, Cloud Functions) inoperante em produção real. Paralelamente, há divergência crítica de modelo de dados: as regras Firestore embutidas no HTML (legadas) usam coleção `usuarios` com perfil lido do banco, enquanto o arquivo `firestore.rules` real usa coleção `users` com Custom Claims no token de autenticação. A versão do sistema é inconsistente (v2.2 no HTML vs v2.3 no restante). O arquivo `functions/package-lock.json` não existe, o que fará o CI/CD falhar na primeira execução. O arquivo `firebaseProxy.js` (versão legada da Cloud Function com rate limiting em memória) permanece na raiz sem marcação clara de obsolescência. Os ganhos esperados com as correções são: sistema de autenticação real funcionando, pipeline CI/CD operacional desde o primeiro push, e eliminação do bypass de autorização.

---

## 2. DIAGNÓSTICO POR ARQUIVO

### 2.1 `workrail_v2.html` (246KB / 4.452 linhas)

**Objetivo:** SPA monolítica — toda a interface, lógica de negócio, autenticação e integração Firebase em um único arquivo HTML.

**Problemas encontrados:**

**[FATO CRÍTICO]** O objeto `FIREBASE_CONFIG` (linha 1935) contém `apiKey: "SUA_API_KEY_AQUI"`. A função `initFirebase()` (linha 2015) usa esse objeto diretamente — nunca chama `/api/config`. A Cloud Function `getFirebaseConfig` não é consumida pelo frontend em nenhum ponto do arquivo.

**[FATO CRÍTICO]** `mostrarAppSemLogin('super_admin')` é chamado em 3 cenários: SDK Firebase não carregado, apiKey === placeholder, ou exceção no `initFirebase()`. Nos três casos, o usuário acessa o sistema com perfil `super_admin` sem qualquer credencial. Isso torna toda a camada de segurança (Firestore Rules, Custom Claims, autenticação real) inativa quando a config não está preenchida.

**[FATO]** O `<title>` diz `WORKRAIL v2.2` (linha 6). A interface, o comentário `// WORKRAIL v2.2.0` (linha 1885), e o painel de configurações (linha 1389) também exibem v2.2. O restante do projeto (deploy.ps1, functions/package.json, README) é v2.3.

**[FATO]** A meta tag na linha 11 define `X-Frame-Options: DENY`. O `firebase.json` define o mesmo cabeçalho como `SAMEORIGIN` via HTTP headers. Em navegadores, meta http-equiv para `X-Frame-Options` é ignorada — apenas o cabeçalho HTTP tem efeito. Portanto não há conflito real, mas a meta tag gera ruído e desorientação documental.

**[FATO]** O arquivo contém, a partir da linha 4383, um bloco de comentário `/* ... */` dentro de `<script>` com regras Firestore inteiras e instruções de configuração manual. Essas regras são a versão ANTERIOR do modelo — usam coleção `usuarios` (com s), leem o perfil via `get()` no Firestore, e não usam Custom Claims. O `firestore.rules` real usa coleção `users` e Custom Claims do token.

**[FATO]** Firebase SDK compat versão 9.23.0 (linhas 726–729) carregada de `gstatic.com` sem atributos `integrity` (SRI). A versão atual do Firebase SDK é 11.x; a versão compat 9.23.0 inclui bundle completo não otimizado.

**[FATO]** `AuthRateLimiter` (linha 2073) usa `sessionStorage` para controle de tentativas de login — correto para limitar por sessão de browser, mas não persiste entre abas nem protege contra bots que não mantêm storage.

**[FATO]** `localStorage` é usado para persistir e-mail de notificação do FormSubmit (linha 3955). Dado menor, mas deve ser documentado.

**[INFERÊNCIA]** O arquivo usa `firebase.firestore()` (compat API) que aponta para coleção `solicitacoes` (inferido pela lógica do fluxo), mas as regras embutidas no HTML protegem `solicitacoes`. Se o `firestore.rules` real (que também protege `solicitacoes`) for deployado, as queries do HTML devem funcionar — mas os campos esperados (ex: `statusAtual` nas rules reais vs campos usados no HTML) precisam de verificação cruzada.

**Impacto:** Sistema inoperante como aplicação segura real. Acesso livre como super_admin quando apiKey não configurada.

**Melhoria proposta:**
- Implementar função `fetchAndInitFirebase()` que chama `POST /api/config`, recebe a configuração e inicializa o Firebase
- Remover `mostrarAppSemLogin()` ou restringi-la ao modo de desenvolvimento explícito
- Atualizar versão para v2.3 em todos os pontos do HTML
- Remover o bloco de regras Firestore legadas do comentário dentro do `<script>` (usar referência para `firestore.rules`)
- Remover a meta tag `X-Frame-Options` (não tem efeito em browsers modernos)
- Adicionar atributo `integrity` (SRI) nas tags `<script>` do Firebase SDK

---

### 2.2 `firebase.json`

**Objetivo:** Configuração central do Firebase CLI — define hosting, functions, firestore e cabeçalhos de segurança.

**Problemas encontrados:**

**[FATO]** Estrutura completa e correta: seções `hosting`, `functions`, `firestore` presentes. Rewrites para `/api/config` e `/api/health` corretamente definidos antes do catch-all SPA.

**[FATO]** CSP (Content-Security-Policy) na linha 62 permite `'unsafe-inline'` tanto para `script-src` quanto para `style-src`. O HTML usa estilos e scripts inline extensivamente, então remover `unsafe-inline` exigiria refatoração significativa do arquivo HTML.

**[FATO]** Cache de assets `.js` e `.css` definido como `max-age=3600` (1 hora). Como o projeto usa arquivos sem hash no nome (ex: CDNs do gstatic), isso é adequado, mas poderia ser aumentado para assets estáticos com controle de versão.

**[FATO]** `firebaseProxy.js` está na lista `ignore` do hosting (linha 13), correto — evita que o arquivo legado seja servido publicamente.

**[SUGESTÃO]** Adicionar `"frameworksBackend": { "region": "us-central1" }` para consistência explícita de região (atualmente herdada das functions).

**Impacto:** Configuração operacional e segura dentro dos arquivos. Não bloqueia deploy.

**Melhoria proposta:** Nenhuma alteração estrutural necessária. Refinamento opcional: restringir CSP removendo `unsafe-inline` após refatorar o HTML.

---

### 2.3 `firestore.indexes.json`

**Objetivo:** Definir indexes compostos do Firestore para suportar queries ordenadas.

**Problemas encontrados:**

**[FATO]** Index para coleção `requestLog` com campo `timestamp` ASCENDING. A coleção `requestLog` não é referenciada em `firestore.rules` nem em `functions/index.js`. [INFERÊNCIA] Pode ser coleção legada do projeto anterior.

**[FATO]** Index para coleção `workrail` com `createdBy` + `createdAt`. A coleção `workrail` também não aparece em `firestore.rules` (que usa `solicitacoes`). [INFERÊNCIA] Possível nome legado.

**[SUGESTÃO]** Adicionar index para `_rateLimit` com campo `lastSeen` ASCENDING — necessário para a query de cleanup em `functions/index.js` (linha 268: `.where('lastSeen', '<', rateLimitCutoff)`). Sem esse index, a query funciona mas pode gerar alerta no Firestore.

**[SUGESTÃO]** Adicionar index para `solicitacoes` com `createdBy` + `createdAt` (nomes reais usados nas rules) para suportar listagem filtrada por usuário.

**Impacto:** Indexes possivelmente obsoletos. Queries de cleanup podem ser lentas sem o index de `_rateLimit`.

**Melhoria proposta:** Atualizar coleções para nomes reais (`solicitacoes` ao invés de `workrail`; remover `requestLog` se não usada), adicionar index para `_rateLimit.lastSeen`.

---

### 2.4 `firestore.rules`

**Objetivo:** Regras de segurança do Firestore — controle de acesso baseado em roles via Custom Claims.

**Problemas encontrados:**

**[FATO]** Estrutura robusta: bloqueio padrão (`allow read, write: if false` no catch-all), imutabilidade de subcoleções, validação de dados no servidor.

**[FATO]** `allow read: if isAuthenticated()` na coleção `solicitacoes` (linha 172) permite que qualquer usuário autenticado leia todas as solicitações, independente do perfil. Fornecedor EBST pode ler solicitações do Hobart e vice-versa.

**[FATO]** A função `isAllowedTransition` (linha 113) não cobre a transição `encaminhada_fornecedor → aguardando_nf` para o papel `adm`, apenas para fornecedores. [INFERÊNCIA] Pode ser intencional (adm não deve poder agir como fornecedor), mas merece documentação explícita.

**[FATO]** Coleção `requestLog` não tem regra definida — cai no bloqueio padrão. Se o HTML ou algum código tentar escrever nessa coleção, falhará silenciosamente para o cliente.

**[SUGESTÃO]** Adicionar segmentação de leitura de `solicitacoes` por perfil: fornecedores deveriam ler apenas solicitações do seu próprio fornecedor.

**Impacto:** Segurança razoável, mas fornecedores têm acesso de leitura mais amplo que o necessário.

**Melhoria proposta:** Restringir `allow read` em `solicitacoes` por role; documentar explicitamente as transições não cobertas.

---

### 2.5 `.firebaserc`

**Objetivo:** Mapear alias de projeto Firebase para nome real (`workrail-solenis`).

**Problemas:** Nenhum. Arquivo mínimo e correto.

---

### 2.6 `.gitignore`

**Objetivo:** Evitar commit acidental de credenciais, node_modules, arquivos legados e temporários.

**Problemas encontrados:**

**[FATO]** Cobertura ampla e bem categorizada (Firebase, Cloud Functions, Node.js, OS, editores, legados).

**[INFERÊNCIA]** A seção "Arquivos legados do projeto" (linha 53) com padrões como `RESUMO*`, `AVALIACAO*`, `RELATORIO*`, `analise*` sugere que documentos internos de análise foram criados anteriormente e agora devem ser ignorados. O arquivo `RELATORIO_DIAGNOSTICO_MELHORIA.md` que este relatório gera pode precisar ser adicionado ao gitignore caso não deva ir para o repositório.

**[SUGESTÃO]** Adicionar `*.local` e `functions/.runtimeconfig.json` (arquivo legado de config de functions Gen 1) à lista de ignorados.

**Impacto:** Nenhum bloqueante. Boa prática já aplicada.

---

### 2.7 `deploy.ps1`

**Objetivo:** Script PowerShell para deploy seletivo ou completo no Firebase (Windows).

**Problemas encontrados:**

**[FATO]** Header e função `Write-Header` dizem `WORKRAIL v2.3` — consistente com functions/package.json. O HTML diz v2.2 — a inconsistência está no HTML, não neste script.

**[FATO]** Usa `npm install` (linha 113) ao invés de `npm ci`. O `npm ci` é mais adequado para ambientes de deploy pois usa exatamente as versões do `package-lock.json`.

**[FATO]** `Check-GitStatus` (linha 94) usa `git status --porcelain` para detectar mudanças não commitadas. Correto, mas só emite aviso — não bloqueia por padrão.

**[SUGESTÃO]** O script não verifica se `functions/package-lock.json` existe antes de rodar `npm install`. Se o arquivo não existir, `npm ci` falharia; `npm install` criaria o lock file novo (comportamento diferente do CI).

**[SUGESTÃO]** Adicionar verificação de versão do Node.js (mínimo 18) como parte de `Check-Prerequisites`.

**Impacto:** Script funcional para uso manual. Sem bloqueantes.

**Melhoria proposta:** Substituir `npm install` por `npm ci` (após garantir que `package-lock.json` existe); adicionar verificação de versão mínima do Node.js.

---

### 2.8 `push_to_github.sh`

**[FATO]** Arquivo listado nos requisitos do projeto mas **não existe** na pasta `workrail-repo`. Não foi encontrado em nenhum subdiretório.

**Impacto:** Documentação ou instrução que referencia este arquivo está incorreta.

**Melhoria proposta:** Criar o arquivo com operações básicas de push Git, ou remover referência dos documentos que o mencionam.

---

### 2.9 `DEPLOY_SUMMARY.md`

**Objetivo:** Referência rápida de comandos de deploy, arquitetura e URLs do projeto.

**Problemas encontrados:**

**[FATO]** Bem estruturado. Cobre deploy via script PowerShell, CLI Linux/macOS e gcloud direto.

**[FATO]** Linha 161 referencia URL do GitHub Actions — [HIPÓTESE] repositório pode não ser público ou o link pode estar incorreto (não verificável sem acesso externo).

**[SUGESTÃO]** Adicionar nota sobre necessidade de `package-lock.json` em `functions/` antes do primeiro deploy CI.

**Impacto:** Documento útil. Sem bloqueantes.

---

### 2.10 `TODO_REVIEW_FIREBASE_GITHUB.md`

**Objetivo:** Registro de auditoria e mudanças aplicadas em 2026-03-28.

**Problemas encontrados:**

**[FATO]** Documento histórico que lista "mudanças aplicadas" — inclui criação de `functions/index.js`, `functions/package.json`, `.firebaserc`, etc. Esses arquivos de fato existem na pasta.

**[FATO]** O documento diz que `deploy.ps1` foi "atualizado: Versão bumped para v2.3" — mas o HTML ainda está em v2.2. Isso confirma que a atualização de versão no HTML ficou pendente.

**[FATO]** Item 5 da lista de pendências Firebase: "Fazer deploy das Firestore Rules via `firebase deploy --only firestore`" — indica que as regras ainda não foram deployadas. [HIPÓTESE] Status real depende de acesso ao console Firebase.

**Impacto:** Documento de rastreamento válido. Útil para identificar o que foi feito vs o que ainda está pendente.

---

### 2.11 `GITHUB_SETUP.md`

**Objetivo:** Guia de configuração de secrets, permissões, branches e CI/CD no GitHub.

**Problemas encontrados:**

**[FATO]** Documento bem detalhado. Cobre os 5 secrets necessários, permissões GCP, proteção de branch e Environments.

**[INFERÊNCIA]** Usa `FIREBASE_TOKEN` (gerado via `firebase login:ci`) para autenticação no CI. Esse método é funcional mas legado — o recomendado pelo Firebase atualmente é Workload Identity Federation com OIDC, que não requer token de longa duração.

**[SUGESTÃO]** Adicionar instrução sobre expiração do `FIREBASE_TOKEN` (tokens CI não expiram automaticamente mas podem ser revogados). Indicar periodicidade de rotação.

**Impacto:** Guia suficiente para configuração manual. Sem bloqueantes de documentação.

---

### 2.12 `FIREBASE_MANUAL_CHECKLIST.md`

**Objetivo:** Checklist de pendências manuais no Firebase Console e GCP que não podem ser automatizadas.

**Problemas encontrados:**

**[FATO]** Tabela na seção 9 ("Valores que precisam ser preenchidos") lista `messagingSenderId` e `appId` ainda como `CONFIGURE_NO_ENV` no `functions/index.js`. Confirmado no arquivo — os valores vêm de `process.env.FIREBASE_MESSAGING_SENDER_ID || 'CONFIGURE_NO_ENV'`.

**[FATO]** Checklist está com todos os itens desmarcados ([ ]) — nenhuma pendência foi concluída até o momento da análise.

**Impacto:** Documento rastreia corretamente as pendências reais.

---

### 2.13 `functions/index.js`

**Objetivo:** Cloud Functions Gen 2 — endpoint de config, health check e limpeza periódica.

**Problemas encontrados:**

**[FATO]** Rate limiting implementado via Firestore (persistente entre instâncias e cold starts). Correto.

**[FATO]** `getFirebaseConfig` aceita apenas POST — [INFERÊNCIA] convenção REST sugeriria GET para leitura de configuração. POST foi escolhido possivelmente para evitar cache agressivo de proxies. Funciona, mas não é idiomático.

**[FATO]** `health` function escreve no Firestore (`_health/ping`) a cada chamada. Uma chamada de health check frequente (ex: uptime monitor a cada 1 minuto) geraria 1.440 escritas/dia, acumulando documentos até o `cleanupRequestLog` rodar.

**[SUGESTÃO]** `cleanupRequestLog` apaga apenas até 500 documentos de `_rateLimit` por execução (limite do batch). Em pico de tráfego com muitos IPs, pode não acompanhar o crescimento.

**[SUGESTÃO]** CORS permite `http://localhost:3000` (linha 50), mas o emulador Firebase usa porta 5000. Dependendo do fluxo de desenvolvimento, `:3000` pode ser desnecessário.

**Impacto:** Funcional, mas acumula escritas Firestore no health check. Sem bloqueante de deploy.

---

### 2.14 `functions/package.json`

**Objetivo:** Declarar dependências e scripts das Cloud Functions.

**Problemas encontrados:**

**[FATO]** Declara `engines: { "node": "18" }` — consistente com `firebase.json`.

**[FATO]** `firebase-functions` na versão `^4.9.0` é a última versão estável da série 4.x para Gen 2. Adequado.

**[FATO CRÍTICO]** Não existe `package-lock.json` em `functions/`. O workflow `deploy.yml` usa `npm ci` (linha 49) com `cache-dependency-path: functions/package-lock.json`. Sem o lock file, o CI falhará imediatamente com erro `npm ci can only install packages when package.json and package-lock.json are in sync`.

**Impacto:** CI/CD bloqueado na primeira execução.

**Melhoria proposta:** Executar `cd functions && npm install` localmente para gerar `package-lock.json` e commitar o arquivo.

---

### 2.15 `firebaseProxy.js` (raiz do projeto)

**Objetivo:** Versão anterior (legada) da Cloud Function, antes da migração para `functions/index.js`.

**Problemas encontrados:**

**[FATO]** Rate limiting em memória via `requestLog = new Map()` — não persiste entre cold starts, não funciona com múltiplas instâncias.

**[FATO]** `messagingSenderId: "000000000000"` e `appId: "1:000000000000:web:..."` hardcoded como placeholders reais (não env vars).

**[FATO]** `cleanupRequestLog` limpa apenas o Map em memória, não o Firestore.

**[FATO]** Está listado em `firebase.json` `ignore` — não será deployado nem servido pelo Hosting.

**[FATO]** Referencia `--runtime nodejs22` nas instruções, enquanto `firebase.json` e `functions/package.json` especificam `nodejs18`.

**Impacto:** Arquivo sem efeito no deploy atual. Gera confusão sobre qual versão é a ativa.

**Melhoria proposta:** Deletar o arquivo ou mover para pasta `_legado/` com README explicativo. Não deve existir na raiz do projeto ativo.

---

### 2.16 `.github/workflows/deploy.yml`

**Objetivo:** Pipeline CI/CD — validação + deploy automático no Firebase via GitHub Actions.

**Problemas encontrados:**

**[FATO]** `cache-dependency-path: functions/package-lock.json` — falhará se o arquivo não existir (ver item 2.14).

**[FATO]** Job `preview` (linha 185) não tem `needs: validate` — pode rodar em PR sem passar pela validação prévia.

**[FATO]** Health check pós-deploy (linha 168) aceita HTTP 503 como válido: `if [ "$HTTP_STATUS" != "200" ] && [ "$HTTP_STATUS" != "503" ]`. Isso significa que um Firestore degradado passa no check de deploy. [INFERÊNCIA] Pode ser intencional para não bloquear deploy quando Firestore estiver lento.

**[SUGESTÃO]** Usar Workload Identity Federation (OIDC) ao invés de `FIREBASE_TOKEN` para autenticação mais segura e sem token de longa duração.

**[SUGESTÃO]** Adicionar `needs: validate` no job `preview`.

**Impacto:** Pipeline funcional condicionado à existência de `package-lock.json`.

---

## 3. PLANO DE MELHORIA PRIORIZADO

### Prioridade Alta (bloqueantes para funcionar em produção)

**A1 — Integrar HTML com /api/config**
- Ação: Implementar função `fetchAndInitFirebase()` no `workrail_v2.html` que chama `POST /api/config`, recebe a configuração e inicializa o Firebase com os dados reais
- Arquivos afetados: `workrail_v2.html`
- Resultado esperado: Sistema usa API key real via Cloud Function; nenhum placeholder no código-fonte
- Critério de verificação: Remover `"SUA_API_KEY_AQUI"` do HTML; `grep -n "SUA_API_KEY" workrail_v2.html` retorna vazio

**A2 — Eliminar bypass de autenticação**
- Ação: Remover ou desabilitar `mostrarAppSemLogin()` em produção; substituir por mensagem de erro adequada quando Firebase não inicializar
- Arquivos afetados: `workrail_v2.html`
- Resultado esperado: Usuário não consegue acessar o sistema sem credenciais válidas, independente do estado da configuração
- Critério de verificação: Teste com apiKey inválida → tela de erro, não acesso como super_admin

**A3 — Gerar e commitar package-lock.json**
- Ação: Executar `cd functions && npm install` para gerar `functions/package-lock.json` e commitar o arquivo
- Arquivos afetados: `functions/package-lock.json` (a criar)
- Resultado esperado: `npm ci` no GitHub Actions executa sem erro
- Critério de verificação: Primeira execução do workflow `validate` conclui com sucesso

**A4 — Atualizar variáveis de ambiente das Cloud Functions**
- Ação: Configurar `FIREBASE_API_KEY`, `FIREBASE_MESSAGING_SENDER_ID` e `FIREBASE_APP_ID` no ambiente das Cloud Functions (Secret Manager ou `--set-env-vars`)
- Arquivos afetados: `functions/index.js` (referencia as envs); `FIREBASE_MANUAL_CHECKLIST.md` (marcar como concluído)
- Resultado esperado: `POST /api/config` retorna JSON com valores reais, não `CONFIGURE_NO_ENV`
- Critério de verificação: `curl -X POST -H "Content-Type: application/json" -d '{}' https://workrail-solenis.web.app/api/config | grep -v CONFIGURE`

---

### Prioridade Média (impactam qualidade e manutenção)

**M1 — Sincronizar versão para v2.3 no HTML**
- Ação: Atualizar `<title>`, comentário `// WORKRAIL v2.2.0`, `<span>AS&TS v2.2</span>`, `.home-version`, e painel de configurações
- Arquivos afetados: `workrail_v2.html` (5 pontos)
- Resultado esperado: Versão única e consistente em todos os artefatos
- Critério de verificação: `grep -n "v2\.2" workrail_v2.html` retorna apenas resultados em comentários históricos

**M2 — Remover bloco de regras Firestore legadas do HTML**
- Ação: Remover o bloco de comentário com regras `/* FIRESTORE SECURITY RULES ... */` (linhas 4383–4451) do `workrail_v2.html`; substituir por referência: `/* Ver firestore.rules no repositório */`
- Arquivos afetados: `workrail_v2.html`
- Resultado esperado: Elimina confusão entre regras antigas (coleção `usuarios`) e regras reais (`users` com Custom Claims)
- Critério de verificação: HTML não contém `rules_version = '2'`

**M3 — Deletar ou arquivar firebaseProxy.js**
- Ação: Remover `firebaseProxy.js` da raiz; se desejado histórico, criar `_legado/firebaseProxy.js.bak`
- Arquivos afetados: `firebaseProxy.js`; atualizar `.gitignore` se necessário
- Resultado esperado: Raiz do projeto sem arquivo legado ativo; sem confusão sobre qual função está deployada
- Critério de verificação: `ls *.js` na raiz retorna vazio

**M4 — Corrigir indexes do Firestore**
- Ação: Atualizar `firestore.indexes.json` — remover `requestLog` e `workrail` (se coleções legadas); adicionar index para `_rateLimit.lastSeen ASCENDING` e `solicitacoes.(createdBy + createdAt)`
- Arquivos afetados: `firestore.indexes.json`
- Resultado esperado: Indexes refletem as coleções reais do sistema
- Critério de verificação: Deploy de `firebase deploy --only firestore` sem warnings de index

**M5 — Adicionar needs: validate no job preview**
- Ação: Adicionar `needs: validate` no job `preview` do `deploy.yml`
- Arquivos afetados: `.github/workflows/deploy.yml`
- Resultado esperado: Preview channels não são criados em PRs com código inválido
- Critério de verificação: PR com arquivo obrigatório ausente não gera preview

---

### Prioridade Baixa (refinamentos e boas práticas)

**B1 — Substituir npm install por npm ci no deploy.ps1**
- Ação: Trocar `npm install` por `npm ci` na função `Deploy-Functions` (linha 113)
- Arquivos afetados: `deploy.ps1`
- Resultado esperado: Deploy local usa exatamente as versões do lock file, igual ao CI
- Critério de verificação: Script executa sem erro com `package-lock.json` presente

**B2 — Adicionar SRI nos scripts do Firebase SDK**
- Ação: Adicionar atributos `integrity="sha384-..."` nas 4 tags `<script>` do Firebase SDK (linhas 726–729)
- Arquivos afetados: `workrail_v2.html`
- Resultado esperado: Proteção contra CDN comprometido
- Critério de verificação: `<script integrity="sha384-...">` presente no HTML

**B3 — Restringir leitura de solicitações por fornecedor**
- Ação: Adicionar condição de role na regra `allow read` de `solicitacoes` em `firestore.rules`
- Arquivos afetados: `firestore.rules`
- Resultado esperado: Fornecedor EBST não consegue ler solicitações do Hobart
- Critério de verificação: Teste no Rules Playground com role fornecedor_ebst lendo solicitação de outro fornecedor

**B4 — Remover meta tag X-Frame-Options do HTML**
- Ação: Deletar linha 11 (`<meta http-equiv="X-Frame-Options" content="DENY">`)
- Arquivos afetados: `workrail_v2.html`
- Resultado esperado: Remoção de diretiva sem efeito que causa confusão documental
- Critério de verificação: `grep "X-Frame-Options" workrail_v2.html` retorna vazio

**B5 — Criar push_to_github.sh**
- Ação: Criar script shell básico para staging, commit e push (ou documentar explicitamente que o arquivo não é necessário e remover referências)
- Arquivos afetados: `push_to_github.sh` (a criar); documentos que o referenciam
- Resultado esperado: Requisito do projeto resolvido
- Critério de verificação: `ls push_to_github.sh` encontra o arquivo

---

## 4. ALTERAÇÕES RECOMENDADAS NO WORKRAIL

### 4.1 Mudanças no HTML (`workrail_v2.html`)

| # | Localização | Mudança | Tipo |
|---|-------------|---------|------|
| 1 | Linha 1935–1944 | Substituir objeto `FIREBASE_CONFIG` literal por chamada a `POST /api/config` dentro de `fetchAndInitFirebase()` | Funcional crítica |
| 2 | Função `initFirebase()` | Reescrever para chamar `fetch('/api/config')` e só inicializar Firebase após resposta válida | Funcional crítica |
| 3 | Função `mostrarAppSemLogin()` | Remover ou restringir a flag explícita de desenvolvimento (`?dev=true` na URL) | Segurança crítica |
| 4 | Linha 6 / 911 / 948 / 1077 / 1389 / 1885 | Atualizar "v2.2" → "v2.3" em todos os 6 pontos | Consistência |
| 5 | Linha 11 | Remover `<meta http-equiv="X-Frame-Options">` | Limpeza |
| 6 | Linhas 4383–4451 | Remover bloco de regras Firestore legadas do comentário | Limpeza crítica |
| 7 | Linhas 726–729 | Adicionar `integrity` (SRI) nos scripts do Firebase SDK | Segurança |
| 8 | Linha 726–729 | Avaliar atualização do Firebase SDK de 9.23.0 para versão atual | Melhoria futura |

### 4.2 Mudanças em Scripts

| Arquivo | Mudança |
|---------|---------|
| `deploy.ps1` linha 113 | `npm install` → `npm ci` |
| `deploy.ps1` linha 38 | Adicionar verificação de versão mínima do Node.js (`node --version` comparar com `18`) |
| `push_to_github.sh` | Criar o arquivo (atualmente ausente) |

### 4.3 Mudanças em Arquivos de Configuração

| Arquivo | Mudança |
|---------|---------|
| `firestore.indexes.json` | Remover `requestLog` e `workrail`; adicionar `_rateLimit.lastSeen` e `solicitacoes.(createdBy+createdAt)` |
| `firestore.rules` | Restringir `allow read` de `solicitacoes` por role de fornecedor |
| `.github/workflows/deploy.yml` | Adicionar `needs: validate` no job `preview` |
| `.gitignore` | Adicionar `functions/.runtimeconfig.json` e `*.local` |

### 4.4 Melhorias de Documentação Local

| Arquivo | Mudança |
|---------|---------|
| `FIREBASE_MANUAL_CHECKLIST.md` | Marcar itens concluídos após cada passo de configuração |
| `DEPLOY_SUMMARY.md` | Adicionar nota sobre necessidade de `package-lock.json` antes do primeiro CI |
| `TODO_REVIEW_FIREBASE_GITHUB.md` | Atualizar status de itens pendentes conforme execução |

---

## 5. ALTERAÇÕES RECOMENDADAS NA DOCUMENTAÇÃO TÉCNICA DAS MÁQUINAS

**Nota:** Os arquivos PDF, PPTX e JPEG listados nos requisitos (NT P2, NT P3, especificações EcoMax, CCR200, Diversey HD-50/HD-80, manuais, etc.) não estão presentes na pasta `workrail-repo` montada. Não foram enviados para esta sessão de análise. O diagnóstico abaixo é baseado exclusivamente nos nomes dos arquivos e na estrutura de nomes implícita nos requisitos do projeto.

[HIPÓTESE] Com base nos nomes dos arquivos listados, os documentos cobrem ao menos 6 modelos distintos de equipamentos: NT P2, NT P3, NT 810, NT 300, EcoMax 503, EcoMax 603, CCR 200, Diversey HD-50, Diversey HD-80. A presença de múltiplos fornecedores (EBST, Hobart/Diversey), múltiplos formatos (PDF descritivo, PDF manual, PPTX apresentação) e múltiplas revisões (REV00, REV01, Out25, 2023, 2024) indica ausência de padrão único de documentação.

### 5.1 Padrão único de ficha técnica proposto

Estrutura recomendada para todas as fichas técnicas:

```
FICHA TÉCNICA — [MODELO] — REV[XX]
Data: [AAAA-MM-DD] | Revisão: [N] | Aprovado por: [Nome/Cargo]

1. IDENTIFICAÇÃO
   - Modelo
   - Categoria (lavadora de louças / secagem / auxiliar / etc.)
   - Fabricante / Fornecedor
   - Referência comercial

2. DADOS TÉCNICOS PRINCIPAIS
   [usar Matriz Padrão — ver Seção 6]

3. APLICAÇÃO IDEAL
   - Tipo de estabelecimento
   - Volume de louça/hora
   - Restrições de uso

4. INSTALAÇÃO
   - Requisitos de espaço (planta baixa + elevação)
   - Conexões necessárias (água, esgoto, elétrica, exaustão)
   - Esquema de cabeamento

5. OPERAÇÃO
   - Passo a passo de operação básica
   - Programas/ciclos disponíveis
   - Alertas e indicadores

6. MANUTENÇÃO
   - Frequência por item
   - Responsável (operador / técnico)
   - Consumíveis necessários

7. CONFORMIDADE
   - Normas atendidas (NR12, etc.)
   - Certificações

8. HISTÓRICO DE REVISÕES
```

### 5.2 Padrão de desenho/instalação

- **Nomenclatura de arquivo:** `DT-[MODELO]-[TIPO]-REV[XX]-[AAAMMM].pdf`
  - Exemplo: `DT-NTP2-INSTALACAO-REV01-MAR24.pdf`
- **Escala obrigatória:** indicar escala gráfica e numérica
- **Vistas mínimas:** planta, elevação frontal, elevação lateral
- **Legenda padronizada:** simbologia única para água fria, quente, esgoto, elétrica, exaustão
- **Formato de revisão:** tabela de revisões no canto inferior direito (Rev / Data / Descrição / Aprovador)

### 5.3 Padrão de comparativo comercial

- Um único PPTX por família de produtos (ex: "EcoMax 503 vs 603 — Comparativo Comercial")
- Slide 1: Visão geral da família
- Slide 2: Matriz comparativa (baseada na Seção 6 deste relatório)
- Slide 3: Aplicação ideal por modelo
- Slide 4: Diferenciais competitivos
- Slide 5: Condições comerciais (comodato / venda)
- **Não misturar**: dados técnicos de instalação com argumentação comercial

### 5.4 Padrão de manual operacional

Separação obrigatória de documentos por público:
- **Operador**: passos simples, ilustrações grandes, sem especificações elétricas
- **Técnico de manutenção**: esquemas, especificações completas, peças de reposição
- **ADM/Comercial**: ficha técnica resumida, comparativo, condições de comodato

---

## 6. MATRIZ PADRÃO PROPOSTA

Modelo de tabela para comparação entre todos os modelos de equipamentos do portfólio:

| Campo | NT P2 | NT P3 | NT 810 | NT 300 | EcoMax 503 | EcoMax 603 | CCR 200 | HD-50 | HD-80 |
|-------|-------|-------|--------|--------|------------|------------|---------|-------|-------|
| **Categoria** | — | — | — | — | — | — | — | — | — |
| **Aplicação ideal** | — | — | — | — | — | — | — | — | — |
| **Capacidade** (cestas/h ou peças/h) | — | — | — | — | — | — | — | — | — |
| **Tempo de ciclo** (min) | — | — | — | — | — | — | — | — | — |
| **Consumo de água** (L/cesta) | — | — | — | — | — | — | — | — | — |
| **Potência total** (kW) | — | — | — | — | — | — | — | — | — |
| **Tensão / Fase** | — | — | — | — | — | — | — | — | — |
| **Pressão de água** (bar) min/max | — | — | — | — | — | — | — | — | — |
| **Dimensões** L×P×A (mm) | — | — | — | — | — | — | — | — | — |
| **Peso** (kg) | — | — | — | — | — | — | — | — | — |
| **Altura útil** (mm) | — | — | — | — | — | — | — | — | — |
| **Exigência de drenagem** | — | — | — | — | — | — | — | — | — |
| **Exigência de exaustão** | — | — | — | — | — | — | — | — | — |
| **Obs. de instalação** | — | — | — | — | — | — | — | — | — |
| **Diferenciais** | — | — | — | — | — | — | — | — | — |
| **Limitações** | — | — | — | — | — | — | — | — | — |
| **Normas atendidas** | — | — | — | — | — | — | — | — | — |
| **Doc. disponível** (D=Descritivo, M=Manual, P=PPTX, I=Instalação) | — | — | — | — | — | — | — | — | — |

*Preencher com base nos PDFs de especificação técnica de cada modelo após upload dos arquivos.*

---

## 7. ROADMAP DE EXECUÇÃO EM 3 FASES

### Fase 1 — Correções Rápidas (Semana 1)

Objetivo: tornar o sistema funcional e o CI/CD operacional.

| Ordem | Ação | Arquivo | Duração estimada |
|-------|------|---------|-----------------|
| 1 | Gerar `functions/package-lock.json` (`cd functions && npm install`) e commitar | `functions/package-lock.json` | 10 min |
| 2 | Configurar `FIREBASE_API_KEY`, `FIREBASE_MESSAGING_SENDER_ID`, `FIREBASE_APP_ID` nas Cloud Functions via Secret Manager ou `--set-env-vars` | Ambiente Firebase | 30 min |
| 3 | Adicionar 5 secrets no GitHub (`FIREBASE_TOKEN`, `FIREBASE_API_KEY`, `FIREBASE_MESSAGING_SENDER_ID`, `FIREBASE_APP_ID`, `FIREBASE_SERVICE_ACCOUNT_WORKRAIL_SOLENIS`) | GitHub Settings | 20 min |
| 4 | Deploy inicial: `.\deploy.ps1` ou `firebase deploy --project workrail-solenis` | Todos os alvos | 15 min |
| 5 | Testar health check: `GET /api/health` deve retornar `{"status":"ok"}` | Pós-deploy | 5 min |
| 6 | Verificar que `POST /api/config` retorna JSON sem `CONFIGURE_NO_ENV` | Pós-deploy | 5 min |

**Bloqueante identificado:** Items 1 e 2 devem ser executados antes de qualquer deploy CI.

---

### Fase 2 — Padronização Estrutural (Semanas 2–3)

Objetivo: corrigir inconsistências críticas de segurança e qualidade no HTML.

| Ordem | Ação | Arquivo |
|-------|------|---------|
| 1 | Implementar `fetchAndInitFirebase()` — HTML consome `/api/config` | `workrail_v2.html` |
| 2 | Remover/desabilitar `mostrarAppSemLogin()` em produção | `workrail_v2.html` |
| 3 | Remover bloco de regras Firestore legadas do HTML | `workrail_v2.html` |
| 4 | Atualizar versão de v2.2 → v2.3 em todos os pontos do HTML | `workrail_v2.html` |
| 5 | Deletar `firebaseProxy.js` da raiz | `firebaseProxy.js` |
| 6 | Corrigir `firestore.indexes.json` (coleções reais) | `firestore.indexes.json` |
| 7 | Deploy das Firestore Rules e Indexes: `firebase deploy --only firestore` | `firestore.rules` |
| 8 | Adicionar `needs: validate` no job `preview` do workflow | `deploy.yml` |
| 9 | Configurar proteção da branch `main` no GitHub | GitHub Settings |

---

### Fase 3 — Refino e Documentação Final (Semanas 4–6)

Objetivo: elevar segurança, manutenibilidade e documentação técnica.

| Ação | Arquivo |
|------|---------|
| Adicionar SRI nos scripts do Firebase SDK | `workrail_v2.html` |
| Restringir leitura de `solicitacoes` por fornecedor em Firestore Rules | `firestore.rules` |
| Substituir `npm install` por `npm ci` no deploy.ps1 | `deploy.ps1` |
| Criar `push_to_github.sh` | Novo arquivo |
| Atualizar Firebase SDK de 9.23.0 para versão atual (modular) | `workrail_v2.html` |
| Remover meta tag `X-Frame-Options` do HTML | `workrail_v2.html` |
| Avaliar migração de `FIREBASE_TOKEN` para Workload Identity Federation | `deploy.yml` |
| Popular matriz comparativa de máquinas (após upload dos PDFs) | Novo documento |
| Padronizar fichas técnicas por modelo | Documentação externa |
| Criar `push_to_github.sh` com fluxo padrão de commit/push | Novo arquivo |

---

## 8. LISTA FINAL "FAZER AGORA"

```
[ ] 1. EXECUTAR: cd functions && npm install   → gera package-lock.json
[ ] 2. COMMITAR: git add functions/package-lock.json && git commit -m "chore: add package-lock.json"
[ ] 3. CONFIGURAR: FIREBASE_API_KEY no Firebase Cloud Functions (Secret Manager)
[ ] 4. CONFIGURAR: FIREBASE_MESSAGING_SENDER_ID e FIREBASE_APP_ID nas Cloud Functions
[ ] 5. CONFIGURAR: 5 secrets no GitHub (ver GITHUB_SETUP.md)
[ ] 6. EXECUTAR: firebase deploy --only firestore (regras e indexes)
[ ] 7. EXECUTAR: .\deploy.ps1 (deploy completo)
[ ] 8. VERIFICAR: GET /api/health retorna {"status":"ok"}
[ ] 9. VERIFICAR: POST /api/config retorna apiKey real (não placeholder)
[ ] 10. CORRIGIR: workrail_v2.html — implementar fetchAndInitFirebase()
[ ] 11. CORRIGIR: workrail_v2.html — remover mostrarAppSemLogin() de produção
[ ] 12. ATUALIZAR: versão de v2.2 para v2.3 em 6 pontos do HTML
[ ] 13. REMOVER: bloco de regras Firestore legadas do comentário no HTML (linha 4383+)
[ ] 14. DELETAR: firebaseProxy.js da raiz do projeto
[ ] 15. ATUALIZAR: firestore.indexes.json com coleções reais
[ ] 16. CRIAR: push_to_github.sh
```

---

*Relatório gerado em 2026-03-28 com base exclusiva nos arquivos presentes na pasta `workrail-repo`. Nenhuma validação de ambiente externo (Firebase Console, GitHub, produção) foi realizada.*
