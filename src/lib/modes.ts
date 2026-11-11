import {
  Bike,
  Briefcase,
  Hammer,
  Search,
  Store,
  type LucideIcon,
} from 'lucide-react';
import type { ProviderMode, User } from '@/types';

/**
 * Provider "modes" — what the user does on Dealmint.
 *
 * Deliberately NOT identities: one account, many hats. Modes are a
 * personalization preference (dashboard widgets, quick actions, future
 * vertical config), switchable anytime from Settings. Everyone can always
 * buy, sell and hire regardless of what is selected here — nothing gates.
 *
 * Stored on the user document inside the `settings` JSON blob (a string
 * attribute Appwrite already has) so no schema migration is needed; can be
 * promoted to a first-class array attribute later if it earns it.
 */

export interface ModeMeta {
  id: ProviderMode;
  label: string;
  description: string;
  icon: LucideIcon;
  // tint for the icon bubble on onboarding cards / dashboard chips
  bubble: string; // light mode bg + icon color
  bubbleDark: string;
}

export const MODES: ModeMeta[] = [
  {
    id: 'tasker',
    label: 'Tasker',
    description: 'Pick up quick tasks and odd jobs',
    icon: Hammer,
    bubble: 'bg-violet-100 text-violet-600',
    bubbleDark: 'dark:bg-violet-700 dark:text-amber-400',
  },
  {
    id: 'errand',
    label: 'Errand runner',
    description: 'Run errands like shopping and deliveries',
    icon: Bike,
    bubble: 'bg-amber-100 text-amber-600',
    bubbleDark: 'dark:bg-amber-500/20 dark:text-amber-400',
  },
  {
    id: 'freelancer',
    label: 'Freelancer',
    description: 'Offer professional services and gigs',
    icon: Briefcase,
    bubble: 'bg-sky-100 text-sky-600',
    bubbleDark: 'dark:bg-sky-500/20 dark:text-sky-400',
  },
  {
    id: 'seller',
    label: 'Seller',
    description: 'Sell items, services or digital products',
    icon: Store,
    bubble: 'bg-emerald-100 text-emerald-600',
    bubbleDark: 'dark:bg-emerald-500/20 dark:text-emerald-400',
  },
  {
    id: 'hire',
    label: 'Hire help',
    description: 'Find and pay people to get things done',
    icon: Search,
    bubble: 'bg-rose-100 text-rose-600',
    bubbleDark: 'dark:bg-rose-500/20 dark:text-rose-400',
  },
];

const MODE_BY_ID = new Map(MODES.map((m) => [m.id, m]));

export const modeMeta = (id: ProviderMode): ModeMeta | undefined => MODE_BY_ID.get(id);

export const modeLabel = (id: ProviderMode): string => MODE_BY_ID.get(id)?.label ?? id;

/** Modes of a user, normalized to valid ids in canonical order. */
export function modesOf(user: Pick<User, 'settings'> | null | undefined): ProviderMode[] {
  const raw = user?.settings?.modes;
  if (!Array.isArray(raw)) return [];
  const set = new Set(raw);
  return MODES.filter((m) => set.has(m.id)).map((m) => m.id);
}

// ---------- staged intents (role-selection -> register, incl. OAuth/magic) ----------

const INTENTS_KEY = 'dealmint_selected_intents';

/** Persist onboarding picks so the register step (any flow) can adopt them. */
export function stageIntents(modes: ProviderMode[]) {
  try {
    if (modes.length) localStorage.setItem(INTENTS_KEY, JSON.stringify(modes));
    else localStorage.removeItem(INTENTS_KEY);
  } catch {
    // storage unavailable — modes are optional, never block on it
  }
}

export function peekStagedIntents(): ProviderMode[] {
  try {
    const raw = localStorage.getItem(INTENTS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return [];
    const set = new Set(arr);
    return MODES.filter((m) => set.has(m.id)).map((m) => m.id);
  } catch {
    return [];
  }
}

/** Read and clear the staged picks (call once, at account creation). */
export function takeStagedIntents(): ProviderMode[] {
  const picks = peekStagedIntents();
  if (picks.length) {
    try {
      localStorage.removeItem(INTENTS_KEY);
    } catch {
      // ignore
    }
  }
  return picks;
}
