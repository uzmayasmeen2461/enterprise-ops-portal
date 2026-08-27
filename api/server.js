// ─── Enterprise Ops Portal — AI Gateway Server ────────────────────────────────
// A minimal Express gateway that sits between the Angular frontend and the AI
// provider. Its only job: receive a plain-English query, ask the LLM to parse
// it into structured JSON filters, validate the result, and return it.
//
// WHY this exists:
//   AI API keys must NEVER be sent to the browser. Browser-side JavaScript is
//   fully visible to any user via DevTools → Network tab. This server is the
//   security boundary — the key lives in process.env only.

'use strict';

const express = require('express');
const cors    = require('cors');
const path    = require('path');

// dotenv loads .env into process.env — must run before anything reads env vars
require('dotenv').config({ path: path.join(__dirname, '.env') });

const aiRouter = require('./routes/ai');

const app  = express();
const PORT = process.env.PORT || 4000;

// ── Middleware ────────────────────────────────────────────────────────────────

// Parse incoming JSON bodies — equivalent to express.json()
app.use(express.json());

// CORS — allowed origins are driven by environment variables so no code
// change is needed between local dev and production deployment.
// Set FRONTEND_URL in your hosting platform's environment variables.
const allowedOrigins = [
  'http://localhost:4200',
  process.env.FRONTEND_URL          // e.g. https://your-app.vercel.app
].filter(Boolean);                  // remove undefined if FRONTEND_URL is not set

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin '${origin}' is not allowed`));
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/ai', aiRouter);

// Health check — useful for confirming the server is running
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── 404 fallback ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Global error handler ──────────────────────────────────────────────────────
// Express calls this when next(err) is called or an async route throws
app.use((err, _req, res, _next) => {
  console.error('[API Error]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`[API] AI model: ${process.env.AI_MODEL ?? 'not set'}`);
  console.log(`[API] Key loaded: ${process.env.AI_API_KEY ? 'YES' : 'NO — check .env'}`);
});
