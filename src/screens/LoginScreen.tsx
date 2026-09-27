import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FocusFlowLogo } from '../components/FocusFlowLogo';

export function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    
    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        if (!name.trim()) {
          setMessage({ type: 'error', text: 'Por favor, insira o seu nome.' });
          setLoading(false);
          return;
        }
        
        await signUp(name.trim(), email.trim(), password);
        setMessage({
          type: 'success',
          text: 'Conta criada com sucesso! Redirecionando...',
        });
      } else {
        await signIn(email.trim(), password);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setMessage({
        type: 'error',
        text: error.message || 'Ocorreu um erro ao processar sua solicitação.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-[20%] left-[10%] w-[30vw] h-[30vw] rounded-full bg-accent-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[10%] w-[30vw] h-[30vw] rounded-full bg-accent-secondary/5 blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full space-y-8 z-10 animate-fadeIn">
        {/* Logo / Header */}
        <div className="text-center flex flex-col items-center">
          <FocusFlowLogo size="xl" className="mb-4" />
          <h2 className="text-3xl font-black font-display text-white tracking-tight">
            {isSignUp ? 'Criar sua conta' : 'Entrar no FocusFlow'}
          </h2>
          <p className="mt-2 text-xs text-gray-400 font-medium">
            {isSignUp
              ? 'Comece a otimizar sua rotina de estudos cientificamente.'
              : 'Bem-vindo de volta! Acesse seu painel de estudos.'}
          </p>
        </div>

        {/* Card Panel */}
        <div className="p-8 rounded-3xl bg-bg-card/45 border border-gray-700/50 backdrop-blur-xl shadow-2xl flex flex-col gap-6">
          {message && (
            <div className={`p-4 rounded-xl border text-xs font-semibold leading-relaxed ${
              message.type === 'error'
                ? 'bg-red-500/10 border-red-500/20 text-red-400'
                : 'bg-green-500/10 border-green-500/20 text-green-400'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {isSignUp && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-display">
                  Seu Nome
                </label>
                <input
                  type="text"
                  placeholder="Seu nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-bg-dark/60 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-accent-primary transition-colors font-semibold"
                  required={isSignUp}
                  disabled={loading}
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-display">
                Endereço de E-mail
              </label>
              <input
                type="email"
                placeholder="exemplo@estudante.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-bg-dark/60 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-accent-primary transition-colors font-semibold"
                required
                disabled={loading}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-display">
                Sua Senha
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-bg-dark/60 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-accent-primary transition-colors font-semibold"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-accent-primary to-accent-secondary text-white font-extrabold text-xs shadow-lg shadow-accent-primary/20 hover:shadow-accent-primary/30 glow-btn flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : isSignUp ? (
                'Criar minha conta'
              ) : (
                'Entrar na plataforma'
              )}
            </button>
          </form>

          {/* Toggle Tab */}
          <div className="text-center border-t border-gray-800/80 pt-4 mt-1">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setMessage(null);
              }}
              className="text-xs font-bold text-accent-secondary hover:text-cyan-400 transition-colors cursor-pointer"
            >
              {isSignUp
                ? 'Já possui uma conta? Entrar agora'
                : 'Não possui conta? Cadastre-se gratuitamente'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}