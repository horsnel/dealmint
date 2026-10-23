# Dealmint

Nigeria's marketplace for gigs, tasks, remote jobs, services and digital products.
Built with Vite, React 19, TypeScript, Tailwind and shadcn/ui.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

## Demo account

Sign in with `demo@dealmint.ng` / `Demo1234`, or create your own account.
Phone verification shows its code in a toast (no SMS is sent). Password reset does the same.

## How the data works right now

There is no backend. `src/context/AppContext.tsx` is a single store that keeps users, listings,
orders, messages, wallet, reviews and notifications in `localStorage` (key `dealmint_db_v1`), so every flow
works end to end in the browser and survives a refresh. Seed data lives in `src/data/seed.ts`.

When a real API exists, replace the functions in `AppContext.tsx` with API calls and keep the same
shape. Pages only talk to `useApp()`.

Things that are simulated on purpose:

- Payments, deposits and withdrawals (no money moves). Escrow, fees and balances are real in the store.
- OTP codes and ID verification (shown in a toast / auto-approved after a few seconds).
- Seller replies from the seeded demo sellers, and the "Demo: simulate seller" button on orders.
- Digital product files (only the file name and size are kept, the download is a licence stub).
- Google and Apple sign in (they need a backend).

## Structure

```
src/context      store (auth, listings, orders, messages, wallet, reviews, notifications)
src/data         mock data and seed
src/lib          formatting, validation, image compression, category matching
src/components   common/ (cards, stars, empty states), forms/ (listing form), layout/, ui/ (shadcn)
src/pages        public pages, auth/, dashboard/, post/
```
