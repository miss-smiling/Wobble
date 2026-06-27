import { doc, getDoc, runTransaction } from 'firebase/firestore';
import { db, USER_USAGE_COLLECTION } from '../firebase';
import { UserUsage } from '../types';

export const TASK_GENERATION_LIMIT = 30;
export const RESCUE_GENERATION_LIMIT = 10;

const GUEST_USAGE_KEY = 'deadline_rescue_usage';

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function emptyUsage(uid: string): UserUsage {
  return {
    uid,
    month: currentMonthKey(),
    taskGenerations: 0,
    rescueGenerations: 0,
  };
}

function getGuestUsage(): UserUsage {
  try {
    const raw = localStorage.getItem(GUEST_USAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as UserUsage;
      if (parsed.month === currentMonthKey()) return parsed;
    }
  } catch {
    // ignore
  }
  return emptyUsage('guest');
}

function saveGuestUsage(usage: UserUsage): void {
  localStorage.setItem(GUEST_USAGE_KEY, JSON.stringify(usage));
}

export async function getUserUsage(uid: string | null): Promise<UserUsage> {
  if (!uid) return getGuestUsage();

  const ref = doc(db, USER_USAGE_COLLECTION, uid);
  const snap = await getDoc(ref);
  const month = currentMonthKey();

  if (!snap.exists()) return emptyUsage(uid);

  const data = snap.data() as UserUsage;
  if (data.month !== month) return emptyUsage(uid);
  return data;
}

export function isTaskLimitReached(usage: UserUsage): boolean {
  return usage.taskGenerations >= TASK_GENERATION_LIMIT;
}

export function isRescueLimitReached(usage: UserUsage): boolean {
  return usage.rescueGenerations >= RESCUE_GENERATION_LIMIT;
}

/** Increment usage only after a successful Gemini call (not cache hits). */
export async function incrementTaskUsage(uid: string | null): Promise<void> {
  if (!uid) {
    const usage = getGuestUsage();
    saveGuestUsage({ ...usage, taskGenerations: usage.taskGenerations + 1 });
    return;
  }

  const ref = doc(db, USER_USAGE_COLLECTION, uid);
  const month = currentMonthKey();

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const base = snap.exists() ? (snap.data() as UserUsage) : emptyUsage(uid);
    const usage = base.month === month ? base : emptyUsage(uid);
    tx.set(ref, {
      ...usage,
      uid,
      month,
      taskGenerations: usage.taskGenerations + 1,
    });
  });
}

export async function incrementRescueUsage(uid: string | null): Promise<void> {
  if (!uid) {
    const usage = getGuestUsage();
    saveGuestUsage({ ...usage, rescueGenerations: usage.rescueGenerations + 1 });
    return;
  }

  const ref = doc(db, USER_USAGE_COLLECTION, uid);
  const month = currentMonthKey();

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const base = snap.exists() ? (snap.data() as UserUsage) : emptyUsage(uid);
    const usage = base.month === month ? base : emptyUsage(uid);
    tx.set(ref, {
      ...usage,
      uid,
      month,
      rescueGenerations: usage.rescueGenerations + 1,
    });
  });
}
