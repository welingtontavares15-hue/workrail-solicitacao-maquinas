/**
 * 🔑 Script de Automação — Criar Usuários Firebase
 *
 * Este script cria automaticamente os usuários necessários no Firebase
 * Authentication e adiciona seus perfis no Firestore.
 *
 * USO:
 * 1. Abra Firebase Console em https://console.firebase.google.com
 * 2. Vá para "Firestore Database" → Cloud Shell (terminal ícone >_)
 * 3. Cole este código no terminal
 * 4. Execute
 */

// ════════════════════════════════════════════════════════════
// CONFIGURAÇÃO
// ════════════════════════════════════════════════════════════

const USUARIOS = [
  {
    email: 'vendas@solenis.com',
    senha: 'senha123', // Mudar na primeira vez
    nome: 'Representante Vendas',
    perfil: 'vendas',
    fornecedor: null
  },
  {
    email: 'gestor@solenis.com',
    senha: 'senha123', // Mudar na primeira vez
    nome: 'Gestor de Vendas',
    perfil: 'gestor',
    fornecedor: null
  },
  {
    email: 'adm@solenis.com',
    senha: 'senha123', // Mudar na primeira vez
    nome: 'Administrador de Vendas',
    perfil: 'adm',
    fornecedor: null
  },
  {
    email: 'fornecedor-ebst@solenis.com',
    senha: 'senha123', // Mudar na primeira vez
    nome: 'Fornecedor EBST',
    perfil: 'fornecedor_ebst',
    fornecedor: 'EBST'
  },
  {
    email: 'fornecedor-hobart@solenis.com',
    senha: 'senha123', // Mudar na primeira vez
    nome: 'Fornecedor Hobart',
    perfil: 'fornecedor_hobart',
    fornecedor: 'Hobart Brasil'
  },
  {
    email: 'instalacao@solenis.com',
    senha: 'senha123', // Mudar na primeira vez
    nome: 'Supervisor Técnico',
    perfil: 'instalacao',
    fornecedor: null
  }
];

// ════════════════════════════════════════════════════════════
// FUNÇÃO: Criar Usuário no Firebase Auth + Firestore
// ════════════════════════════════════════════════════════════

async function criarUsuario(usuario) {
  try {
    // 1. Criar usuário no Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email: usuario.email,
      password: usuario.senha,
      displayName: usuario.nome,
      emailVerified: false
    });

    console.log(`✅ Usuário criado no Authentication: ${usuario.email}`);

    // 2. Criar perfil no Firestore
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

    console.log(`✅ Perfil criado no Firestore: ${usuario.perfil}`);

    return {
      uid: userRecord.uid,
      email: usuario.email,
      perfil: usuario.perfil,
      status: 'sucesso'
    };

  } catch (erro) {
    console.error(`❌ Erro ao criar usuário ${usuario.email}:`, erro.message);
    return {
      email: usuario.email,
      perfil: usuario.perfil,
      status: 'erro',
      mensagem: erro.message
    };
  }
}

// ════════════════════════════════════════════════════════════
// FUNÇÃO: Executar Criação em Lote
// ════════════════════════════════════════════════════════════

async function criarTodosOsUsuarios() {
  console.log('🚀 Iniciando criação de usuários...\n');
  console.log('═'.repeat(60));

  const resultados = [];

  for (const usuario of USUARIOS) {
    console.log(`\n📝 Criando: ${usuario.nome}`);
    console.log(`   Email: ${usuario.email}`);
    console.log(`   Perfil: ${usuario.perfil}`);

    const resultado = await criarUsuario(usuario);
    resultados.push(resultado);

    // Aguarda 500ms entre cada criação para evitar rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // ════════════════════════════════════════════════════════════
  // RELATÓRIO FINAL
  // ════════════════════════════════════════════════════════════

  console.log('\n' + '═'.repeat(60));
  console.log('\n📊 RELATÓRIO FINAL\n');

  const sucessos = resultados.filter(r => r.status === 'sucesso');
  const erros = resultados.filter(r => r.status === 'erro');

  console.log(`✅ Sucessos: ${sucessos.length}/${USUARIOS.length}`);
  console.log(`❌ Erros: ${erros.length}/${USUARIOS.length}`);

  if (sucessos.length > 0) {
    console.log('\n✅ USUÁRIOS CRIADOS:\n');
    sucessos.forEach(s => {
      console.log(`   • ${s.email}`);
      console.log(`     Perfil: ${s.perfil}`);
      console.log(`     UID: ${s.uid}\n`);
    });
  }

  if (erros.length > 0) {
    console.log('\n❌ ERROS:\n');
    erros.forEach(e => {
      console.log(`   • ${e.email}`);
      console.log(`     Erro: ${e.mensagem}\n`);
    });
  }

  console.log('═'.repeat(60));
  console.log('\n✨ Processo concluído!\n');

  return {
    total: USUARIOS.length,
    sucessos: sucessos.length,
    erros: erros.length,
    detalhes: resultados
  };
}

// ════════════════════════════════════════════════════════════
// EXECUTAR
// ════════════════════════════════════════════════════════════

// Descomente a linha abaixo para executar
// criarTodosOsUsuarios();

// Para executar, cole no Firebase Cloud Shell:
console.log(`
🔑 INSTRUÇÕES DE USO:

1. Abra https://console.firebase.google.com
2. Selecione seu projeto WORKRAIL-Solenis
3. Vá para Firestore Database → Cloud Shell (>_)
4. Cole este código no terminal:

   const admin = require('firebase-admin');
   admin.initializeApp();

   // [Cole aqui o conteúdo deste arquivo]

   criarTodosOsUsuarios().then(resultado => {
     console.log('Resumo:', resultado);
     process.exit(0);
   }).catch(erro => {
     console.error('Erro fatal:', erro);
     process.exit(1);
   });

5. Pressione ENTER
6. Aguarde a conclusão
`);
