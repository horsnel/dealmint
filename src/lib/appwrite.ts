// Appwrite Cloud client.
//
// The browser bundle only ever contains the PUBLIC project id + endpoint —
// exactly like a Firebase config. The provisioning API key lives server-side
// only (scripts/provision_appwrite.py) and must never be imported here.
import { Account, Client, Databases, ID, Permission, Query, Role, Storage } from 'appwrite';

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT as string | undefined;
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID as string | undefined;

export const AW_DB = 'dealmint';
export const AW_BUCKET = 'media';

export const cloudConfigured = Boolean(endpoint && projectId);

export const client = cloudConfigured
  ? new Client().setEndpoint(endpoint!).setProject(projectId!)
  : null;

export const account = client ? new Account(client) : null;
export const databases = client ? new Databases(client) : null;
export const storage = client ? new Storage(client) : null;

export { ID, Permission, Query, Role };

/**
 * Probe whether the cloud backend is usable:
 *  - 'active'        → reachable and provisioned (or at least reachable)
 *  - 'unprovisioned' → valid project but the Dealmint database does not exist
 *                      yet (setup script has not run — stay in local mode)
 *  - 'down'          → unreachable / misconfigured (stay in local mode)
 */
export async function probeCloud(): Promise<'active' | 'unprovisioned' | 'down'> {
  if (!databases) return 'down';
  try {
    // cheap reachability probe: list one listing (public collection)
    await databases.listDocuments(AW_DB, 'listings', [Query.limit(1)]);
    return 'active';
  } catch (e: unknown) {
    const err = e as { code?: number; type?: string };
    if (err?.type === 'database_not_found' || err?.type === 'collection_not_found') return 'unprovisioned';
    if (err?.type === 'project_not_found') return 'down';
    // 401 general_unauthorized_scope → backend alive, we are just a guest
    if (err?.code === 401) return 'active';
    return 'down';
  }
}

// ---------- storage (avatars + listing photos) ----------
// Uploads need an authenticated user (bucket create("users")), so the provider
// flips this flag once a real session is verified.
let storageAuthed = false;
export const setStorageAuthed = (v: boolean) => {
  storageAuthed = v;
};
export const isStorageAuthed = () => storageAuthed;

/** Upload an image blob to the public-read media bucket; returns its URL. */
export async function uploadToStorage(blob: Blob, name: string): Promise<string | null> {
  if (!storage || !storageAuthed) return null;
  try {
    const file = new File([blob], name, { type: blob.type || 'image/jpeg' });
    const created = await storage.createFile(AW_BUCKET, ID.unique(), file);
    return storage.getFilePreview(AW_BUCKET, created.$id).toString();
  } catch {
    return null;
  }
}

/** Map raw Appwrite errors to human sentences used across auth forms. */
export function authErrorMessage(e: unknown): string {
  const err = e as { type?: string; message?: string };
  switch (err?.type) {
    case 'user_invalid_credentials':
      return 'Incorrect email or password. Please try again.';
    case 'user_already_exists':
      return 'An account with this email already exists. Try signing in instead.';
    case 'user_password_needs_admin':
    case 'user_password_personal_data':
      return 'Choose a stronger password that does not contain your email or name.';
    case 'general_rate_limit_exceeded':
      return 'Too many attempts. Wait a moment and try again.';
    case 'user_session_not_found':
      return 'Your session expired. Please sign in again.';
    case 'user_invalid_token':
    case 'user_verification_token_invalid':
      return 'This link is invalid or has expired. Sign in and request a fresh one.';
    default:
      if (err?.message?.includes('password')) return 'Password does not meet the requirements.';
      return err?.message || 'Something went wrong. Please try again.';
  }
}
