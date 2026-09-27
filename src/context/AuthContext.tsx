import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { authService } from '../services/authService';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  user_metadata?: {
    name?: string;
  };
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('focusflow_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          id: parsed.id,
          name: parsed.name,
          email: parsed.email,
          user_metadata: { name: parsed.name },
        };
      } catch {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('focusflow_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    // Valida o token chamando o backend /auth/me
    authService.getMe()
      .then((me) => {
        const authUser: AuthUser = {
          id: me.idUsuario,
          name: me.nome,
          email: me.email,
          user_metadata: { name: me.nome },
        };
        setUser(authUser);
        localStorage.setItem('focusflow_user', JSON.stringify({
          id: me.idUsuario,
          name: me.nome,
          email: me.email,
        }));
      })
      .catch(() => {
        authService.logout();
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });

    const handleLogoutEvent = () => {
      setUser(null);
    };

    window.addEventListener('focusflow_logout', handleLogoutEvent);
    return () => {
      window.removeEventListener('focusflow_logout', handleLogoutEvent);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await authService.login(email, password);
      const authUser: AuthUser = {
        id: res.idUsuario,
        name: res.nome,
        email: res.email,
        user_metadata: { name: res.nome },
      };
      setUser(authUser);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const res = await authService.register(name, email, password);
      const authUser: AuthUser = {
        id: res.idUsuario,
        name: res.nome,
        email: res.email,
        user_metadata: { name: res.nome },
      };
      setUser(authUser);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
}