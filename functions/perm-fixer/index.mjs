// Dealmint perm-fixer — completes multi-party document permissions.
//
// Sessions may only grant permissions to themselves, so the client creates
// multi-party docs (messages, orders, conversations, escrow, reviews,
// notifications) with creator-side perms only. This function, triggered on
// document create, applies the full permission set using the server-side key.
//
// Idempotent: recomputes and PATCHes the canonical permission set every time.

const ENDPOINT = process.env.AW_ENDPOINT || process.env.APPWRITE_FUNCTION_API_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const PROJECT = process.env.AW_PROJECT_ID || process.env.APPWRITE_FUNCTION_PROJECT_ID;
const KEY = process.env.AW_API_KEY;

const COLLECTIONS = ['conversations', 'messages', 'orders', 'escrow_ledger', 'reviews', 'notifications'];

const perm = (action, role) => `${action}("${role}")`;
const read = (r) => perm('read', r);
const update = (r) => perm('update', r);
const del = (r) => perm('delete', r);

async function aw(method, path, body) {
  const r = await fetch(`${ENDPOINT}${path}`, {
    method,
    headers: {
      'X-Appwrite-Project': PROJECT,
      'X-Appwrite-Key': KEY,
      'Content-Type': 'application/json',
      'User-Agent': 'DealmintPermFixer/1.0',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await r.text();
  let json = {};
  try {
    json = JSON.parse(text);
  } catch {}
  return { status: r.status, json };
}

/** Canonical permissions per collection. */
function targetPerms(col, doc) {
  switch (col) {
    case 'conversations': {
      const a = String(doc.userA || '');
      const b = String(doc.userB || '');
      if (!a || !b) return null;
      return [
        read(`user:${a}`), read(`user:${b}`),
        update(`user:${a}`), update(`user:${b}`),
        del(`user:${a}`), del(`user:${b}`),
      ];
    }
    case 'messages': {
      const sender = String(doc.senderId || '');
      if (!sender) return null;
      // participants come from the doc id (cv_A_B, canonical sorted pair)
      const parts = String(doc.conversationId || '').replace(/^cv_/, '').split('_');
      const a = parts[0];
      const b = parts[1];
      if (!a || !b) return null;
      const out = [read(`user:${a}`), read(`user:${b}`), update(`user:${sender}`), del(`user:${sender}`)];
      if (sender !== a && sender !== b) out.push(read(`user:${sender}`));
      return out;
    }
    case 'orders':
    case 'escrow_ledger': {
      const buyer = String(doc.buyerId || '');
      const seller = String(doc.sellerId || '');
      if (!buyer || !seller) return null;
      const users = [...new Set([buyer, seller])];
      const out = [];
      for (const u of users) out.push(read(`user:${u}`), update(`user:${u}`), del(`user:${u}`));
      return out;
    }
    case 'reviews': {
      const reviewer = String(doc.reviewerId || '');
      const seller = String(doc.sellerId || '');
      if (!reviewer || !seller) return null;
      const out = [read('any'), update(`user:${reviewer}`)];
      if (seller !== reviewer) out.push(update(`user:${seller}`));
      return out;
    }
    case 'notifications': {
      const userId = String(doc.userId || '');
      if (!userId) return null;
      return [read(`user:${userId}`), update(`user:${userId}`), del(`user:${userId}`)];
    }
    default:
      return null;
  }
}

export default async ({ req, res, log, error }) => {
  try {
    if (!KEY) {
      error('AW_API_KEY variable missing');
      return res.json({ ok: false, reason: 'no-key' });
    }
    const event = (req.headers['x-appwrite-event'] || '') + '';
    // events: databases.<db>.collections.<col>.documents.<docId>.create|update
    const m = event.match(/databases\.([^.]+)\.collections\.([^.]+)\.documents\.[^.]+\.(create|update)$/);
    if (!m) return res.json({ ok: true, skipped: 'not-a-managed-event' });
    const dbId = m[1];
    const col = m[2];
    if (!COLLECTIONS.includes(col)) return res.json({ ok: true, skipped: 'collection-not-managed' });

    const raw = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const doc = raw.documents ? raw.documents[0] : raw;
    const docId = doc.$id || doc.id;
    if (!docId) {
      error(`no document id in event body for ${col}`);
      return res.json({ ok: false, reason: 'no-doc-id' });
    }

    const perms = targetPerms(col, doc);
    if (!perms || perms.length === 0) {
      log(`perm-fixer: no perms derived for ${col}/${docId}`);
      return res.json({ ok: true, skipped: 'no-perms-derived' });
    }

    // self-heal guard: skip the write when the doc already carries the
    // canonical set (update events fire on every content change)
    const current = Array.isArray(doc.$permissions) ? doc.$permissions : [];
    if (current.length === perms.length && [...perms].sort().join('|') === [...current].sort().join('|')) {
      return res.json({ ok: true, col, docId, skipped: 'perms-current' });
    }

    const r = await aw('PATCH', `/databases/${dbId}/collections/${col}/documents/${docId}`, {
      data: {},
      permissions: perms,
    });
    if (r.status >= 200 && r.status < 300) {
      log(`perm-fixer: ${col}/${docId} -> ${perms.length} perms`);
      return res.json({ ok: true, col, docId, perms: perms.length });
    }
    error(`perm-fixer: PATCH ${col}/${docId} HTTP ${r.status} ${JSON.stringify(r.json).slice(0, 200)}`);
    return res.json({ ok: false, status: r.status });
  } catch (e) {
    error(`perm-fixer crashed: ${e && e.message}`);
    return res.json({ ok: false, crash: String(e && e.message) });
  }
};
