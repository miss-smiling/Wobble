import jsonConfig from '../firebase-applet-config.json';

export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
  firestoreDatabaseId?: string;
}

const PLACEHOLDER_MARKERS = ['remixed-', 'MY_APP_URL', 'your-'];

function env(key: string): string | undefined {
  const value = import.meta.env[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function isPlaceholder(value: string | undefined): boolean {
  if (!value) return true;
  const lower = value.toLowerCase();
  return PLACEHOLDER_MARKERS.some((marker) => lower.includes(marker));
}

function resolveConfig(): FirebaseClientConfig {
  const fromEnv: FirebaseClientConfig = {
    apiKey: env('VITE_FIREBASE_API_KEY') || '',
    authDomain: env('VITE_FIREBASE_AUTH_DOMAIN') || '',
    projectId: env('VITE_FIREBASE_PROJECT_ID') || '',
    storageBucket: env('VITE_FIREBASE_STORAGE_BUCKET') || '',
    messagingSenderId: env('VITE_FIREBASE_MESSAGING_SENDER_ID') || '',
    appId: env('VITE_FIREBASE_APP_ID') || '',
    measurementId: env('VITE_FIREBASE_MEASUREMENT_ID'),
    firestoreDatabaseId: env('VITE_FIREBASE_FIRESTORE_DATABASE_ID'),
  };

  const hasEnvConfig = !isPlaceholder(fromEnv.apiKey) && !isPlaceholder(fromEnv.projectId);

  if (hasEnvConfig) {
    return {
      ...fromEnv,
      firestoreDatabaseId: isPlaceholder(fromEnv.firestoreDatabaseId)
        ? '(default)'
        : fromEnv.firestoreDatabaseId,
    };
  }

  const json = jsonConfig as FirebaseClientConfig;
  return {
    ...json,
    firestoreDatabaseId: isPlaceholder(json.firestoreDatabaseId)
      ? '(default)'
      : json.firestoreDatabaseId,
  };
}

export const firebaseConfig = resolveConfig();

export function isFirebaseConfigured(): boolean {
  return (
    !isPlaceholder(firebaseConfig.apiKey) &&
    !isPlaceholder(firebaseConfig.authDomain) &&
    !isPlaceholder(firebaseConfig.projectId) &&
    !isPlaceholder(firebaseConfig.appId)
  );
}

export function getFirebaseSetupMessage(): string | null {
  if (isFirebaseConfigured()) return null;
  return 'Firebase is not configured. Add your project credentials to .env (see .env.example), then restart the dev server.';
}
