import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCronograma, DIAS_DA_SEMANA } from '../hooks/useCronograma';
import { useRevision } from '../hooks/useRevision';
import { useStudyMetrics } from '../hooks/useStudyMetrics';
import { getRandomQuote, type MotivationalQuote } from '../constants/quotes';

interface HomeScreenProps {
  onChangeTab: (tab: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

export function HomeScreen({ onChangeTab, isSidebarOpen, setIsSidebarOpen }: HomeScreenProps) {
  const { user } = useAuth();
  const { todayItems, todayStats, todayIndex, toggleItemConcluido } = useCronograma();
  const { todayRevisions, completeRevision } = useRevision();
  const {
    periodFilter,
    setPeriodFilter,
    analytics,
    streakDays,
  } = useStudyMetrics();

  // Estado da frase motivacional atual
  const [currentQuote] = useState<MotivationalQuote>(getRandomQuote);


  // Modal para nota de revisão rápida
  const [reviewRatingModalId, setReviewRatingModalId] = useState<string | null>(null);


  // Nome de exibição do usuário
  const userName = useMemo(() => {
    if (!user) return 'Estudante';
    if (user.user_metadata?.name) return user.user_metadata.name;
    if (user.email) {
      const prefix = user.email.split('@')[0];
      return prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }
    return 'Estudante';
  }, [user]);

  const todayInfo = DIAS_DA_SEMANA.find((d) => d.id === todayIndex);

  // Formatar minutos em Horas e Minutos legíveis (ex: 2h 15m)
  const formatMinutes = (totalMinutes: number) => {
    if (totalMinutes === 0) return '0 min';
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours === 0) return `${mins} min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  // Concluir revisão rápida
  const handleQuickCompleteReview = async (idRevisao: string, rating: 'forgot' | 'hard' | 'good' | 'easy') => {
    try {
      await completeRevision(idRevisao, rating);
      setReviewRatingModalId(null);
    } catch (err) {
      console.error('Erro ao concluir revisão rápida:', err);
    }
  };


  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 bg-bg-card/20 border border-gray-700/20 rounded-3xl backdrop-blur-md min-h-[600px] overflow-x-hidden animate-fadeIn gap-6">

      {/* 1. HEADER DE BOAS-VINDAS (Clean e Harmonioso) */}
      <div className="p-5 md:p-6 rounded-3xl bg-bg-card/40 border border-gray-800 backdrop-blur-md flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-lg">
        <div className="flex items-start gap-4">
          {/* Botão de Toggle da Sidebar */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-2.5 rounded-2xl border transition-all duration-300 cursor-pointer mt-1 ${isSidebarOpen
              ? 'bg-accent-primary/10 text-accent-primary border-accent-primary/20 hover:bg-accent-primary/20'
              : 'bg-bg-card/30 text-gray-400 border-gray-700/20 hover:text-white hover:bg-bg-card/50'
              }`}
            title={isSidebarOpen ? 'Ocultar Menu Lateral' : 'Mostrar Menu Lateral'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
          </button>

          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-accent-primary/15 text-accent-primary border border-accent-primary/20">
                Hoje é {todayInfo?.label}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                🔥 {streakDays} {streakDays === 1 ? 'dia de ofensiva' : 'dias de ofensiva'}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-white font-display tracking-tight">
              Seja bem-vindo(a), <span className="text-accent-primary">{userName}</span>! 👋
            </h1>
            <p className="text-xs md:text-sm text-gray-400 mt-1 max-w-xl">
              O que vamos estudar hoje? Acompanhe o preview das suas metas diárias, revisões e métricas de desempenho.
            </p>
          </div>
        </div>

        {/* Botão Principal de CTA (Redirect para o Pomodoro) */}
        <div className="w-full lg:w-auto">
          <button
            type="button"
            onClick={() => onChangeTab('timer')}
            className="w-full lg:w-auto px-5 py-3 rounded-2xl bg-accent-primary hover:bg-accent-primary/90 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer group"
          >
            <span>Vamos iniciar os estudos?</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 group-hover:translate-x-1 transition-transform">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      </div>



      {/* 2. CARD DE FRASE MOTIVACIONAL DO DIA */}
      <div className="p-4 md:p-5 rounded-3xl bg-bg-card/40 border border-gray-800 backdrop-blur-md flex items-center gap-3.5 shadow-lg">
        <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.516 0c.85.493 1.508 1.333 1.508 2.316V18" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs md:text-sm font-semibold text-gray-200 italic leading-relaxed whitespace-pre-line">
            "{currentQuote.quote.trim()}"
          </p>
          {currentQuote.author && (
            <span className="text-xs font-bold text-accent-primary mt-1 block">
              — {currentQuote.author}
            </span>
          )}
        </div>
      </div>

      {/* 3. GRID DE SEÇÕES DA TELA DE INÍCIO (2 COLUNAS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">


        {/* CARD 1: MATÉRIAS A SEREM ESTUDADAS HOJE (CRONOGRAMA DO DIA) */}
        <div className="p-5 rounded-3xl bg-bg-card/40 border border-gray-800 backdrop-blur-md flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-gray-800/80 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-accent-primary/15 text-accent-primary border border-accent-primary/20">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-display">Matérias a serem estudadas hoje</h3>
                </div>
              </div>

              {/* Barra de Progresso Rápida */}
              {todayStats.total > 0 && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-accent-primary/20 text-accent-primary">
                  {todayStats.completed}/{todayStats.total} ({todayStats.percent}%)
                </span>
              )}
            </div>

            {/* Conteúdo das Matérias de Hoje */}
            {todayItems.length === 0 ? (
              <div className="py-8 px-4 text-center border border-dashed border-gray-800 rounded-2xl my-2 flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-gray-800/60 border border-gray-700/50 flex items-center justify-center text-gray-400 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-sm font-semibold text-gray-200 mb-1">Nenhuma matéria para hoje</h4>
                <p className="text-xs text-gray-400 max-w-xs mb-4">
                  Você não possui matérias agendadas para o cronograma deste dia da semana.
                </p>
                <button
                  type="button"
                  onClick={() => onChangeTab('schedule')}
                  className="px-4 py-2 rounded-xl bg-accent-primary/15 hover:bg-accent-primary/25 text-accent-primary border border-accent-primary/30 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Ver Cronograma</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 my-2 max-h-[220px] overflow-y-auto pr-1">
                {todayItems.map((item) => (
                  <div
                    key={item.id_cronograma}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${item.fl_concluido
                      ? 'bg-emerald-950/20 border-emerald-500/30 opacity-75'
                      : 'bg-bg-card/70 border-gray-700/50 hover:border-accent-primary/40'
                      }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Checkbox de Conclusão */}
                      <button
                        type="button"
                        onClick={() => toggleItemConcluido(item.id_cronograma)}
                        className={`w-5 h-5 rounded-md border transition-all flex items-center justify-center flex-shrink-0 cursor-pointer ${item.fl_concluido
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-gray-600 hover:border-accent-primary bg-bg-dark/50'
                          }`}
                      >
                        {item.fl_concluido && (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3.5} stroke="currentColor" className="w-3 h-3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                      </button>

                      <div className="min-w-0">
                        {item.materias && (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-accent-secondary/15 text-accent-secondary border border-accent-secondary/20 mb-0.5">
                            {item.materias.nm_materia}
                          </span>
                        )}
                        <h4 className={`text-sm font-bold truncate ${item.fl_concluido ? 'line-through text-gray-500' : 'text-white'}`}>
                          {item.titulo_estudo}
                        </h4>
                      </div>
                    </div>

                    {(item.horario_inicio || item.horario_fim) && (
                      <span className="text-xs text-gray-400 font-medium flex-shrink-0 bg-bg-dark/40 px-2.5 py-1 rounded-lg border border-gray-800">
                        {item.horario_inicio || '--:--'} {item.horario_fim ? `- ${item.horario_fim}` : ''}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botão Inferior de Redirecionamento */}
          <div className="pt-3 border-t border-gray-800/80 flex items-center justify-between">
            <span className="text-xs text-gray-400">Quer visualizar toda a grade semanal?</span>
            <button
              type="button"
              onClick={() => onChangeTab('schedule')}
              className="text-xs font-bold text-accent-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Ver Cronograma Completo</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>

        {/* CARD 2: MATÉRIAS PARA REVISAR HOJE (PREVIEW DE REVISÕES) */}
        <div className="p-5 rounded-3xl bg-bg-card/40 border border-gray-800 backdrop-blur-md flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-gray-800/80 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-accent-secondary/15 text-accent-secondary border border-accent-secondary/20">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3M3 12a48.29 48.29 0 017.324 0c1.884.143 3.42 1.547 3.7 3.439.092 1.21.138 2.43.138 3.661m0 0l-3-3m3 3l3-3" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-display">Matérias para revisar hoje</h3>
                </div>
              </div>

              {todayRevisions.length > 0 && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-accent-secondary/20 text-accent-secondary">
                  {todayRevisions.length} pendentes
                </span>
              )}
            </div>

            {/* Conteúdo das Revisões de Hoje */}
            {todayRevisions.length === 0 ? (
              <div className="py-8 px-4 text-center border border-dashed border-gray-800 rounded-2xl my-2 flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-sm font-semibold text-white mb-1">Tudo em dia com as revisões!</h4>
                <p className="text-xs text-gray-400 max-w-xs mb-4">
                  Você não possui nenhuma revisão agendada para o dia de hoje.
                </p>
                <button
                  type="button"
                  onClick={() => onChangeTab('reviews')}
                  className="px-4 py-2 rounded-xl bg-accent-secondary/15 hover:bg-accent-secondary/25 text-accent-secondary border border-accent-secondary/30 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Ver Minhas Revisões</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 my-2 max-h-[220px] overflow-y-auto pr-1">
                {todayRevisions.map((rev) => (
                  <div
                    key={rev.id_revisao}
                    className="p-3 rounded-2xl bg-bg-card/70 border border-gray-700/50 hover:border-accent-secondary/40 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent-secondary/15 text-accent-secondary border border-accent-secondary/20">
                          {rev.assuntos?.materias?.nm_materia || 'Matéria'}
                        </span>
                        <span className="text-[10px] text-gray-400 font-semibold">
                          Ciclo {rev.nivel_ciclo}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white truncate">
                        {rev.assuntos?.nm_assunto || 'Assunto'}
                      </h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => setReviewRatingModalId(rev.id_revisao)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer flex-shrink-0"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      <span>Concluir</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botão Inferior de Redirecionamento */}
          <div className="pt-3 border-t border-gray-800/80 flex items-center justify-between">
            <span className="text-xs text-gray-400">Quer cadastrar ou ver o histórico?</span>
            <button
              type="button"
              onClick={() => onChangeTab('reviews')}
              className="text-xs font-bold text-accent-secondary hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Gerenciar Revisões</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>

      </div>

      {/* 4. CARD: DASHBOARD DE MÉTRICAS E RENDIMENTO COM SELETOR DE PERÍODO */}
      <div className="p-6 rounded-3xl bg-bg-card/40 border border-gray-800 backdrop-blur-md shadow-lg flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">Painel de Métricas & Rendimento</h3>
              <p className="text-xs text-gray-400">Resumo da sua evolução de estudos</p>
            </div>
          </div>

          {/* Seletor de Período de Métricas */}
          <div className="flex items-center gap-1 bg-bg-dark/60 p-1 rounded-xl border border-gray-700/40">
            {(
              [
                { id: 'today', label: 'Hoje' },
                { id: '7d', label: '7 Dias' },
                { id: '30d', label: '30 Dias' },
                { id: 'all', label: 'Total' },
              ] as const
            ).map((filter) => {
              const isActive = periodFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setPeriodFilter(filter.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${isActive
                    ? 'bg-accent-primary text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                    }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mini Cards de Estatísticas (4 Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Card 1: Tempo de Estudo */}
          <div className="p-4 rounded-2xl bg-bg-card/60 border border-gray-700/40 flex flex-col justify-between">
            <span className="text-xs text-gray-400 font-medium">Tempo de Estudo</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-white font-display">
                {formatMinutes(analytics.totalMinutes)}
              </span>
            </div>
          </div>

          {/* Card 2: Questões Resolvidas */}
          <div className="p-4 rounded-2xl bg-bg-card/60 border border-gray-700/40 flex flex-col justify-between">
            <span className="text-xs text-gray-400 font-medium">Questões Resolvidas</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-white font-display">
                {analytics.questionsTotal}
              </span>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                {analytics.questionsCorrect} acertos
              </span>
            </div>
          </div>

          {/* Card 3: Taxa de Precisão */}
          <div className="p-4 rounded-2xl bg-bg-card/60 border border-gray-700/40 flex flex-col justify-between">
            <span className="text-xs text-gray-400 font-medium">Taxa de Precisão</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-white font-display">
                {Math.round(analytics.accuracyRate)}%
              </span>
            </div>
          </div>

          {/* Card 4: Matéria Mais Estudada */}
          <div className="p-4 rounded-2xl bg-bg-card/60 border border-gray-700/40 flex flex-col justify-between">
            <span className="text-xs text-gray-400 font-medium">Matéria Mais Estudada</span>
            <div className="mt-2">
              <span className="text-sm font-extrabold text-accent-secondary truncate block">
                {analytics.subjectStats[0]?.subject || 'Nenhuma no período'}
              </span>
            </div>
          </div>

        </div>



        {/* Rodapé do Card de Métricas com Botão de Redirecionamento */}
        <div className="pt-2 flex items-center justify-between">
          <span className="text-xs text-gray-400">Deseja adicionar relatórios ou ver tabelas completas?</span>
          <button
            type="button"
            onClick={() => onChangeTab('stats')}
            className="text-xs font-bold text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Ver Estatísticas Detalhadas</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* MODAL DE AVALIAÇÃO RÁPIDA DE REVISÃO */}
      {reviewRatingModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-bg-dark border border-gray-700/60 rounded-3xl p-6 w-full max-w-md shadow-2xl text-center">
            <h3 className="text-lg font-bold text-white font-display mb-1">Como foi essa revisão?</h3>
            <p className="text-xs text-gray-400 mb-6">
              Avalie a sua facilidade de retenção do assunto para ajustar o próximo intervalo de estudo.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => handleQuickCompleteReview(reviewRatingModalId, 'forgot')}
                className="p-3 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold text-xs transition-all cursor-pointer"
              >
                🔴 Esqueci (Reiniciar)
              </button>
              <button
                type="button"
                onClick={() => handleQuickCompleteReview(reviewRatingModalId, 'hard')}
                className="p-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold text-xs transition-all cursor-pointer"
              >
                🟠 Difícil (Intervalo curto)
              </button>
              <button
                type="button"
                onClick={() => handleQuickCompleteReview(reviewRatingModalId, 'good')}
                className="p-3 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 font-bold text-xs transition-all cursor-pointer"
              >
                🔵 Bom (Intervalo normal)
              </button>
              <button
                type="button"
                onClick={() => handleQuickCompleteReview(reviewRatingModalId, 'easy')}
                className="p-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold text-xs transition-all cursor-pointer"
              >
                🟢 Fácil (Intervalo longo)
              </button>
            </div>

            <button
              type="button"
              onClick={() => setReviewRatingModalId(null)}
              className="text-xs text-gray-400 hover:text-white font-semibold cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
