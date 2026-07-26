import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Verifica sessão ativa inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 2. Escuta mudanças no estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      // Se um novo usuário logou, garante o registro dele na tabela customizada 'usuarios'
      if (currentUser) {
        try {
          const { data: existingUser } = await supabase
            .from('usuarios')
            .select('id_usuario')
            .eq('id_usuario', currentUser.id)
            .maybeSingle();

          if (!existingUser) {
            const name = currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'Usuário';
            await supabase.from('usuarios').insert({
              id_usuario: currentUser.id,
              nm_usuario: name,
              email: currentUser.email || '',
            });
          }
        } catch (error) {
          console.error('Erro ao sincronizar usuário na tabela customizada:', error);
        }
      }
      
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
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
