# 🔍 ANÁLISE E CORREÇÕES — Por que SUPER_ADMIN caia para VENDAS

## Problema Identificado

Mesmo com o documento Firestore tendo `perfil: 'super_admin'`, o usuário entrava como `VENDAS`.

### Root Cause: Catch Genérico em `carregarPerfilUsuario()`

**Arquivo:** `workrail_v2.html`
**Linhas:** 2038-2050 (ANTIGO)

```javascript
} catch(e) {
  console.error('[WORKRAIL] Erro ao carregar perfil:', e);
  currentUser = {
    uid: firebaseUser.uid,
    nome: firebaseUser.displayName || firebaseUser.email,
    email: firebaseUser.email,
    perfil: 'vendas',  // ❌ FORÇA 'vendas' SE HOUVER QUALQUER ERRO!
    fornecedor: null,
    ativo: true
  };
  document.getElementById('login-overlay').classList.add('hidden');
  aplicarPerfilNaInterface();
}
```

### Cenário do Bug

1. ✓ Usuário `super_admin` faz login
2. ✓ Documento é encontrado com `perfil: 'super_admin'`
3. ❌ Se qualquer erro ocorrer na migração, validação ou carregamento:
   - Erro de Firestore (timeout, permissão, rede)
   - Erro na migração de documento
   - Erro ao ler histórico
4. → **catch ativa** e força `perfil: 'vendas'` independente do que o documento diz
5. → Admin entra como `VENDAS` 😞

---

## Correções Aplicadas

### 1️⃣ Remover Fallback Automático para VENDAS

**Novo Código (linhas 2038-2088):**

```javascript
} catch(e) {
  // ⚠️ ERRO CRÍTICO: se chegou aqui, houve problema na leitura/migração
  console.error('[WORKRAIL] ❌ ERRO CRÍTICO ao carregar perfil:', e.message, e.code);
  console.error('[WORKRAIL] Stack:', e.stack);

  // NÃO força 'vendas' automaticamente — isso mascara o erro real
  // Logout e mostra mensagem de erro específica
  await fazerLogout();

  const msgErro = e.code === 'permission-denied'
    ? 'Erro de permissão ao acessar dados. Verifique as Firestore Rules.'
    : e.code === 'unavailable'
    ? 'Serviço indisponível. Tente novamente.'
    : `Erro ao carregar perfil: ${e.message}`;

  showToast(`❌ ${msgErro}`, 'error');
  console.error('[WORKRAIL] Usuário bloqueado por erro crítico. Login requerido.');
}
```

**Benefício:** Em vez de forçar `vendas` silenciosamente, agora:
- Faz logout do usuário
- Mostra mensagem de erro ESPECÍFICA
- Permite diagnóstico claro no console
- Impede acesso não autorizado

---

### 2️⃣ Adicionar Validação de Perfis Válidos

**Novo Código (linhas 1978-2040):**

```javascript
async function carregarPerfilUsuario(firebaseUser) {
  try {
    console.log('[WORKRAIL] 🔐 Carregando perfil para:', firebaseUser.email);

    // Perfis válidos no sistema
    const PERFIS_VALIDOS = ['super_admin', 'adm', 'gestor', 'vendas', 'fornecedor_ebst', 'fornecedor_hobart'];

    // 1ª tentativa: busca pelo UID como ID do documento
    let docRef = await db.collection('usuarios').doc(firebaseUser.uid).get();
    let data = null;
    let origem = null;

    if (docRef.exists) {
      data = docRef.data();
      origem = 'UID-first-lookup';
      console.log('[WORKRAIL] ✓ Perfil encontrado por UID');
    } else {
      // 2ª tentativa: busca pelo campo email
      console.log('[WORKRAIL] ⊘ UID não encontrado, buscando por email...');
      const snap = await db.collection('usuarios')
        .where('email', '==', firebaseUser.email)
        .limit(1).get();

      if (!snap.empty) {
        const found = snap.docs[0];
        data = found.data();
        origem = 'email-lookup-migrated';
        console.log('[WORKRAIL] ✓ Perfil encontrado por email');

        // Migra para UID (não-bloqueante se falhar)
        try {
          await db.collection('usuarios').doc(firebaseUser.uid).set({
            ...data,
            uid: firebaseUser.uid,
            migradoEm: firebase.firestore.FieldValue.serverTimestamp()
          });
          console.log('[WORKRAIL] ✓ Perfil migrado para UID');
        } catch (migrErr) {
          console.warn('[WORKRAIL] ⚠ Erro ao migrar (não-bloqueante):', migrErr.message);
          // Continua mesmo se falhar — o perfil já foi lido!
        }
      }
    }

    if (data && data.perfil) {
      // ✅ Valida se o perfil é um dos aceitos
      if (!PERFIS_VALIDOS.includes(data.perfil)) {
        console.warn('[WORKRAIL] ⚠ Perfil inválido:', data.perfil);
        data.perfil = 'vendas'; // fallback seguro APENAS se inválido
      }

      currentUser = {
        uid: firebaseUser.uid,
        nome: data.nome || firebaseUser.displayName || firebaseUser.email,
        email: firebaseUser.email,
        perfil: data.perfil,  // ← Usa perfil do documento SEM fallback
        fornecedor: data.fornecedor || null,
        ativo: data.ativo !== false,
        origem: origem
      };

      console.log('[WORKRAIL] ✓ Usuário carregado:', {
        uid: currentUser.uid,
        nome: currentUser.nome,
        perfil: currentUser.perfil,
        ativo: currentUser.ativo
      });

      if (!currentUser.ativo) {
        await fazerLogout();
        showToast('Sua conta foi desativada. Contate o administrador.', 'error');
        return;
      }
    } else {
      // ❌ Usuário não encontrado — logout e mensagem clara
      await fazerLogout();
      console.warn('[WORKRAIL] ❌ Usuário não encontrado:', firebaseUser.email);
      showToast(
        '❌ Acesso negado: Seu usuário não foi criado no sistema.\n\nContate o administrador.',
        'error'
      );
      return;
    }

    // ✓ Sucesso
    console.log('[WORKRAIL] ✓ Autenticação bem-sucedida como', currentUser.perfil);
    document.getElementById('login-overlay').classList.add('hidden');
    aplicarPerfilNaInterface();
    await carregarHistoricoFirebase();
```

**Benefícios:**
- Logging detalhado em cada etapa
- Rastreia se documento foi encontrado por UID ou email
- Valida perfil contra lista de perfis válidos
- Migração é não-bloqueante (não quebra se falhar)
- Console mostra exatamente o que aconteceu

---

### 3️⃣ Atualizar Regras de Exemplo (Documentação)

**Linhas 4351-4358 (ANTIGO):**
```javascript
function isInterno() {
  return perfil() in ['vendas','gestor','adm'];  // ❌ Faltava super_admin
}
match /usuarios/{uid} {
  allow read: if request.auth.uid == uid || perfil() == 'adm';  // ❌ Só adm
  allow write: if perfil() == 'adm';  // ❌ Só adm
}
```

**Linhas 4351-4358 (NOVO):**
```javascript
function isInterno() {
  return perfil() in ['super_admin','vendas','gestor','adm'];  // ✓ Inclui super_admin
}
match /usuarios/{uid} {
  allow read: if request.auth.uid == uid || perfil() in ['adm','super_admin'];  // ✓ Ambos
  allow write: if perfil() in ['adm','super_admin'];  // ✓ Ambos
}
```

---

## Verificação: Menu & Interface

A função `aplicarControleMenu()` (linhas 2119-2151) **JÁ ESTAVA CORRETA**:

```javascript
const regras = {
  'sb-solicitacao':  ['vendas','adm'],
  'sb-pendentes':    ['gestor','adm'],
  'sb-relatorios':   ['gestor','adm','super_admin'],  // ✓
  'sb-configuracoes':['adm','super_admin'],           // ✓
  'sb-dashboard':    ['vendas','gestor','adm','super_admin'],  // ✓
  'sb-admin':        ['super_admin']  // ← Apenas super_admin acessa painel admin
};
```

---

## Como Testar Agora

### Pré-requisito
Você já tem as Firestore Rules CORRETAS no Firebase Console:
```javascript
function isInterno() {
  return perfil() in ['super_admin','vendas','gestor','adm'];
}
```

### Passos para Testar

1. **Crie o primeiro admin** (ou use existente):
   ```javascript
   criarPrimeiroAdmin()
   // Email: welingtontavares15@gmail.com
   // Senha: Agosto@2026
   // Nome: Welington Tavares
   ```

2. **Verifique o documento no Firestore**:
   - Firebase Console → Firestore
   - Collection `usuarios` → Document `{uid}`
   - Confirme que `perfil: 'super_admin'` está lá

3. **Faça logout e login novamente**:
   - Abra Developer Tools (F12)
   - Console
   - Procure por mensagens `[WORKRAIL]`:
     - `🔐 Carregando perfil para: welingtontavares15@gmail.com`
     - `✓ Perfil encontrado por UID`
     - `✓ Usuário carregado:` com `perfil: super_admin`
     - `✓ Autenticação bem-sucedida como super_admin`

4. **Verifique a interface**:
   - Topbar deve mostrar "Administrador"
   - Sidebar deve mostrar item "⚙ Configurações" (apenas para super_admin)
   - Badge no perfil deve ser vermelho (cor de admin)

---

## Se Ainda Houver Erro

Se mesmo depois das correções o usuário entrar como `VENDAS`, procure no console por:

- `❌ ERRO CRÍTICO ao carregar perfil:`
  - Mostrará o tipo exato de erro
  - Pode ser `permission-denied` (problema nas Firestore Rules)
  - Pode ser `unavailable` (Firebase desconectado)
  - Pode ser outro erro específico

**Ações conforme o erro:**
- **permission-denied**: Verifique as Firestore Rules no Firebase Console
- **unavailable**: Verifique conexão com internet e status do Firebase
- **Outro erro**: Copie a mensagem exata e pesquise

---

## Resumo das Melhorias

| Problema | Antes | Depois |
|----------|-------|--------|
| Catch genérico | Força `vendas` silenciosamente | Faz logout e mostra erro específico |
| Sem logging | Impossível diagnosticar | Logs detalhados em cada etapa |
| Migração falha | Bloqueia usuário | Não-bloqueante, continua se falhar |
| Sem validação | Qualquer perfil passa | Valida contra lista de perfis válidos |
| Documentação | Faltava super_admin | Atualizada com super_admin |

---

## Arquivo Corrigido

- **Original**: `/mnt/uploads/workrail_v2.html`
- **Corrigido**: `/mnt/Solicitações de maquina de lavar louças/workrail_v2.html`

Use o arquivo corrigido para substituir o antigo.
