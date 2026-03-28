'use strict';

const { onRequest } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { logger } = require('firebase-functions');
const cors = require('cors');
const admin = require('firebase-admin');

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

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

const RATE_LIMIT_MAX = 100;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

async function isRateLimited(ip) {
  const docRef = db.collection('_rateLimit').doc(ip.replace(/[.:/]/g, '_'));
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  try {
    return await db.runTransaction(async (t) => {
      const doc = await t.get(docRef);
      const data = doc.exists ? doc.data() : { attempts: [] };
      const recent = (data.attempts || []).filter(ts => ts > windowStart);
      if (recent.length >= RATE_LIMIT_MAX) return true;
      recent.push(now);
      t.set(docRef, { attempts: recent, lastSeen: admin.firestore.FieldValue.serverTimestamp() });
      return false;
    });
  } catch (err) {
    logger.warn('[rateLimit] falha, permitindo requisicao:', err.message);
    return false;
  }
}

// getFirebaseConfig — POST /api/config
exports.getFirebaseConfig = onRequest(
  { region: 'us-central1', cors: false, timeoutSeconds: 30, memory: '256MiB' },
  (req, res) => {
    corsHandler(req, res, async () => {
      if (req.method === 'OPTIONS') return res.status(204).send('');
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

      const ct = req.headers['content-type'] || '';
      if (!ct.includes('application/json'))
        return res.status(400).json({ error: 'Content-Type must be application/json' });

      const clientIp = (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
        || req.socket?.remoteAddress || 'unknown';

      if (await isRateLimited(clientIp))
        return res.status(429).json({ error: 'Too many requests', retryAfter: 60 });

      const apiKey = process.env.FIREBASE_API_KEY;
      if (!apiKey) {
        logger.error('[getFirebaseConfig] FIREBASE_API_KEY nao configurado');
        return res.status(500).json({ error: 'Firebase configuration unavailable' });
      }

      res.set('Cache-Control', 'public, max-age=600');
      logger.info('[getFirebaseConfig] config solicitada', { ip: clientIp });

      return res.status(200).json({
        apiKey,
        authDomain: 'workrail-solenis.firebaseapp.com',
        projectId: 'workrail-solenis',
        storageBucket: 'workrail-solenis.appspot.com',
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || 'CONFIGURE_NO_ENV',
        appId: process.env.FIREBASE_APP_ID || 'CONFIGURE_NO_ENV',
      });
    });
  }
);

// health — GET /api/health
exports.health = onRequest(
  { region: 'us-central1', cors: true, timeoutSeconds: 15, memory: '128MiB' },
  async (req, res) => {
    res.set('Cache-Control', 'no-store');
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    let firestoreOk = false;
    try {
      await db.collection('_health').doc('ping').set({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
      firestoreOk = true;
    } catch (err) {
      logger.error('[health] Firestore check falhou:', err.message);
    }

    return res.status(firestoreOk ? 200 : 503).json({
      status: firestoreOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      version: '2.3.0',
      revision: process.env.K_REVISION || 'local',
      services: { firestore: firestoreOk ? 'ok' : 'error' },
    });
  }
);

// cleanupRequestLog — scheduled every 1 hour
exports.cleanupRequestLog = onSchedule(
  { schedule: 'every 1 hours', region: 'us-central1', timeoutSeconds: 120, memory: '256MiB' },
  async () => {
    const now = Date.now();
    const rlCutoff = new Date(now - 24 * 60 * 60 * 1000);
    const hCutoff = new Date(now - 60 * 60 * 1000);
    let deleted = 0;

    const rlSnap = await db.collection('_rateLimit').where('lastSeen', '<', rlCutoff).limit(500).get();
    if (!rlSnap.empty) {
      const b = db.batch();
      rlSnap.docs.forEach(d => b.delete(d.ref));
      await b.commit();
      deleted += rlSnap.size;
    }

    const hSnap = await db.collection('_health').where('timestamp', '<', hCutoff).limit(100).get();
    if (!hSnap.empty) {
      const b = db.batch();
      hSnap.docs.forEach(d => b.delete(d.ref));
      await b.commit();
      deleted += hSnap.size;
    }

    logger.info('[cleanupRequestLog] ' + deleted + ' documentos removidos.');
  }
);
