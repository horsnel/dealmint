// Deterministic referral codes (borrowed pattern from Postall):
// "EMEK-047" = first 4 alphanumerics of the name + a 3-digit hash of the full name.
// The code is stable for a given name, so it can be recomputed anywhere without storage.

export function referralCodeFor(name: string): string {
  const upper = (name || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const base = (upper.length >= 4 ? upper.slice(0, 4) : upper.padEnd(4, 'X'));
  const hash = (name || '').split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const suffix = String(hash % 1000).padStart(3, '0');
  return `${base}-${suffix}`;
}

export const REFERRAL_REWARD = 500;

export function isValidReferralCode(code: string): boolean {
  return /^[A-Z0-9]{4}-\d{3}$/.test(code.trim().toUpperCase());
}
