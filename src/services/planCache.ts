import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, PLAN_CACHE_COLLECTION } from '../firebase';
import { CachedPlan, PlanCacheType } from '../types';
import { hashInput, normalizeInput } from '../utils/inputHash';

const GUEST_CACHE_PREFIX = 'deadline_rescue_plan_cache_';

function guestCacheKey(type: PlanCacheType, input: string): string {
  return `${GUEST_CACHE_PREFIX}${type}_${hashInput(input)}`;
}

function cacheDocId(uid: string, type: PlanCacheType, input: string): string {
  return `${uid}_${type}_${hashInput(input)}`;
}

export async function getCachedPlan<T>(
  uid: string | null,
  type: PlanCacheType,
  input: string
): Promise<T | null> {
  const normalized = normalizeInput(input);
  if (!normalized) return null;

  if (!uid) {
    try {
      const raw = localStorage.getItem(guestCacheKey(type, normalized));
      if (raw) return JSON.parse(raw) as T;
    } catch {
      // ignore
    }
    return null;
  }

  const ref = doc(db, PLAN_CACHE_COLLECTION, cacheDocId(uid, type, normalized));
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  const data = snap.data() as CachedPlan<T>;
  if (normalizeInput(data.input) !== normalized) return null;
  return data.result;
}

export async function saveCachedPlan<T>(
  uid: string | null,
  type: PlanCacheType,
  input: string,
  result: T
): Promise<void> {
  const normalized = normalizeInput(input);
  if (!normalized) return;

  if (!uid) {
    localStorage.setItem(guestCacheKey(type, normalized), JSON.stringify(result));
    return;
  }

  const entry: CachedPlan<T> = {
    uid,
    type,
    input: normalized,
    result,
    createdAt: Date.now(),
  };

  await setDoc(doc(db, PLAN_CACHE_COLLECTION, cacheDocId(uid, type, normalized)), entry);
}
