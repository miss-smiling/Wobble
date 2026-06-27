import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import type { FirebaseError } from 'firebase/app';
import { doc, getDoc, setDoc, collection, addDoc } from 'firebase/firestore';
import {
  auth,
  db,
  USERS_COLLECTION,
  LOGOUT_EVENTS_COLLECTION,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  googleProvider,
  signOut,
  initializeFirebaseApp,
} from '../firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signingIn: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfileTheme: (bg: 'forest' | 'rain' | 'library') => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signingIn: false,
  login: async () => {},
  logout: async () => {},
  updateProfileTheme: async () => {},
});

function buildProfileFromUser(currentUser: User, existing?: Partial<UserProfile>): UserProfile {
  const displayName = currentUser.displayName || existing?.displayName || 'Rescue Agent';
  return {
    uid: currentUser.uid,
    displayName,
    name: displayName,
    email: currentUser.email || existing?.email || '',
    photoURL: currentUser.photoURL || existing?.photoURL || '',
    theme: existing?.theme || 'warm',
    focusBackground: existing?.focusBackground || 'forest',
    createdAt: existing?.createdAt || Date.now(),
    lastLoginAt: existing?.lastLoginAt || Date.now(),
    ...(existing?.lastLogoutAt !== undefined ? { lastLogoutAt: existing.lastLogoutAt } : {}),
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [signingIn, setSigningIn] = useState<boolean>(false);

  const syncUserProfile = async (currentUser: User, isLoginEvent: boolean) => {
    const userRef = doc(db, USERS_COLLECTION, currentUser.uid);
    const userSnap = await getDoc(userRef);
    const now = Date.now();

    if (userSnap.exists()) {
      const existing = userSnap.data() as UserProfile;
      const updated: UserProfile = {
        ...buildProfileFromUser(currentUser, existing),
        lastLoginAt: isLoginEvent ? now : existing.lastLoginAt || now,
      };
      await setDoc(userRef, updated, { merge: true });
      setProfile(updated);
    } else {
      const newProfile: UserProfile = {
        ...buildProfileFromUser(currentUser),
        createdAt: now,
        lastLoginAt: now,
      };
      await setDoc(userRef, newProfile);
      setProfile(newProfile);
    }
  };

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    (async () => {
      await initializeFirebaseApp();
      if (cancelled) return;

      try {
        const redirectResult = await getRedirectResult(auth);
        if (!cancelled && redirectResult?.user) {
          await syncUserProfile(redirectResult.user, true);
        }
      } catch (error) {
        console.error('Redirect sign-in error:', error);
      }

      unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        setUser(currentUser);
        if (currentUser) {
          try {
            await syncUserProfile(currentUser, false);
          } catch (error) {
            console.error('Error fetching user profile:', error);
            setProfile(buildProfileFromUser(currentUser));
          }
        } else {
          setProfile(null);
        }
        setLoading(false);
      });
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const login = async () => {
    setSigningIn(true);
    try {
      await initializeFirebaseApp();
      const result = await signInWithPopup(auth, googleProvider);
      await syncUserProfile(result.user, true);
    } catch (error) {
      const code = (error as FirebaseError)?.code;
      console.error('Login error:', error);

      if (
        code === 'auth/popup-blocked' ||
        code === 'auth/cancelled-popup-request' ||
        code === 'auth/popup-closed-by-user'
      ) {
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (redirectError) {
          console.error('Redirect sign-in error:', redirectError);
        }
      }
    } finally {
      setSigningIn(false);
    }
  };

  const logout = async () => {
    const currentUser = auth.currentUser;
    try {
      if (currentUser) {
        const now = Date.now();
        const userRef = doc(db, USERS_COLLECTION, currentUser.uid);
        await setDoc(userRef, { lastLogoutAt: now }, { merge: true });
        await addDoc(collection(db, USERS_COLLECTION, currentUser.uid, LOGOUT_EVENTS_COLLECTION), {
          loggedOutAt: now,
        });
      }
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateProfileTheme = async (bg: 'forest' | 'rain' | 'library') => {
    if (!user || !profile) return;
    const updated = { ...profile, focusBackground: bg };
    setProfile(updated);
    try {
      const userRef = doc(db, USERS_COLLECTION, user.uid);
      await setDoc(userRef, updated, { merge: true });
    } catch (err) {
      console.error('Error updating theme:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signingIn, login, logout, updateProfileTheme }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
