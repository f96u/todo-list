'use client';

import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import {
  signInAnonymously,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  linkWithPopup,
  signInWithCredential,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../firebase/config';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

async function syncGoogleProfile(user: User): Promise<void> {
  const googleData = user.providerData.find(p => p.providerId === 'google.com');
  if (!googleData) return;
  if (!user.displayName || !user.photoURL) {
    await updateProfile(user, {
      displayName: user.displayName || googleData.displayName || undefined,
      photoURL: user.photoURL || googleData.photoURL || undefined,
    });
  }
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setLoading(false);
      } else {
        try {
          const userCredential = await signInAnonymously(auth);
          setUser(userCredential.user);
        } catch (error) {
          console.error('Error signing in anonymously:', error);
        } finally {
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();

    if (user && user.isAnonymous) {
      try {
        const result = await linkWithPopup(user, provider);
        await syncGoogleProfile(result.user);
        setUser(result.user);
      } catch (error: unknown) {
        const code = error && typeof error === 'object' && 'code' in error
          ? (error as { code: string }).code
          : '';
        if (code === 'auth/credential-already-in-use' || code === 'auth/email-already-in-use') {
          const credential = GoogleAuthProvider.credentialFromError(error as Parameters<typeof GoogleAuthProvider.credentialFromError>[0]);
          if (credential) {
            const result = await signInWithCredential(auth, credential);
            await syncGoogleProfile(result.user);
            setUser(result.user);
          }
        } else {
          throw error;
        }
      }
    } else {
      const result = await signInWithPopup(auth, provider);
      await syncGoogleProfile(result.user);
      setUser(result.user);
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
