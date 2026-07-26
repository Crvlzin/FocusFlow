import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useStudyMetrics } from '../hooks/useStudyMetrics';
import { supabase } from '../config/supabase';

interface SettingsScreenProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

// Auxiliar para obter a data local formatada como YYYY-MM-DD
function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Algoritmo de cálculo de ofensiva (Streak de dias consecutivos)
function calculateStreak(metricsList: Array<{ date: string }>): number {
  if (!metricsList || metricsList.length === 0) return 0;
  
  const uniqueDates = Array.from(new Set(metricsList.map(m => m.date)))
    .sort((a, b) => b.localeCompare(a));

  if (uniqueDates.length === 0) return 0;

  const todayStr = formatDate(new Date());
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDate(yesterday);

  const mostRecentDate = uniqueDates[0];

  if (mostRecentDate !== todayStr && mostRecentDate !== yesterdayStr) {
    return 0;
  }

  let streak = 0;
  const currentDateToCheck = new Date(mostRecentDate + 'T12:00:00');

  while (true) {
    const dateToCheckStr = formatDate(currentDateToCheck);
    if (uniqueDates.includes(dateToCheckStr)) {
      streak++;
      currentDateToCheck.setDate(currentDateToCheck.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export function SettingsScreen({ isSidebarOpen, setIsSidebarOpen }: SettingsScreenProps) {
  const { user, signOut } = useAuth();
  const { metrics } = useStudyMetrics();

  // Modo de edição toggle
  const [isEditing, setIsEditing] = useState(false);

  // Estados dos formulários
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Estados de feedback e loading
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Inicializa os campos com os metadados do Supabase Auth
  useEffect(() => {
    if (user) {
      const t = setTimeout(() => {
        setName(user.user_metadata?.name || user.email?.split('@')[0] || '');
        setEmail(user.email || '');
      }, 0);
      return () => clearTimeout(t);
    }
  }, [user]);

  const streak = calculateStreak(metrics);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!name.trim() || !email.trim()) return;

    setLoadingProfile(true);
    setProfileMessage(null);

    try {
      const { error: authError } = await supabase.auth.updateUser({
        email: email.trim(),
        data: { name: name.trim() },
      });

      if (authError) throw authError;

      const { error: dbError } = await supabase
        .from('usuarios')
        .update({
          nm_usuario: name.trim(),
          email: email.trim(),
        })
        .eq('id_usuario', user.id);

      if (dbError) throw dbError;

      setProfileMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
    } catch (err: unknown) {
      const error = err as Error;
      setProfileMessage({ type: 'error', text: error.message || 'Falha ao atualizar perfil.' });
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) return;

    if (password !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'As senhas não coincidem.' });
      return;
    }

    if (password.length < 6) {
      setPasswordMessage({ type: 'error', text: 'A senha deve conter no mínimo 6 caracteres.' });
      return;
    }

    setLoadingPassword(true);
    setPasswordMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setPassword('');
      setConfirmPassword('');
      setPasswordMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
    } catch (err: unknown) {
      const error = err as Error;
      setPasswordMessage({ type: 'error', text: error.message || 'Falha ao alterar senha.' });
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6 p-4 md:p-6 w-full max-w-4xl mx-auto animate-fadeIn overflow-y-auto max-h-[95vh] custom-scrollbar">
      
      {/* Cabeçalho */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-800/60">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-2.5 rounded-2xl border transition-all duration-300 cursor-pointer ${
              isSidebarOpen
                ? 'bg-accent-primary/10 text-accent-primary border-accent-primary/20 hover:bg-accent-primary/20'
                : 'bg-bg-card/30 text-gray-400 border-gray-700/20 hover:text-white hover:bg-bg-card/50'
            }`}
            title={isSidebarOpen ? 'Ocultar Menu' : 'Mostrar Menu'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
          </button>

          <div>
            <h2 className="text-xl md:text-2xl font-black font-display text-white">
              Configurações
            </h2>
            <p className="text-[10px] md:text-xs text-gray-400 font-medium">
              Gerencie sua conta, altere sua senha e acompanhe sua constância de estudos.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => signOut()}
          className="py-1.5 px-3.5 rounded-xl border border-red-950/40 text-red-500/80 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all duration-300 flex items-center gap-1.5 text-xs font-bold cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
          Sair da Conta
        </button>
      </header>

      {/* Pequeno indicador da Ofensiva (Streak) */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs text-orange-400 font-bold max-w-max select-none shadow-md">
        <span>🔥</span>
        <span>{streak} {streak === 1 ? 'dia' : 'dias'} de ofensiva consecutiva</span>
      </div>

      {/* Exibição condicional da interface baseada no modo isEditing */}
      {!isEditing ? (
        /* Visualização Estática dos Dados */
        <div className="p-6 rounded-3xl bg-bg-card/45 border border-gray-700/50 backdrop-blur-md flex flex-col gap-5 shadow-xl max-w-md animate-fadeIn">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-white text-xl font-bold font-display shadow-inner">
              {user?.user_metadata?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h3 className="text-sm font-black text-white font-display">Sua Conta</h3>
              <p className="text-[10px] text-gray-500 font-medium">Registrado via Supabase Auth</p>
            </div>
          </div>

          <div className="border-t border-gray-800/80 pt-4 space-y-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Nome de Usuário</span>
              <span className="text-sm font-bold text-gray-300">{user?.user_metadata?.name || user?.email?.split('@')[0] || 'Sem nome'}</span>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Endereço de E-mail</span>
              <span className="text-sm font-bold text-gray-300">{user?.email}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="mt-2 py-2.5 rounded-xl bg-gradient-to-r from-accent-primary to-accent-secondary text-white font-bold text-xs shadow-lg shadow-accent-primary/20 hover:shadow-accent-primary/30 glow-btn flex items-center justify-center gap-1.5 cursor-pointer transition-transform active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
            </svg>
            Editar Perfil / Alterar Senha
          </button>
        </div>
      ) : (
        /* Formulários de Edição */
        <div className="flex flex-col gap-4 animate-slideDown">
          <div className="flex justify-between items-center mb-1">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setProfileMessage(null);
                setPasswordMessage(null);
              }}
              className="text-xs text-accent-secondary hover:text-cyan-400 font-black flex items-center gap-1.5 cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Voltar para os meus dados
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Painel 1: Dados do Perfil */}
            <div className="p-6 rounded-3xl bg-bg-card/45 border border-gray-700/50 backdrop-blur-md flex flex-col gap-4 shadow-xl">
              <h3 className="font-extrabold text-white text-base font-display flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-accent-primary/20 flex items-center justify-center text-accent-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </span>
                Dados Pessoais
              </h3>

              {profileMessage && (
                <div className={`p-3 rounded-xl border text-xs font-semibold leading-relaxed ${
                  profileMessage.type === 'error'
                    ? 'bg-red-500/10 border-red-500/20 text-red-400'
                    : 'bg-green-500/10 border-green-500/20 text-green-400'
                }`}>
                  {profileMessage.text}
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-display">Nome</label>
                  <input
                    type="text"
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-bg-dark/60 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-accent-primary transition-colors font-semibold"
                    required
                    disabled={loadingProfile}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-display">E-mail</label>
                  <input
                    type="email"
                    placeholder="exemplo@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-bg-dark/60 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-accent-primary transition-colors font-semibold"
                    required
                    disabled={loadingProfile}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loadingProfile}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-accent-primary to-accent-secondary text-white font-bold text-xs shadow-lg shadow-accent-primary/20 hover:shadow-accent-primary/30 glow-btn flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {loadingProfile ? (
                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    'Salvar Alterações'
                  )}
                </button>
              </form>
            </div>

            {/* Painel 2: Segurança (Alterar Senha) */}
            <div className="p-6 rounded-3xl bg-bg-card/45 border border-gray-700/50 backdrop-blur-md flex flex-col gap-4 shadow-xl">
              <h3 className="font-extrabold text-white text-base font-display flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-accent-secondary/20 flex items-center justify-center text-accent-secondary">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </span>
                Segurança
              </h3>

              {passwordMessage && (
                <div className={`p-3 rounded-xl border text-xs font-semibold leading-relaxed ${
                  passwordMessage.type === 'error'
                    ? 'bg-red-500/10 border-red-500/20 text-red-400'
                    : 'bg-green-500/10 border-green-500/20 text-green-400'
                }`}>
                  {passwordMessage.text}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-display">Nova Senha</label>
                  <input
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-bg-dark/60 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-accent-primary transition-colors font-semibold"
                    required
                    disabled={loadingPassword}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-display">Confirmar Nova Senha</label>
                  <input
                    type="password"
                    placeholder="Repita a nova senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-bg-dark/60 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-accent-primary transition-colors font-semibold"
                    required
                    disabled={loadingPassword}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loadingPassword}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-accent-primary to-accent-secondary text-white font-bold text-xs shadow-lg shadow-accent-primary/20 hover:shadow-accent-primary/30 glow-btn flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {loadingPassword ? (
                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    'Atualizar Senha'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
