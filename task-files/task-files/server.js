/**
 * Molt Coach — Mock API server
 * =============================
 * Zero dependencies. Node 18+ only. No npm install needed.
 *
 *   node server.js
 *   -> API running on http://localhost:4000
 *
 * On Android emulator use http://10.0.2.2:4000
 * On a real device use http://<your-computer-LAN-ip>:4000
 *
 * This server behaves like a real backend on a real network:
 *  - it is slow (400-1200ms)
 *  - it fails sometimes (10% of reads, 15% of writes)
 *  - it rejects bad data with 422 and a field-level message
 *  - it requires a Bearer token on every call except /auth/login
 *  - it does NOT return lists in date order
 *
 * All of that is on purpose. Your app has to survive it.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 4000;
const DB_PATH = path.join(__dirname, 'db.json');

/* ------------------------------------------------------------------ */
/* In-memory state                                                     */
/* ------------------------------------------------------------------ */

const seed = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
let db = structuredClone(seed);

const settings = {
  minLatencyMs: 400,
  maxLatencyMs: 1200,
  readFailureRate: 0.1,
  writeFailureRate: 0.15,
  offline: false,
};

const VALID_TOKEN = 'molt_test_token_9f3a';
const GIRTH_SITES = ['waist', 'chest', 'hip', 'arm', 'thigh'];

let idSeq = 5000;
const newId = (p) => `${p}_${++idSeq}`;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const randomLatency = () =>
  settings.minLatencyMs +
  Math.random() * (settings.maxLatencyMs - settings.minLatencyMs);

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const dayKey = (iso) => new Date(iso).toISOString().slice(0, 10);

function send(res, status, body) {
  const payload = body === undefined ? '' : JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Content-Length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (c) => {
      raw += c;
      if (raw.length > 1e6) reject(new Error('body too large'));
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('invalid json'));
      }
    });
  });
}

/** 422 body shape — always this shape, so you can type it once. */
const validationError = (field, message) => ({
  error: {
    code: 'VALIDATION_FAILED',
    field,
    message,
  },
});

function inRange(entry, from, to) {
  const t = Date.parse(entry.dateISO);
  if (from && t < Date.parse(from)) return false;
  if (to && t > Date.parse(to)) return false;
  return true;
}

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

function validateWeight(clientId, body) {
  if (typeof body.weightKg !== 'number' || Number.isNaN(body.weightKg)) {
    return validationError('weightKg', 'Weight must be a number in kilograms.');
  }
  if (body.weightKg < 20 || body.weightKg > 400) {
    return validationError('weightKg', 'Weight must be between 20 and 400 kg.');
  }
  if (typeof body.dateISO !== 'string' || Number.isNaN(Date.parse(body.dateISO))) {
    return validationError('dateISO', 'A valid ISO date is required.');
  }
  if (Date.parse(body.dateISO) > Date.now()) {
    return validationError('dateISO', 'You cannot log a measurement in the future.');
  }
  const clash = db.weightEntries.some(
    (e) => e.clientId === clientId && dayKey(e.dateISO) === dayKey(body.dateISO)
  );
  if (clash) {
    return {
      error: {
        code: 'DUPLICATE_DATE',
        field: 'dateISO',
        message: 'This client already has a weight entry for that day.',
      },
    };
  }
  return null;
}

function validateGirth(clientId, body) {
  if (!GIRTH_SITES.includes(body.site)) {
    return validationError(
      'site',
      `Site must be one of: ${GIRTH_SITES.join(', ')}.`
    );
  }
  if (typeof body.valueMm !== 'number' || Number.isNaN(body.valueMm)) {
    return validationError('valueMm', 'Measurement must be a number in millimetres.');
  }
  if (body.valueMm < 100 || body.valueMm > 2000) {
    return validationError('valueMm', 'Measurement must be between 100 and 2000 mm.');
  }
  if (typeof body.dateISO !== 'string' || Number.isNaN(Date.parse(body.dateISO))) {
    return validationError('dateISO', 'A valid ISO date is required.');
  }
  if (Date.parse(body.dateISO) > Date.now()) {
    return validationError('dateISO', 'You cannot log a measurement in the future.');
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Router                                                              */
/* ------------------------------------------------------------------ */

async function handle(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const seg = url.pathname.split('/').filter(Boolean);
  const method = req.method;
  const isWrite = method === 'POST' || method === 'DELETE' || method === 'PATCH';

  if (method === 'OPTIONS') return send(res, 204);

  /* --- devtools: no auth, no latency, no failures ------------------ */
  if (seg[0] === '__devtools') {
    const body = await readBody(req);
    if (body.reset) {
      db = structuredClone(seed);
      idSeq = 5000;
    }
    if (typeof body.readFailureRate === 'number')
      settings.readFailureRate = body.readFailureRate;
    if (typeof body.writeFailureRate === 'number')
      settings.writeFailureRate = body.writeFailureRate;
    if (typeof body.minLatencyMs === 'number')
      settings.minLatencyMs = body.minLatencyMs;
    if (typeof body.maxLatencyMs === 'number')
      settings.maxLatencyMs = body.maxLatencyMs;
    if (typeof body.offline === 'boolean') settings.offline = body.offline;
    console.log('[devtools]', settings);
    return send(res, 200, { ok: true, settings });
  }

  /* --- simulate a dead network ------------------------------------- */
  if (settings.offline) {
    req.destroy();
    return;
  }

  await sleep(randomLatency());

  /* --- login ------------------------------------------------------- */
  if (seg[0] === 'auth' && seg[1] === 'login' && method === 'POST') {
    let body;
    try {
      body = await readBody(req);
    } catch {
      return send(res, 400, { error: { code: 'BAD_JSON', message: 'Bad JSON.' } });
    }
    if (!body.email || !body.password) {
      return send(
        res,
        422,
        validationError(
          !body.email ? 'email' : 'password',
          'Email and password are both required.'
        )
      );
    }
    const ok =
      String(body.email).trim().toLowerCase() === db.credentials.email &&
      body.password === db.credentials.password;
    if (!ok) {
      return send(res, 401, {
        error: { code: 'INVALID_CREDENTIALS', message: 'Email or password is wrong.' },
      });
    }
    return send(res, 200, { token: VALID_TOKEN, coach: db.coach });
  }

  /* --- everything below needs a token ------------------------------ */
  const auth = req.headers.authorization || '';
  if (auth !== `Bearer ${VALID_TOKEN}`) {
    return send(res, 401, {
      error: { code: 'UNAUTHORIZED', message: 'Missing or invalid token.' },
    });
  }

  /* --- random failures --------------------------------------------- */
  const failRate = isWrite ? settings.writeFailureRate : settings.readFailureRate;
  if (Math.random() < failRate) {
    return send(res, 503, {
      error: { code: 'SERVICE_UNAVAILABLE', message: 'Server hiccup. Try again.' },
    });
  }

  /* --- GET /me ------------------------------------------------------ */
  if (seg[0] === 'me' && method === 'GET') {
    return send(res, 200, db.coach);
  }

  /* --- GET /clients ------------------------------------------------- */
  if (seg[0] === 'clients' && seg.length === 1 && method === 'GET') {
    return send(res, 200, { items: shuffle(db.clients) });
  }

  /* --- /clients/:id ------------------------------------------------- */
  if (seg[0] === 'clients' && seg[1]) {
    const clientId = seg[1];
    const client = db.clients.find((c) => c.id === clientId);
    if (!client) {
      return send(res, 404, {
        error: { code: 'NOT_FOUND', message: 'No such client.' },
      });
    }

    // GET /clients/:id
    if (seg.length === 2 && method === 'GET') {
      return send(res, 200, client);
    }

    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');

    // GET /clients/:id/weight
    if (seg[2] === 'weight' && method === 'GET') {
      const items = db.weightEntries.filter(
        (e) => e.clientId === clientId && inRange(e, from, to)
      );
      return send(res, 200, { items: shuffle(items) });
    }

    // POST /clients/:id/weight
    if (seg[2] === 'weight' && method === 'POST') {
      let body;
      try {
        body = await readBody(req);
      } catch {
        return send(res, 400, { error: { code: 'BAD_JSON', message: 'Bad JSON.' } });
      }
      const bad = validateWeight(clientId, body);
      if (bad) return send(res, 422, bad);

      const entry = {
        id: newId('w'),
        clientId,
        dateISO: new Date(body.dateISO).toISOString(),
        // the server rounds. your optimistic value may not match this.
        weightKg: Math.round(body.weightKg * 1000) / 1000,
        note: body.note ?? null,
        source: 'coach',
        // Undocumented on purpose: any 'method' value sent is stored and
        // echoed back. Used by the live-code round of the interview.
        method: body.method ?? null,
        createdAtISO: new Date().toISOString(),
      };
      db.weightEntries.push(entry);
      return send(res, 201, entry);
    }

    // GET /clients/:id/girth
    if (seg[2] === 'girth' && method === 'GET') {
      const site = url.searchParams.get('site');
      const items = db.girthEntries.filter(
        (e) =>
          e.clientId === clientId &&
          (!site || e.site === site) &&
          inRange(e, from, to)
      );
      return send(res, 200, { items: shuffle(items) });
    }

    // POST /clients/:id/girth
    if (seg[2] === 'girth' && method === 'POST') {
      let body;
      try {
        body = await readBody(req);
      } catch {
        return send(res, 400, { error: { code: 'BAD_JSON', message: 'Bad JSON.' } });
      }
      const bad = validateGirth(clientId, body);
      if (bad) return send(res, 422, bad);

      const entry = {
        id: newId('g'),
        clientId,
        dateISO: new Date(body.dateISO).toISOString(),
        site: body.site,
        valueMm: Math.round(body.valueMm),
        source: 'coach',
        method: body.method ?? null,
        createdAtISO: new Date().toISOString(),
      };
      db.girthEntries.push(entry);
      return send(res, 201, entry);
    }
  }

  /* --- DELETE /weight/:id  and  DELETE /girth/:id ------------------- */
  if (method === 'DELETE' && (seg[0] === 'weight' || seg[0] === 'girth') && seg[1]) {
    const list = seg[0] === 'weight' ? db.weightEntries : db.girthEntries;
    const i = list.findIndex((e) => e.id === seg[1]);
    if (i === -1) {
      return send(res, 404, {
        error: { code: 'NOT_FOUND', message: 'No such entry.' },
      });
    }
    list.splice(i, 1);
    return send(res, 204);
  }

  return send(res, 404, {
    error: { code: 'NOT_FOUND', message: `No route for ${method} ${url.pathname}` },
  });
}

/* ------------------------------------------------------------------ */

http
  .createServer((req, res) => {
    const started = Date.now();
    handle(req, res)
      .catch((err) => {
        console.error(err);
        if (!res.headersSent) {
          send(res, 500, {
            error: { code: 'INTERNAL', message: 'Something broke server-side.' },
          });
        }
      })
      .finally(() => {
        console.log(
          `${req.method} ${req.url} -> ${res.statusCode} (${Date.now() - started}ms)`
        );
      });
  })
  .listen(PORT, () => {
    console.log('');
    console.log('  Molt Coach mock API');
    console.log(`  http://localhost:4000`);
    console.log(`  Android emulator: http://10.0.2.2:4000`);
    console.log('');
    console.log(`  Login: ${db.credentials.email} / ${db.credentials.password}`);
    console.log('');
    console.log(`  ${db.clients.length} clients, ${db.weightEntries.length} weight`);
    console.log(`  and ${db.girthEntries.length} girth entries loaded.`);
    console.log('');
  });
