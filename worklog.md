# Dealmint Work Log

## Task 13 — Postall-inspired feature pack (all tiers, AI on hold)
Date: 2026-10-29

Source analysis: horsnel/Postall (Next.js + Supabase marketplace) was cloned and
audited for stealable features and architecture. Everything below was rebuilt in
Dealmint's own design language (violet-600 #5B3AA8, chevron/soft-X controls,
mobile-first) on the existing localStorage AppContext. AI features were
deliberately excluded (cost).

### Tier 1
1. **Escrow ledger (Postall escrow route pattern)** — `EscrowRecord` per order
   (funded → released / refunded / disputed) with `autoReleaseAt` (+7 days),
   commission + payout math. Order transitions keep the ledger in sync
   (createOrder funds, completeOrder releases, decline/cancel refunds, dispute
   flags, withdrawDispute re-funds). Wallet page gets an "Escrow ledger" card.
2. **Escrow-gated chat lock (Postall ChatLock)** — message requests about
   task/gig listings lock the composer for the listing owner until the other
   side places an order; "Reply anyway" waives the lock per conversation
   (`escrowChatUnlocked`). The requester sees an amber "Faster replies with
   escrow" nudge instead of a hard lock. Seeded two-way chats are unaffected.
3. **WhatsApp share** — `WhatsAppButton` deep link with title + price on the
   listing detail page (Save / Share / WhatsApp / Report row, flex-wrap so it
   never overflows at 320px).
4. **Verification badges (Postall verification-badges)** — Verified / ID
   Checked / Top Performer / Quick Responder icon chips + composite
   `UserBadgeRow` derived from account flags, rating ≥ 4.5 (≥5 reviews) and the
   live responsiveness metric. Wired into seller profile header, listing
   About tab and the listing trust bar.
5. **Saved searches + target price alerts (Postall saved-searches/deals)** —
   "Save this search" on Browse; dashboard page lists searches (new-match
   counters vs baseline, run/pause/delete) and price alerts (target vs current
   price, "Target reached" state, remove). Editing a listing's price fires
   "Price alert triggered" notifications when it hits a target.

### Tier 2
6. **Paystack pattern (mock mode)** — full-screen `PaystackModal` checkout
   (test card pre-filled, Test-mode badge, processing → success states,
   always-succeeds demo). Wallet deposit routes through it; the deposit dialog
   closes first so the checkout owns the screen (fixes Radix focus trap).
   Swapping in real payments later = call initialize + open authorization_url.
7. **Safe Spots** — `/safe-spots` public page: seeded police stations, malls,
   banks, restaurants, libraries across Lagos/Abuja/PH/Ibadan; city chips;
   community submission dialog → pending state → simulated approval after 6s
   with a safety notification. Linked from the header nav, Safety Center CTA
   and footer.
8. **Referral program (Postall referrals)** — deterministic code from the
   username (`DEMO-836` style), WhatsApp/copy sharing, invite-by-email,
   stats cards, history with invited/joined/rewarded states. ₦500 lands in the
   referrer's wallet (with transaction + notification) when the invitee
   completes their first order. Register form gained a referral code field
   (accepts ?ref= deep links).
9. **Order timeline polish (Postall StatusTimeline)** — ping animation on the
   current escrow step, green "Done" chips on completed steps, auto-release
   date line, fee-rate % on the payment card, token-secured digital downloads
   with download counter.

### Tier 3
10. **Typed wallet transactions** — `escrow_fund`, `platform_fee` (ledger adds
    up to the net), `referral_bonus`; Wallet tabs regrouped accordingly.
11. **Paid listing boosts (Postall paidListingCategories)** — Featured ₦2,000 /
    Urgent ₦1,500 selector on new post forms; fee deducted from the wallet with
    a payment record; red "Urgent" badge added to ListingCard alongside
    Featured (wrap-safe badge row).
12. **Digital download tokens** — orders get `downloadToken` + `downloads`
    counter; the download includes the token and records each download.
13. **Magic link sign-in (Postall magic-link-modal)** — dialog with email,
    simulated send, "Check your inbox" state, 60s resend countdown and a
    "use demo account instead" shortcut.
14. **99+ unread badge cap** in the header (was 9+).

### DB migration
`DB_VERSION` 1 → 2 with `migrateDB()` — existing localStorage data is kept;
new collections (escrowLedger, savedSearches, priceAlerts, safeSpots,
referrals) are filled with defaults/seed. Demo account seeds two saved
searches and one price alert.

### Verification
- `tsc --noEmit` clean; production build clean.
- 29-route overflow sweep at 390×844: zero horizontal overflow everywhere.
- Interactive checks: magic link flow (send → inbox → resend countdown),
  Paystack deposit (₦2,000 credited), price alert creation, save-search →
  saved-searches page, ChatLock on injected task request + waive persistence,
  requester nudge, order stepper Done chips + auto-release line, boost
  selector on /post/gig, Safe Spots filters (light + dark).
- Demo user theme restored to light after dark-mode testing.

### Deploy
- Commit on this branch; push to GitHub main (triggers Vercel).
- Cloudflare Pages: `wrangler pages deploy dist --project-name=dealmint`.
