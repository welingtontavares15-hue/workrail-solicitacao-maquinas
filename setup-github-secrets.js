#!/usr/bin/env node
/**
 * setup-github-secrets.js
 * Cria o secret FIREBASE_SERVICE_ACCOUNT_WORKRAIL_SOLENIS no GitHub Actions.
 *
 * PRE-REQUISITOS:
 *   1. Node.js 18+
 *   2. Arquivo workrail-solenis-*.json na pasta Downloads
 *   3. Execute: $env:GITHUB_PAT="seu-pat"; node setup-github-secrets.js
 *
 * PAT necessario: repo + workflow scopes
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Defina via variavel de ambiente: $env:GITHUB_PAT = "seu-token"
// ou edite diretamente abaixo (escopo: repo + workflow):
const GITHUB_PAT   = process.env.GITHUB_PAT || 'SEU_PAT_AQUI';
const REPO_OWNER   = 'welingtontavares15-hue';
const REPO_NAME    = 'workrail-solicitacao-maquinas';
const SECRET_NAME  = 'FIREBASE_SERVICE_ACCOUNT_WORKRAIL_SOLENIS';

function findServiceAccountFile() {
  const downloadsDir = path.join(os.homedir(), 'Downloads');
  const files = fs.readdirSync(downloadsDir)
    .filter(f => f.startsWith('workrail-solenis-') && f.endsWith('.json'))
    .map(f => ({ name: f, path: path.join(downloadsDir, f), mtime: fs.statSync(path.join(downloadsDir, f)).mtime }))
    .sort((a, b) => b.mtime - a.mtime);
  if (files.length === 0) throw new Error('Nenhum workrail-solenis-*.json encontrado em Downloads.');
  console.log('Service account: ' + files[0].name);
  return files[0].path;
}

function ensureDependencies() {
  const deps = ['libsodium-wrappers', 'node-fetch'];
  const missing = deps.filter(dep => { try { require.resolve(dep); return false; } catch { return true; } });
  if (missing.length > 0) {
    console.log('Instalando: ' + missing.join(', '));
    execSync('npm install --no-save ' + missing.join(' '), { stdio: 'inherit' });
  }
}

async function createGitHubSecret(secretValue) {
  const fetch  = (await import('node-fetch')).default;
  const sodium = require('libsodium-wrappers');
  await sodium.ready;

  const baseUrl = 'https://api.github.com/repos/' + REPO_OWNER + '/' + REPO_NAME;
  const headers = {
    'Authorization': 'Bearer ' + GITHUB_PAT,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json'
  };

  const keyRes = await fetch(baseUrl + '/actions/secrets/public-key', { headers });
  if (!keyRes.ok) throw new Error('Erro public key: ' + keyRes.status);
  const { key_id, key } = await keyRes.json();

  const messageBytes  = Buffer.from(secretValue, 'utf8');
  const keyBytes      = Buffer.from(key, 'base64');
  const encryptedValue = Buffer.from(sodium.crypto_box_seal(messageBytes, keyBytes)).toString('base64');

  const putRes = await fetch(baseUrl + '/actions/secrets/' + SECRET_NAME, {
    method: 'PUT', headers,
    body: JSON.stringify({ encrypted_value: encryptedValue, key_id })
  });

  if (putRes.status === 201) console.log('Secret criado com sucesso!');
  else if (putRes.status === 204) console.log('Secret atualizado com sucesso!');
  else throw new Error('Falha: ' + putRes.status + ' ' + await putRes.text());
}

async function main() {
  console.log('WORKRAIL - Setup GitHub Secrets\n');
  try {
    if (!GITHUB_PAT || GITHUB_PAT === 'SEU_PAT_AQUI') throw new Error('Defina GITHUB_PAT antes de executar.');
    ensureDependencies();
    const saPath = findServiceAccountFile();
    const saJson = fs.readFileSync(saPath, 'utf8');
    const parsed = JSON.parse(saJson);
    if (parsed.type !== 'service_account') throw new Error('Arquivo nao e uma service account valida.');
    console.log('Projeto: ' + parsed.project_id);
    await createGitHubSecret(saJson);
    console.log('\nProximos passos:\n  1. Confirme o secret em github.com/' + REPO_OWNER + '/' + REPO_NAME + '/settings/secrets/actions\n  2. Execute: .\\deploy.ps1');
  } catch (err) { console.error(err.message); process.exit(1); }
}

main();
