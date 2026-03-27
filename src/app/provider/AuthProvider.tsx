'use client';

import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { signInAnonymously, onAuthStateChanged, User, GoogleAuthProvider, linkWithPopup, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebase/config';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
});

export const useAuth = () => useContext(AuthContext);

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
        // 未認証の場合は匿名認証を実行
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
    try {
      if (user?.isAnonymous) {
        // 匿名ユーザーのデータを引き継いでGoogleアカウントにリンク
        const result = await linkWithPopup(user, provider);
        setUser(result.user);
      } else {
        const result = await signInWithPopup(auth, provider);
        setUser(result.user);
      }
    } catch (error: unknown) {
      // すでにGoogleアカウントが存在する場合はサインインにフォールバック
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error.code === 'auth/credential-already-in-use' ||
          error.code === 'auth/email-already-in-use')
      ) {
        const result = await signInWithPopup(auth, provider);
        setUser(result.user);
      } else {
        console.error('Error signing in with Google:', error);
        throw error;
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
}

