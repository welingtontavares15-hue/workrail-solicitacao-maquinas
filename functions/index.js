/**
 * WORKRAIL v2.3 — Cloud Functions
 * Projeto Firebase: workrail-solenis
 * Runtime: Node.js 18 | Firebase Functions Gen 2
 *
 * Funções expostas:
 *   getFirebaseConfig  → POST /api/config (via Hosting rewrite)
 *   health             → GET  /api/health  (via Hosting rewrite)
 *   cleanupRequestLog  → Scheduled (a cada 1 hora, limpa Firestore)
 *
 * Variável de ambiente obrigatória (configure antes do deploy):
 *   FIREBASE_API_KEY — chave pública do projeto Firebase
 *
 * Como configurar (escolha uma das opções):
 *
 * Opção A — Secret Manager (recomendado para produção):
 *   firebase functions:secrets:set FIREBASE_API_KEY
 *   (e adicione "secretEnvironmentVariables" no firebase.json ou aqui no código)
 *
 * Opção B — Variável de ambiente direta (via gcloud ou firebase.json):
 *   gcloud functions deploy getFirebaseConfig \
 *     --set-env-vars FIREBASE_API_KEY="AIzaSy..."
 *
 * Opção C — Para testes locais:
 *   export FIREBASE_API_KEY="AIzaSy..."
 *   firebase emulators:start --only functions
 */

'use strict';

const { onRequest } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { logger } = require('firebase-functions');
const cors = require('cors');
const admin = require('firebase-admin');

// ─── Inicialização do Admin SDK ─────────────────────────────────────────────
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// ─── CORS — origens permitidas ───────────────────────────────────────────────
const corsHandler = cors({
  origin: [
    'https://workrail-solenis.web.app',
    'https://workrail-solenis.firebaseapp.com',
    'http://localhost:5000',
    'http://localhost:3000',
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
});

// ─── Rate limiting via Firestore (persistente entre instâncias) ──────────────
const RATE_LIMIT_MAX = 100;      // requisições máximas
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // janela de 60 segundos

/**
 * Verifica e registra tentativas por IP no Firestore.
 * Retorna true se o IP estiver bloqueado.
 */
async function isRateLimited(ip) {
  const docRef = db.collection('_rateLimit').doc(ip.replace(/[.:/]/g, '_'));
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  try {
    const result = await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(docRef);
      const data = doc.exists ? doc.data() : { attempts: [] };

      // Filtra apenas tentativas dentro da janela atual
      const recent = (data.attempts || []).filter((t) => t > windowStart);

      if (recent.length >= RATE_LIMIT_MAX) {
        return true; // bloqueado
      }

      recent.push(now);
      transaction.set(docRef, {
        attempts: recent,
        lastSeen: admin.firestore.FieldValue.serverTimestamp(),
      });
      return false;
    });

    return result;
  } catch (err) {
    // Em caso de falha no rate limit, permite a requisição (fail-open)
    logger.warn('[rateLimit] Falha ao verificar rate limit, permitindo requisição:', err.message);
    return false;
  }
}

// ─── Função: getFirebaseConfig ────────────────────────────────────────────────
/**
 * Retorna a configuração pública do Firebase para o frontend.
 * Método: POST (com Content-Type: application/json)
 * Rota via Hosting: POST /api/config
 *
 * A config do cliente Firebase (apiKey, authDomain, etc.) NÃO é um segredo.
 * É segura para exposição no frontend — o controle real vem das Firestore Rules + Auth.
 * O proxy existe para evitar exposição do apiKey direto no HTML e facilitar rotação.
 */
exports.getFirebaseConfig = onRequest(
  {
    region: 'us-central1',
    cors: false, // CORS gerenciado manualmente abaixo
    timeoutSeconds: 30,
    memory: '256MiB',
  },
  (req, res) => {
    corsHandler(req, res, async () => {
      // Preflight OPTIONS
      if (req.method === 'OPTIONS') {
        return res.status(204).send('');
      }

      // Apenas POST
      if (req.method !== 'POST') {
        return res.status(405).json({
          error: 'Method not allowed',
          message: 'Only POST requests are supported',
        });
      }

      // Valida Content-Type
      const contentType = req.headers['content-type'] || '';
      if (!contentType.includes('application/json')) {
        return res.status(400).json({
          error: 'Bad request',
          message: 'Content-Type must be application/json',
        });
      }

      // IP do cliente
      const clientIp =
        (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
        req.socket?.remoteAddress ||
        'unknown';

      // Rate limiting via Firestore
      const limited = await isRateLimited(clientIp);
      if (limited) {
        logger.warn('[getFirebaseConfig] Rate limit atingido para IP:', clientIp);
        return res.status(429).json({
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: 60,
        });
      }

      // Lê API Key da variável de ambiente
      const apiKey = process.env.FIREBASE_API_KEY;
      if (!apiKey) {
        logger.error(
          '[getFirebaseConfig] FIREBASE_API_KEY não configurado. ',
          'Configure a variável de ambiente antes do deploy.'
        );
        return res.status(500).json({
          error: 'Server error',
          message: 'Firebase configuration unavailable. Contact support.',
        });
      }

      // Configuração pública do Firebase
      const firebaseConfig = {
        apiKey,
        authDomain: 'workrail-solenis.firebaseapp.com',
        projectId: 'workrail-solenis',
        storageBucket: 'workrail-solenis.appspot.com',
        // PENDÊNCIA MANUAL: substitua pelos valores reais do Firebase Console
        // Firebase Console → Project Settings → General → Your apps → Web app
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || 'CONFIGURE_NO_ENV',
        appId: process.env.FIREBASE_APP_ID || 'CONFIGURE_NO_ENV',
      };

      // Headers de resposta
      res.set('Cache-Control', 'public, max-age=600');
      res.set('Content-Type', 'application/json');
      res.set('X-Content-Type-Options', 'nosniff');

      logger.info('[getFirebaseConfig] Config solicitada', {
        ip: clientIp,
        timestamp: new Date().toISOString(),
      });

      return res.status(200).json(firebaseConfig);
    });
  }
);

// ─── Função: health ───────────────────────────────────────────────────────────
/**
 * Health check da aplicação.
 * Método: GET
 * Rota via Hosting: GET /api/health
 *
 * Verifica conectividade com Firestore e retorna status da função.
 */
exports.health = onRequest(
  {
    region: 'us-central1',
    cors: true,
    timeoutSeconds: 15,
    memory: '128MiB',
  },
  async (req, res) => {
    res.set('Cache-Control', 'no-store');

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    let firestoreOk = false;
    let firestoreError = null;

    try {
      await db.collection('_health').doc('ping').set({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
      firestoreOk = true;
    } catch (err) {
      firestoreError = err.message;
      logger.error('[health] Firestore check falhou:', err.message);
    }

    const allOk = firestoreOk;
    return res.status(allOk ? 200 : 503).json({
      status: allOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      version: '2.3.0',
      revision: process.env.K_REVISION || 'local',
      services: {
        firestore: firestoreOk ? 'ok' : `error: ${firestoreError}`,
      },
    });
  }
);

// ─── Função: cleanupRequestLog ────────────────────────────────────────────────
/**
 * Limpeza periódica do Firestore:
 * - Coleção _rateLimit: remove entradas com mais de 24h
 * - Coleção _health: remove pings com mais de 1h
 *
 * Agendamento: a cada 1 hora (igual ao original).
 */
exports.cleanupRequestLog = onSchedule(
  {
    schedule: 'every 1 hours',
    region: 'us-central1',
    timeoutSeconds: 120,
    memory: '256MiB',
  },
  async () => {
    const now = Date.now();
    const rateLimitCutoff = new Date(now - 24 * 60 * 60 * 1000); // 24h
    const healthCutoff = new Date(now - 60 * 60 * 1000);          // 1h

    let deleted = 0;

    // Limpa _rateLimit
    try {
      const rlSnapshot = await db
        .collection('_rateLimit')
        .where('lastSeen', '<', rateLimitCutoff)
        .limit(500)
        .get();

      if (!rlSnapshot.empty) {
        const batch = db.batch();
        rlSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
        deleted += rlSnapshot.size;
      }
    } catch (err) {
      logger.error('[cleanupRequestLog] Erro ao limpar _rateLimit:', err.message);
    }

    // Limpa _health (pings antigos)
    try {
      const healthSnapshot = await db
        .collection('_health')
        .where('timestamp', '<', healthCutoff)
        .limit(100)
        .get();

      if (!healthSnapshot.empty) {
        const batch = db.batch();
        healthSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
        deleted += healthSnapshot.size;
      }
    } catch (err) {
      logger.error('[cleanupRequestLog] Erro ao limpar _health:', err.message);
    }

    logger.info(`[cleanupRequestLog] Limpeza concluída. ${deleted} documentos removidos.`);
  }
);
