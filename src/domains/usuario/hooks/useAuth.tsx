import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { auth } from '@/shared/services/firebase';
import { User } from 'firebase/auth';
import { signInWithGoogle, signOut as signOutService } from '../services/authService';

interface SignInResult {
  isNewUser: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: () => Promise<SignInResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(currentUser => {
      setUser(currentUser);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signIn = async (): Promise<SignInResult> => {
    try {
      const { isNewUser } = await signInWithGoogle();
      return { isNewUser };
    } catch (error) {
      console.error("Falha no login:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await signOutService();
      // A navegação será tratada no componente que chama o signOut
    } catch (error) {
      console.error("Falha no logout:", error);
      throw error;
    }
  };

  const value = { user, isLoading, signIn, signOut };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
