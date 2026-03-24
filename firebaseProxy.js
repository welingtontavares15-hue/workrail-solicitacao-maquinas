/**
 * WORKRAIL v2.2 Firebase Configuration Proxy
 *
 * Cloud Function to securely distribute Firebase API key without exposing it in client code.
 * Deployed to: https://us-central1-workrail-solenis.cloudfunctions.net/getFirebaseConfig
 *
 * SETUP INSTRUCTIONS:
 * 1. Deploy this function to Google Cloud Functions:
 *    gcloud functions deploy getFirebaseConfig \
 *      --runtime nodejs18 \
 *      --trigger-http \
 *      --allow-unauthenticated \
 *      --region us-central1 \
 *      --set-env-vars FIREBASE_API_KEY="YOUR_API_KEY_HERE"
 *
 * 2. Update firebase.json rewrites section:
 *    "rewrites": [
 *      {
 *        "source": "/api/config",
 *        "function": "getFirebaseConfig"
 *      }
 *    ]
 *
 * 3. Add CSP header in firebase.json:
 *    "headers": [
 *      {
 *        "key": "Content-Security-Policy",
 *        "value": "default-src 'self'; script-src 'self' https://www.gstatic.com/firebasejs/ https://cdn.jsdelivr.net/npm/dompurify@3.0.6/; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.firebaseio.com https://*.googleapis.com"
 *      }
 *    ]
 */

const functions = require("firebase-functions");
const cors = require("cors")({
  origin: ["https://workrail-solenis.web.app", "http://localhost:5000"],
  credentials: true
});

/**
 * Rate limiting middleware for auth endpoints
 */
const requestLog = new Map();

function isRateLimited(ip, maxAttempts = 100, windowMs = 60000) {
  const now = Date.now();
  const attempts = requestLog.get(ip) || [];
  const recent = attempts.filter(t => now - t < windowMs);

  if (recent.length >= maxAttempts) {
    return true;
  }

  recent.push(now);
  requestLog.set(ip, recent);
  return false;
}

/**
 * Firebase Config Endpoint
 * Returns Firebase configuration for client-side initialization
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getFirebaseConfig = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    // Only allow POST requests
    if (req.method !== "POST") {
      return res.status(405).json({
        error: "Method not allowed",
        message: "Only POST requests are supported"
      });
    }

    // Get client IP for rate limiting
    const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    // Check rate limit (100 requests per minute per IP)
    if (isRateLimited(clientIp, 100, 60000)) {
      return res.status(429).json({
        error: "Too many requests",
        message: "Rate limit exceeded. Please try again later.",
        retryAfter: 60
      });
    }

    try {
      // Validate request headers
      const contentType = req.headers["content-type"];
      if (!contentType || !contentType.includes("application/json")) {
        return res.status(400).json({
          error: "Bad request",
          message: "Content-Type must be application/json"
        });
      }

      // Get API key from environment variable
      // Set during deployment with: --set-env-vars FIREBASE_API_KEY="..."
      const apiKey = process.env.FIREBASE_API_KEY;
      if (!apiKey) {
        console.error("FIREBASE_API_KEY environment variable not set");
        return res.status(500).json({
          error: "Server error",
          message: "Firebase configuration unavailable"
        });
      }

      // Return Firebase configuration
      // NOTE: Other config values are not sensitive and could be in the client,
      // but for security best practice, we centralize configuration here
      const firebaseConfig = {
        apiKey: apiKey,
        authDomain: "workrail-solenis.firebaseapp.com",
        projectId: "workrail-solenis",
        storageBucket: "workrail-solenis.appspot.com",
        messagingSenderId: "000000000000",
        appId: "1:000000000000:web:0000000000000000",
        // Cache for 10 minutes on client
        cacheControl: "public, max-age=600"
      };

      // Add security headers
      res.set("Cache-Control", "public, max-age=600");
      res.set("Content-Type", "application/json");
      res.set("X-Content-Type-Options", "nosniff");
      res.set("X-Frame-Options", "DENY");

      // Log successful request (security audit)
      functions.logger.info("Firebase config requested", {
        ip: clientIp,
        timestamp: new Date().toISOString()
      });

      return res.status(200).json(firebaseConfig);
    } catch (error) {
      console.error("Error processing request:", error);
      functions.logger.error("Firebase config endpoint error", { error });
      return res.status(500).json({
        error: "Server error",
        message: "An error occurred while processing your request"
      });
    }
  });
});

/**
 * Health check endpoint
 * Can be used to monitor Cloud Function availability
 */
exports.health = functions.https.onRequest((req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "2.2.0"
  });
});

/**
 * Log cleanup function
 * Runs periodically to clean up old log entries and prevent memory leaks
 * Schedule with Cloud Scheduler: "every 1 hours"
 */
exports.cleanupRequestLog = functions.pubsub
  .schedule("every 1 hours")
  .onRun((context) => {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    // Clean up old entries from request log
    for (const [ip, timestamps] of requestLog.entries()) {
      const recent = timestamps.filter(t => now - t < maxAge);
      if (recent.length === 0) {
        requestLog.delete(ip);
      } else {
        requestLog.set(ip, recent);
      }
    }

    functions.logger.info("Request log cleanup completed", {
      entriesRemaining: requestLog.size
    });

    return null;
  });
