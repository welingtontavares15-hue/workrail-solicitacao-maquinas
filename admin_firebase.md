# 🔐 Configurar Conta de Administrador no Firebase

## 📋 Arquivos Criados

Foram criados os seguintes arquivos na pasta do projeto:

### 1. **Credenciais_Admin_WORKRAIL.docx**
   - Documento seguro com as informações da conta
   - Contém: Email, Senha, Perfil, Nome
   - Armazenar este arquivo em local seguro
   - ⚠️ Não compartilhar com outras pessoas

### 2. **criar_admin_firebase.html**
   - Formulário web para criar a conta automaticamente
   - Opção mais rápida e fácil
   - Pode ser aberto no navegador diretamente
   - Inclui instruções manuais como fallback

### 3. **Guia_Criar_Admin_Firebase.docx**
   - Guia passo-a-passo detalhado
   - Dois métodos: automático e manual
   - Solução de problemas
   - Notas de segurança

---

## ⚡ Procedimento Rápido

### Opção 1: Usar o Formulário Automático (Recomendado)

1. Abra o arquivo **criar_admin_firebase.html** no navegador
2. Clique no botão "Criar Conta no Firebase"
3. Aguarde a mensagem de sucesso
4. Pronto! A conta foi criada

### Opção 2: Criar Manualmente no Firebase Console

1. Acesse: https://console.firebase.google.com/
2. Selecione projeto: **workrail-solenis**
3. Vá para: **Authentication → Users**
4. Clique em: **Create user**
5. Preencha:
   - Email: `welingtontavares15@gmail.com`
   - Password: `Agosto@2026`
6. Clique em: **Create user**

### Criar Documento no Firestore

1. Vá para: **Firestore Database → Data**
2. Abra a coleção: **usuarios**
3. Clique em: **Add document**
4. Preencha os campos:
   - nome: `Admin Welington`
   - email: `welingtontavares15@gmail.com`
   - perfil: `super_admin`
   - ativo: `true`
5. Clique em: **Save**

---

## ✅ Verificar a Criação

- ✓ Conta em **Authentication → Users** com o email
- ✓ Documento em **Firestore → usuarios** com os dados

---

## 🔑 Informações da Conta

| Campo | Valor |
|-------|-------|
| **Email** | welingtontavares15@gmail.com |
| **Senha** | Agosto@2026 |
| **Perfil** | super_admin |
| **Nome** | Admin Welington |

---

## 🚀 Próximas Etapas

1. Fazer login no WORKRAIL com a conta de administrador
2. Alterar a senha na primeira entrada (se desejar)
3. Criar contas para os demais usuários (Vendas, Gestor, ADM, Fornecedor)
4. Configurar permissões e grupos de trabalho

---

## ⚠️ Segurança

A senha **Agosto@2026** será armazenada de forma segura e criptografada no Firebase Authentication.

**IMPORTANTE:**
- Não compartilhe a senha com outras pessoas
- Mude a senha periodicamente
- Nunca escreva a senha em documentos públicos
- Apenas o administrador autorizado deve ter acesso

---

## 📞 Suporte

Se encontrar problemas:
1. Consulte o arquivo **Guia_Criar_Admin_Firebase.docx**
2. Verifique a seção "Solução de Problemas"
3. Confirme que o Firebase está acessível
4. Verifique se a coleção "usuarios" existe no Firestore

---

**Data de Criação:** 2026-03-23
**Sistema:** WORKRAIL - Solicitações de Máquinas de Lavar Louças
**Versão:** 2.0
