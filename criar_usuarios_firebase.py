#!/usr/bin/env python3
"""
🔑 Script Python — Criar Usuários Firebase Automaticamente

Este script cria usuários no Firebase Authentication e seus perfis no Firestore.

INSTALAÇÃO:
    pip install firebase-admin

ANTES DE USAR:
    1. Baixe JSON de credenciais do Firebase:
       - Firebase Console → Settings → Service Accounts
       - "Generate New Private Key"
       - Salve como: firebase-key.json (na mesma pasta que este script)

USO:
    python criar_usuarios_firebase.py
"""

import firebase_admin
from firebase_admin import credentials, auth, firestore
from datetime import datetime
import json
import sys

# ════════════════════════════════════════════════════════════
# CONFIGURAÇÃO
# ════════════════════════════════════════════════════════════

USUARIOS = [
    {
        'email': 'vendas@solenis.com',
        'senha': 'senha123',  # Mudar na primeira vez
        'nome': 'Representante Vendas',
        'perfil': 'vendas',
        'fornecedor': None
    },
    {
        'email': 'gestor@solenis.com',
        'senha': 'senha123',  # Mudar na primeira vez
        'nome': 'Gestor de Vendas',
        'perfil': 'gestor',
        'fornecedor': None
    },
    {
        'email': 'adm@solenis.com',
        'senha': 'senha123',  # Mudar na primeira vez
        'nome': 'Administrador de Vendas',
        'perfil': 'adm',
        'fornecedor': None
    },
    {
        'email': 'fornecedor-ebst@solenis.com',
        'senha': 'senha123',  # Mudar na primeira vez
        'nome': 'Fornecedor EBST',
        'perfil': 'fornecedor_ebst',
        'fornecedor': 'EBST'
    },
    {
        'email': 'fornecedor-hobart@solenis.com',
        'senha': 'senha123',  # Mudar na primeira vez
        'nome': 'Fornecedor Hobart',
        'perfil': 'fornecedor_hobart',
        'fornecedor': 'Hobart Brasil'
    },
    {
        'email': 'instalacao@solenis.com',
        'senha': 'senha123',  # Mudar na primeira vez
        'nome': 'Supervisor Técnico',
        'perfil': 'instalacao',
        'fornecedor': None
    }
]

# ════════════════════════════════════════════════════════════
# INICIALIZAR FIREBASE
# ════════════════════════════════════════════════════════════

def inicializar_firebase():
    """Inicializa conexão com Firebase"""
    try:
        # Tenta usar variável de ambiente
        if not firebase_admin.get_app():
            cred = credentials.Certificate('firebase-key.json')
            firebase_admin.initialize_app(cred)
        return True
    except FileNotFoundError:
        print('❌ Erro: Arquivo firebase-key.json não encontrado!')
        print('   Baixe em: Firebase Console → Settings → Service Accounts')
        return False
    except Exception as e:
        print(f'❌ Erro ao inicializar Firebase: {e}')
        return False

# ════════════════════════════════════════════════════════════
# CRIAR USUÁRIO
# ════════════════════════════════════════════════════════════

def criar_usuario(usuario):
    """Cria usuário no Firebase Auth + Firestore"""
    try:
        db = firestore.client()

        # 1. Criar no Authentication
        user = auth.create_user(
            email=usuario['email'],
            password=usuario['senha'],
            display_name=usuario['nome'],
            email_verified=False
        )

        print(f'✅ Auth criado: {usuario["email"]}')

        # 2. Criar perfil no Firestore
        db.collection('usuarios').document(user.uid).set({
            'nome': usuario['nome'],
            'email': usuario['email'],
            'perfil': usuario['perfil'],
            'fornecedor': usuario['fornecedor'],
            'ativo': True,
            'criadoEm': datetime.now().isoformat(),
            'ultimoAcesso': None,
            'emailVerificado': False
        })

        print(f'✅ Firestore criado: {usuario["perfil"]}')

        return {
            'email': usuario['email'],
            'perfil': usuario['perfil'],
            'uid': user.uid,
            'status': 'sucesso'
        }

    except auth.EmailAlreadyExistsError:
        return {
            'email': usuario['email'],
            'perfil': usuario['perfil'],
            'status': 'erro',
            'mensagem': 'Email já existe no Firebase'
        }
    except Exception as e:
        return {
            'email': usuario['email'],
            'perfil': usuario['perfil'],
            'status': 'erro',
            'mensagem': str(e)
        }

# ════════════════════════════════════════════════════════════
# CRIAR TODOS OS USUÁRIOS
# ════════════════════════════════════════════════════════════

def criar_todos_usuarios():
    """Cria todos os usuários em lote"""
    print('🚀 Iniciando criação de usuários...\n')
    print('═' * 70)

    resultados = []

    for i, usuario in enumerate(USUARIOS, 1):
        print(f'\n[{i}/{len(USUARIOS)}] 📝 Criando: {usuario["nome"]}')
        print(f'    Email: {usuario["email"]}')
        print(f'    Perfil: {usuario["perfil"]}')

        resultado = criar_usuario(usuario)
        resultados.append(resultado)

    # ════════════════════════════════════════════════════════════
    # RELATÓRIO FINAL
    # ════════════════════════════════════════════════════════════

    print('\n' + '═' * 70)
    print('\n📊 RELATÓRIO FINAL\n')

    sucessos = [r for r in resultados if r['status'] == 'sucesso']
    erros = [r for r in resultados if r['status'] == 'erro']

    print(f'✅ Sucessos: {len(sucessos)}/{len(USUARIOS)}')
    print(f'❌ Erros: {len(erros)}/{len(USUARIOS)}')

    if sucessos:
        print('\n✅ USUÁRIOS CRIADOS:\n')
        for s in sucessos:
            print(f'   • {s["email"]}')
            print(f'     Perfil: {s["perfil"]}')
            print(f'     UID: {s["uid"]}\n')

    if erros:
        print('\n❌ ERROS:\n')
        for e in erros:
            print(f'   • {e["email"]}')
            print(f'     Erro: {e["mensagem"]}\n')

    print('═' * 70)
    print('\n✨ Processo concluído!\n')

    return {
        'total': len(USUARIOS),
        'sucessos': len(sucessos),
        'erros': len(erros),
        'detalhes': resultados
    }

# ════════════════════════════════════════════════════════════
# MAIN
# ════════════════════════════════════════════════════════════

if __name__ == '__main__':
    print('\n🔐 WORKRAIL — Criador de Usuários Firebase\n')

    # Inicializar
    if not inicializar_firebase():
        sys.exit(1)

    # Criar usuários
    resultado = criar_todos_usuarios()

    # Salvar resultado em arquivo
    with open('resultado_criacao_usuarios.json', 'w', encoding='utf-8') as f:
        json.dump(resultado, f, ensure_ascii=False, indent=2)
    print('📄 Resultado salvo em: resultado_criacao_usuarios.json')
