// Attack-signature library used by the security monitor.
// Patterns are deliberately specific: the scanner inspects URLs, query strings,
// JSON/urlencoded bodies and a few headers on every request, so a loose pattern
// would flag legitimate patient messages ("it's" contains a quote, etc.).
// Everything here is matched against the URL-decoded value once, case-insensitive.

export const SIGNATURES = [
  {
    type: 'SQL_INJECTION',
    severity: 'high',
    pattern:
      /(\bunion\b[\s\S]{0,40}\bselect\b|\bsleep\s*\(|\bbenchmark\s*\(|\bpg_sleep\b|\binformation_schema\b|\bwaitfor\s+delay\b|';\s*drop\s+table\b)/i,
  },
  {
    type: 'SQL_INJECTION',
    severity: 'high',
    // ' OR 1=1 --  /  " AND "2"="2  (quote adjacent to OR/AND comparison)
    pattern: /('|%27|")\s*(or|and)\s+('|%27|")?\s*[a-z0-9_]+\s*(=|like)\s*('|%27|")?\s*[a-z0-9_]+/i,
  },
  {
    type: 'XSS',
    severity: 'high',
    pattern: /<\s*script\b|<\s*iframe\b|<\s*object\b|<\s*embed\b|javascript\s*:\s*|on(error|load|click|mouseover|focus)\s*=|srcdoc\s*=/i,
  },
  {
    type: 'PATH_TRAVERSAL',
    severity: 'high',
    pattern: /(\.\.[\/\\]|%2e%2e|\.\.%2f|%252e%252e|\/etc\/passwd|\/proc\/self)/i,
  },
  {
    type: 'COMMAND_INJECTION',
    severity: 'critical',
    pattern: /(\$\((cat|curl|wget|nc|bash|sh|python|perl)\b|;\s*(cat|curl|wget|nc|bash|sh)\b|&&\s*(cat|curl|wget|nc|bash|sh)\b|\/dev\/tcp\/|\bnc\s+-[elp]\b)/i,
  },
  {
    type: 'LOG4SHELL',
    severity: 'critical',
    pattern: /\$\{jndi:/i,
  },
  {
    type: 'SSRF_PROBE',
    severity: 'medium',
    pattern: /(169\.254\.169\.254|metadata\.google\.internal|instances\/meta|\/latest\/meta-data)/i,
  },
  {
    type: 'NULL_BYTE',
    severity: 'high',
    pattern: /%00|\u0000/,
  },
];

const MAX_SCAN_BYTES = 64 * 1024; // never scan giant payloads (DoS guard)
const MAX_MATCHES = 3;

/**
 * Scan request URL + query values + string body/headers for attack patterns.
 * @returns {{type: string, severity: string, sample: string} | null}
 */
export function scanRequest(req) {
  try {
    const found = [];
    const consider = (value, source) => {
      if (typeof value !== 'string' || value.length === 0) return;
      const hay = value.length > MAX_SCAN_BYTES ? value.slice(0, MAX_SCAN_BYTES) : value;
      for (const sig of SIGNATURES) {
        if (sig.pattern.test(hay)) {
          found.push({ type: sig.type, severity: sig.severity, source, sample: hay.slice(0, 120) });
          return;
        }
      }
    };

    // URL path + query always (cheap, catches scanner/probe traffic).
    // Scan both raw and URL-decoded forms (`%27%20OR%201%3D1` must match too),
    // plus express-parsed query values which arrive already decoded.
    consider(req.originalUrl, 'url');
    try {
      consider(decodeURIComponent(req.originalUrl), 'url');
    } catch { /* malformed escape — raw form already scanned */ }
    if (req.query && typeof req.query === 'object') {
      for (const v of flattenBody(req.query)) consider(v, 'query');
    }

    // Bodies: JSON and urlencoded only. Multipart is skipped (binary framing;
    // file bytes never reach this middleware as text in meaningful volume).
    const ct = req.headers['content-type'] ?? '';
    if (req.body && typeof req.body === 'object' && !ct.includes('multipart')) {
      const flat = flattenBody(req.body);
      for (const v of flat) consider(v, 'body');
    }

    // A few headers commonly used for header-injection probes
    consider(req.headers['user-agent'] ?? '', 'header');
    consider(req.headers['referer'] ?? '', 'header');

    if (!found.length) return null;
    return found.slice(0, MAX_MATCHES);
  } catch {
    // The scanner must never break the request pipeline.
    return null;
  }
}

function flattenBody(value, out = [], depth = 0) {
  if (depth > 6 || out.length > 200) return out;
  if (value === null || value === undefined) return out;
  if (typeof value === 'string') {
    out.push(value);
  } else if (Array.isArray(value)) {
    for (const v of value) flattenBody(v, out, depth + 1);
  } else if (typeof value === 'object') {
    for (const v of Object.values(value)) flattenBody(v, out, depth + 1);
  }
  return out;
}
