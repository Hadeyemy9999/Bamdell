/**
 * CORS Middleware for Vercel Serverless Functions
 * Hope Ability Foundation Nigeria - Backend Architecture
 */

const ALLOWED_EXACT_ORIGINS = [
  'https://hopeability.org.ng',
  'https://www.hopeability.org.ng',
  'https://bamdellhome.org',
  'https://www.bamdellhome.org',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8080',
  'http://127.0.0.1:5500',
  'http://127.0.0.1:3000'
];

const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/[a-z0-9-]+-792287270077\.europe-west2\.run\.app$/,
  /^https:\/\/[a-z0-9-]+\.vercel\.app$/,
  /^https:\/\/[a-z0-9-]+\.github\.io$/,
  /^https:\/\/[a-z0-9-]+\.monkeycode-ai\.live$/
];

function isOriginAllowed(origin) {
  if (!origin) return true; // allow same-origin or non-browser server-to-server calls
  if (ALLOWED_EXACT_ORIGINS.includes(origin)) return true;
  return ALLOWED_ORIGIN_PATTERNS.some(pattern => pattern.test(origin));
}

function handleCors(req, res) {
  const origin = req.headers.origin;

  if (isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Max-Age', '86400');
  }

  // Preflight OPTIONS check
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true; // request handled
  }

  return false; // continue handling POST
}

module.exports = {
  handleCors,
  isOriginAllowed
};
