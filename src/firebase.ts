import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getAuth as createAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  Auth,
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { firebaseConfig, FirebaseClientConfig, isPlaceholder } from './firebaseConfig';

export let auth: Auth;
export let db: Firestore;

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { googleProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut };

export const TASKS_COLLECTION = 'tasks';
export const USERS_COLLECTION = 'users';
export const USER_USAGE_COLLECTION = 'userUsage';
export const PLAN_CACHE_COLLECTION = 'planCache';
export const LOGOUT_EVENTS_COLLECTION = 'logoutEvents';

let initPromise: Promise<void> | null = null;

async function fetchServerConfig(): Promise<Partial<FirebaseClientConfig> | null> {
  try {
    const res = await fetch('/api/config/firebase');
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.apiKey && !isPlaceholder(data.apiKey)) return data;
  } catch {
    // ignore
  }
  return null;
}

function mergeConfig(base: FirebaseClientConfig, remote?: Partial<FirebaseClientConfig> | null): FirebaseClientConfig {
  if (!remote) return base;
  return {
    ...base,
    ...remote,
    firestoreDatabaseId: isPlaceholder(remote.firestoreDatabaseId)
      ? base.firestoreDatabaseId
      : remote.firestoreDatabaseId,
  };
}

export function initializeFirebaseApp(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      const remote = await fetchServerConfig();
      const config = mergeConfig(firebaseConfig, remote);
      const app: FirebaseApp = initializeApp(config);
      auth = createAuth(app);
      db =
        config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)'
          ? getFirestore(app, config.firestoreDatabaseId)
          : getFirestore(app);
    })();
  }
  return initPromise;
}
