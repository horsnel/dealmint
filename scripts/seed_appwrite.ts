// Dealmint -> Appwrite Cloud demo-data seeder (server-side, idempotent).
//
// Run with bun from the dealmint/ directory:
//   APPWRITE_API_KEY=... bun run scripts/seed_appwrite.ts
// or stage /tmp/ak + /tmp/aproj (+ optional /tmp/aendpoint) and run:
//   bun run scripts/seed_appwrite.ts
//
// - Uses the REAL client mappers + docPermissions from src/lib/sync.ts, so
//   seeded documents are byte-identical with what the sync engine pushes.
// - Seed ids survive as Appwrite document ids (u1, d1, o_seed_1, cv_s1_u1…).
// - Creates Auth accounts: demo (known password) + NPC sellers (random
//   passwords, so nobody can squat their emails).
// - The API key is only read from env/files and is NEVER printed.

import { buildSeedDB, DEMO_EMAIL, DEMO_PASSWORD } from '@/data/seed';
import {
  COL,
  convoDocId,
  convoPatchFromView,
  docPermissions,
  favDocId,
  listingToDoc,
  messageToDoc,
  msgDocId,
  npcToDoc,
  orderToDoc,
  userToDoc,
} from '@/lib/sync';
import type { StoredUser } from '@/data/seed';

// ---------- credentials (never printed) ----------
const KEY = process.env.APPWRITE_API_KEY || (await Bun.file('/tmp/ak').text().catch(() => '')).trim();
const PROJECT = process.env.APPWRITE_PROJECT_ID || (await Bun.file('/tmp/aproj').text().catch(() => '')).trim();
const ENDPOINT = (
  process.env.APPWRITE_ENDPOINT || (await Bun.file('/tmp/aendpoint').text().catch(() => '')) || 'https://fra.cloud.appwrite.io/v1'
).trim().replace(/\/$/, '');
if (!KEY || !PROJECT) {
  console.error('Missing APPWRITE_API_KEY / APPWRITE_PROJECT_ID (or /tmp/ak + /tmp/aproj)');
  process.exit(1);
}

// ---------- REST helpers ----------
async function aw(method: string, path: string, body?: unknown): Promise<{ status: number; json: any }> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(`${ENDPOINT}${path}`, {
      method,
      headers: {
        'X-Appwrite-Project': PROJECT,
        'X-Appwrite-Key': KEY,
        'Content-Type': 'application/json',
        'User-Agent': 'DealmintSeeder/1.0',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (res.status === 429 || res.status >= 500) {
      await new Promise((r) => setTimeout(r, 4000 * (attempt + 1)));
      continue;
    }
    let json: any = {};
    try {
      json = await res.json();
    } catch {
      /* empty body */
    }
    return { status: res.status, json };
  }
  return { status: -1, json: { message: 'unreachable after retries' } };
}

const isoNorm = (v: string | undefined): string => {
  if (!v) return '';
  return v.length === 10 ? `${v}T00:00:00.000Z` : v;
};

const stats = new Map<string, { created: number; updated: number; failed: number }>();
const bump = (col: string, kind: 'created' | 'updated' | 'failed') => {
  const s = stats.get(col) || { created: 0, updated: 0, failed: 0 };
  s[kind] += 1;
  stats.set(col, s);
};

/** Idempotent document upsert with explicit per-doc permissions + optional $createdAt. */
async function upsert(col: string, id: string, data: Record<string, unknown>, perms: string[], createdAt?: string) {
  const payloadBase = createdAt ? { ...data, $createdAt: createdAt } : { ...data };
  let res = await aw('POST', `/databases/dealmint/collections/${col}/documents`, {
    documentId: id,
    data: payloadBase,
    permissions: perms,
  });
  if (res.status === 400 && createdAt && String(res.json?.message || '').includes('$createdAt')) {
    res = await aw('POST', `/databases/dealmint/collections/${col}/documents`, {
      documentId: id,
      data,
      permissions: perms,
    });
  }
  if (res.status === 201) return bump(col, 'created');
  if (res.status === 409) {
    const upd = await aw('PATCH', `/databases/dealmint/collections/${col}/documents/${id}`, {
      data,
      permissions: perms,
    });
    if (upd.status >= 200 && upd.status < 300) return bump(col, 'updated');
    console.error(`  ! ${col}/${id}: update HTTP ${upd.status} ${JSON.stringify(upd.json).slice(0, 160)}`);
    return bump(col, 'failed');
  }
  console.error(`  ! ${col}/${id}: HTTP ${res.status} ${JSON.stringify(res.json).slice(0, 160)}`);
  bump(col, 'failed');
}

// ---------- main ----------
const db = buildSeedDB();
const ME = db.users[0].id; // demo user id (u1)

console.log(`Endpoint: ${ENDPOINT}`);
console.log(`Project:  ${PROJECT.slice(0, 6)}…${PROJECT.slice(-4)} (hidden)`);
console.log(`Seed:     ${db.listings.length} listings, ${db.orders.length} orders, ${db.conversations.length} conversations, ${db.reviews.length} reviews\n`);

// ---- 1. Auth accounts -------------------------------------------------------
console.log('== Auth accounts');
const randomPassword = () => {
  const buf = new Uint8Array(18);
  crypto.getRandomValues(buf);
  return Buffer.from(buf).toString('base64url') + '!Aa1';
};
const npcIds = new Set<string>();
for (const l of db.listings) {
  if (l.isDraft) continue;
  if (l.seller.id !== ME && !npcIds.has(l.seller.id)) npcIds.add(l.seller.id);
}
const authTargets: { id: string; email: string; name: string; password: string }[] = [
  { id: ME, email: DEMO_EMAIL, name: db.users[0].name, password: DEMO_PASSWORD },
  ...[...npcIds]
    .map((id) => db.listings.find((l) => l.seller.id === id)!.seller)
    .map((s) => ({ id: s.id, email: s.email, name: s.name, password: randomPassword() })),
];
for (const u of authTargets) {
  const res = await aw('POST', '/users', { userId: u.id, email: u.email, password: u.password, name: u.name });
  if (res.status === 201) console.log(`  + auth ${u.id} (${u.email})`);
  else if (res.status === 409) console.log(`  = auth ${u.id}: already exists`);
  else {
    console.error(`  ! auth ${u.id}: HTTP ${res.status} ${JSON.stringify(res.json).slice(0, 160)}`);
    process.exit(1);
  }
  await new Promise((r) => setTimeout(r, 150));
}

// ---- 2. users collection docs ----------------------------------------------
console.log('== users docs');
{
  const u = db.users[0] as StoredUser;
  await upsert(COL.users, u.id, userToDoc(u), docPermissions(COL.users, u, u.id), isoNorm(u.joinedAt));
}
for (const id of npcIds) {
  const seller = db.listings.find((l) => l.seller.id === id)!.seller;
  const npc: StoredUser = {
    ...seller,
    password: '',
    settings: { ...(seller.settings as StoredUser['settings']), npc: true } as StoredUser['settings'],
  };
  await upsert(COL.users, id, npcToDoc(npc), docPermissions(COL.users, npc, ME), isoNorm(seller.joinedAt));
  await new Promise((r) => setTimeout(r, 120));
}

// ---- 3. listings ------------------------------------------------------------
console.log('== listings');
for (const l of db.listings.filter((x) => !x.isDraft)) {
  await upsert(COL.listings, l.id, listingToDoc(l), docPermissions(COL.listings, l, ME), isoNorm(l.createdAt));
  await new Promise((r) => setTimeout(r, 120));
}

// ---- 4. favourites ----------------------------------------------------------
console.log('== favourites');
for (const [uid, lids] of Object.entries(db.favourites)) {
  for (const lid of lids) {
    await upsert(COL.favourites, favDocId(uid, lid), { userId: uid, listingId: lid }, docPermissions('owner', {}, uid));
  }
}

// ---- 5. orders + escrow -----------------------------------------------------
console.log('== orders + escrow');
for (const o of db.orders) {
  await upsert(COL.orders, o.id, orderToDoc(o), docPermissions(COL.orders, o, ME), isoNorm(o.createdAt));
}
for (const e of db.escrowLedger) {
  await upsert(COL.escrow, e.id, {
    orderId: e.orderId, listingTitle: e.listingTitle, amount: e.amount, buyerId: e.buyerId, sellerId: e.sellerId,
    status: e.status, fundedAt: e.fundedAt, autoReleaseAt: e.autoReleaseAt, releasedAt: e.releasedAt ?? '',
    commission: e.commission, payout: e.payout,
  }, docPermissions(COL.escrow, e, ME), isoNorm(e.fundedAt));
}

// ---- 6. transactions / payouts ---------------------------------------------
console.log('== transactions + payouts');
for (const t of db.transactions) {
  await upsert(COL.transactions, t.id, {
    userId: t.userId, type: t.type, amount: t.amount, status: t.status, description: t.description,
    reference: t.reference ?? '', orderId: t.orderId ?? '', fee: t.fee ?? 0,
  }, docPermissions('owner', t, t.userId), isoNorm(t.createdAt));
}
for (const p of db.payoutAccounts) {
  await upsert(COL.payoutAccounts, p.id, {
    userId: p.userId, kind: p.kind, bankName: p.bankName, accountNumber: p.accountNumber, accountName: p.accountName,
  }, docPermissions('owner', p, p.userId));
}

// ---- 7. reviews / notifications / saved / alerts / spots --------------------
console.log('== reviews, notifications, saved searches, price alerts, safe spots');
for (const r of db.reviews) {
  await upsert(COL.reviews, r.id, {
    listingId: r.listingId, sellerId: r.sellerId, orderId: r.orderId ?? '', reviewerId: r.reviewerId,
    reviewerName: r.reviewerName, reviewerAvatar: r.reviewerAvatar ?? '', rating: r.rating, comment: r.comment,
    reply: r.reply ?? '',
  }, docPermissions(COL.reviews, r, r.reviewerId), isoNorm(r.createdAt));
  await new Promise((r2) => setTimeout(r2, 100));
}
for (const nt of db.notifications) {
  await upsert(COL.notifications, nt.id, {
    userId: nt.userId, type: nt.type, title: nt.title, message: nt.message, isRead: !!nt.isRead, link: nt.link ?? '',
  }, docPermissions(COL.notifications, nt, nt.userId), isoNorm(nt.createdAt));
}
for (const sv of db.savedSearches) {
  await upsert(COL.savedSearches, sv.id, {
    userId: sv.userId, label: sv.label, query: sv.query ?? '', type: sv.type ?? 'all', category: sv.category ?? 'all',
    where: sv.where ?? 'all', price: sv.price ?? 'all', frequency: sv.frequency, baseline: sv.baseline ?? -1,
    active: !!sv.active,
  }, docPermissions('owner', sv, sv.userId), isoNorm(sv.createdAt));
}
for (const a of db.priceAlerts) {
  await upsert(COL.priceAlerts, a.id, {
    userId: a.userId, listingId: a.listingId, listingTitle: a.listingTitle, targetPrice: a.targetPrice,
    startPrice: a.startPrice, active: !!a.active, triggered: !!a.triggered,
  }, docPermissions('owner', a, a.userId), isoNorm(a.createdAt));
}
for (const sp of db.safeSpots) {
  await upsert(COL.safeSpots, sp.id, {
    name: sp.name, type: sp.type, address: sp.address, city: sp.city, lat: sp.lat ?? 0, lng: sp.lng ?? 0,
    isApproved: !!sp.isApproved, submittedById: sp.submittedById ?? '',
  }, docPermissions(COL.safeSpots, sp, ME), isoNorm(sp.createdAt));
}

// ---- 8. conversations + messages (canonical pair docs) ----------------------
console.log('== conversations + messages');
for (const c of db.conversations) {
  const convId = convoDocId(c.userId, c.otherId);
  const startedAt = c.messages[0]?.createdAt;
  await upsert(COL.conversations, convId, convoPatchFromView(c, null), docPermissions(COL.conversations, c, c.userId), isoNorm(startedAt));
  for (const m of c.messages) {
    await upsert(
      COL.messages,
      msgDocId(convId, m.id),
      messageToDoc(convId, m),
      docPermissions(COL.messages, { senderId: m.senderId, participants: [c.userId, c.otherId] }, c.userId),
      isoNorm(m.createdAt),
    );
    await new Promise((r) => setTimeout(r, 100));
  }
}

// ---- 9. verification --------------------------------------------------------
console.log('\n== Verification (server-side counts)');
const COLS = Object.values(COL);
let total = 0;
for (const col of COLS) {
  const res = await aw('GET', `/databases/dealmint/collections/${col}/documents?queries[]=${encodeURIComponent('limit(1)')}`);
  const n = res.status === 200 ? res.json.total : -1;
  total += Math.max(n, 0);
  console.log(`  ${col.padEnd(18)} ${n}`);
}
console.log(`\nTotal documents: ${total}`);
console.log('\nPer-collection write stats:');
for (const [col, s] of stats) console.log(`  ${col.padEnd(18)} created=${s.created} updated=${s.updated} failed=${s.failed}`);
const failed = [...stats.values()].reduce((a, s) => a + s.failed, 0);
process.exit(failed ? 1 : 0);
