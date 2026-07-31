import { useState } from 'react';
import { useRevision, getTodayDateString, addDays } from '../hooks/useRevision';
import { useCronograma } from '../hooks/useCronograma';
import type { DbRevisao } from '../types';

interface ReviewsScreenProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

export function ReviewsScreen({ isSidebarOpen, setIsSidebarOpen }: ReviewsScreenProps) {
  const {
    todayRevisions,
    upcomingRevisions,
    revisoes,
    loading,
    addRevisionTopic,
    completeRevision,
    deleteRevisionTopic,
    resetRevisionCycle,
  } = useRevision();

  const { materias: registeredMaterias } = useCronograma();

  // Estados locais
  const [activeSubTab, setActiveSubTab] = useState<'today' | 'upcoming' | 'all'>('today');
  const [newSubject, setNewSubject] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [reviewingTopicId, setReviewingTopicId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Manipulador de submissão do formulário de novo tópico de revisão
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newTopic.trim()) return;
    await addRevisionTopic(newSubject.trim(), newTopic.trim());
    setNewSubject('');
    setNewTopic('');
    setIsFormOpen(false);
  };

  // Filtra as matérias baseado na busca
  const filterList = (list: DbRevisao[]) => {
    if (!filterSubject.trim()) return list;
    const term = filterSubject.toLowerCase().trim();
    return list.filter(
      (item) =>
        item.assuntos?.materias?.nm_materia?.toLowerCase().includes(term) ||
        item.assuntos?.nm_assunto?.toLowerCase().includes(term)
    );
  };

  const filteredToday = filterList(todayRevisions);
  const filteredUpcoming = filterList(upcomingRevisions);
  const filteredAll = filterList(revisoes);

  // Formata datas para exibição legível
  const formatDateReadable = (dateStr: string) => {
    if (!dateStr) return '';
    const today = getTodayDateString();
    if (dateStr === today) return 'Hoje';
    if (dateStr === addDays(today, 1)) return 'Amanhã';
    
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year.slice(-2)}`;
  };

  // Concluir revisão com avaliação Ebbinghaus
  const handleCompleteReviewWithRating = async (rating: 'forgot' | 'hard' | 'good' | 'easy') => {
    if (!reviewingTopicId) return;
    try {
      await completeRevision(reviewingTopicId, rating);
      setReviewingTopicId(null);
    } catch (err) {
      console.error('Erro ao concluir revisão:', err);
    }
  };

  // Componente interno para renderizar a Linha de Marcos de Revisão (Timeline Stepper)
  const RevisionStepper = ({ topic }: { topic: DbRevisao }) => {
    const repCount = topic.fl_concluida ? 4 : topic.nivel_ciclo - 1;

    const stages = [
      { id: 1, label: '24h', labelLong: '1 Dia' },
      { id: 2, label: '7d', labelLong: '7 Dias' },
      { id: 3, label: '15d', labelLong: '15 Dias' },
      { id: 4, label: '30d', labelLong: '30 Dias' },
    ];

    return (
      <div className="flex items-center justify-between w-full relative py-3">
        {/* Barra de Progresso Traseira */}
        <div className="absolute left-[8%] right-[8%] top-[26px] h-0.5 bg-gray-800" />
        
        {/* Barra de Progresso Ativa */}
        <div 
          className="absolute left-[8%] top-[26px] h-0.5 bg-gradient-to-r from-accent-primary to-accent-secondary transition-all duration-500 ease-in-out" 
          style={{ 
            width: `${Math.min(100, Math.max(0, (repCount / 4) * 84))}%` 
          }}
        />

        {stages.map((stage) => {
          const isDone = repCount >= stage.id;
          const isCurrentStage = repCount === stage.id - 1 && !topic.fl_concluida;
          
          return (
            <div key={stage.id} className="flex flex-col items-center z-10 flex-1 relative">
              <div 
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] transition-all duration-500 ${
                  isDone 
                    ? 'bg-accent-primary text-white shadow-lg shadow-accent-primary/30 scale-105' 
                    : isCurrentStage 
                    ? 'bg-amber-500 text-black font-extrabold animate-pulse ring-2 ring-amber-500/50' 
                    : 'bg-bg-dark border border-gray-700 text-gray-500'
                }`}
              >
                {isDone ? '✓' : stage.id}
              </div>
              
              <span className={`text-[11px] font-semibold mt-1.5 ${
                isDone ? 'text-accent-primary' : isCurrentStage ? 'text-amber-400 font-bold' : 'text-gray-500'
              }`}>
                {stage.label}
              </span>
              <span className="text-[9px] text-gray-600 hidden sm:inline">
                ({stage.labelLong})
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 bg-bg-card/20 border border-gray-700/20 rounded-3xl backdrop-blur-md min-h-[600px] overflow-x-hidden animate-fadeIn gap-6">

      {/* 1. CABEÇALHO DA TELA DE REVISÕES */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-800/60">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-2.5 rounded-2xl border transition-all duration-300 cursor-pointer ${
              isSidebarOpen
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
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold text-white font-display tracking-tight">
                Revisões Espaçadas
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent-secondary/15 text-accent-secondary border border-accent-secondary/20">
                Curva de Ebbinghaus
              </span>
            </div>
            <p className="text-xs md:text-sm text-gray-400 mt-0.5">
              Gerencie o ciclo de fixação dos seus assuntos nos intervalos de 24h, 7d, 15d e 30d.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-accent-primary to-accent-secondary text-white font-semibold text-sm shadow-lg shadow-accent-primary/25 hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {isFormOpen ? 'Fechar Formulário' : 'Cadastrar Nova Revisão'}
        </button>
      </div>

      {/* 2. FORMULÁRIO PARA CADASTRAR NOVO TÓPICO DE REVISÃO */}
      {isFormOpen && (
        <div className="p-5 md:p-6 rounded-3xl bg-bg-card/40 border border-gray-800 backdrop-blur-md shadow-xl animate-fadeIn">
          <h2 className="text-base font-bold text-white font-display mb-1 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-accent-primary" />
            Cadastrar Assunto no Ciclo de Revisões
          </h2>
          <p className="text-xs text-gray-400 mb-4">
            Ao cadastrar um assunto, a primeira revisão será agendada automaticamente para amanhã (intervalo de 24 horas).
          </p>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Matéria *</label>
              {registeredMaterias.length > 0 ? (
                <select
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-bg-dark/80 border border-gray-700 text-white text-xs font-semibold focus:outline-none focus:border-accent-primary cursor-pointer"
                  required
                >
                  <option value="">-- Selecione a Matéria --</option>
                  {registeredMaterias.map((m) => (
                    <option key={m.id_materia} value={m.nm_materia}>
                      {m.nm_materia}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="ex: Direito Constitucional, Matemática..."
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-bg-dark/80 border border-gray-700 text-white text-xs focus:outline-none focus:border-accent-primary"
                  required
                />
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Assunto Estudado *</label>
              <input
                type="text"
                placeholder="ex: Direitos Fundamentais, Logaritmos..."
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-bg-dark/80 border border-gray-700 text-white text-xs focus:outline-none focus:border-accent-primary"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-accent-primary hover:bg-accent-primary/90 text-white text-xs font-bold shadow-md shadow-accent-primary/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Adicionando...' : 'Iniciar Ciclo de Revisão'}
            </button>
          </form>
        </div>
      )}

      {/* 3. BARRA DE NAVEGAÇÃO / SUB-ABAS E BUSCA */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Abas */}
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-bg-dark/60 border border-gray-800 self-start">
          <button
            type="button"
            onClick={() => setActiveSubTab('today')}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'today'
                ? 'bg-accent-primary text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>Hoje</span>
            {todayRevisions.length > 0 && (
              <span className="px-2 py-0.2 rounded-full text-[10px] bg-amber-500 text-black font-extrabold">
                {todayRevisions.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('upcoming')}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'upcoming'
                ? 'bg-accent-primary text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>Próximas</span>
            <span className="px-2 py-0.2 rounded-full text-[10px] bg-gray-800 text-gray-300">
              {upcomingRevisions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('all')}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'all'
                ? 'bg-accent-primary text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>Todas</span>
            <span className="px-2 py-0.2 rounded-full text-[10px] bg-gray-800 text-gray-300">
              {revisoes.length}
            </span>
          </button>
        </div>

        {/* Input de Filtro por Busca */}
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Buscar por matéria ou assunto..."
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-bg-card/50 border border-gray-700/60 text-white text-xs focus:outline-none focus:border-accent-primary placeholder-gray-500"
          />
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-gray-500 absolute left-3 top-2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>
      </div>

      {/* 4. CONTEÚDO DAS LISTAS DE REVISÃO */}
      <div className="flex-1 flex flex-col gap-4">
        {/* ABA: HOJE */}
        {activeSubTab === 'today' && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            {filteredToday.length === 0 ? (
              <div className="py-16 px-4 text-center border border-dashed border-gray-800 rounded-3xl bg-bg-card/20 flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-white mb-1">Nenhuma revisão pendente para hoje!</h3>
                <p className="text-xs text-gray-400 max-w-sm mb-4">
                  Seus estudos estão em dia. Alterne para a aba "Próximas" ou cadastre um novo assunto para revisar.
                </p>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(true)}
                  className="px-4 py-2 rounded-xl bg-accent-primary text-white text-xs font-bold shadow-md shadow-accent-primary/20 hover:bg-opacity-90 transition-all cursor-pointer"
                >
                  + Cadastrar Assunto para Revisar
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredToday.map((item) => (
                  <div
                    key={item.id_revisao}
                    className="p-5 rounded-3xl bg-amber-500/5 border border-amber-500/30 backdrop-blur-md flex flex-col justify-between gap-4 shadow-lg shadow-amber-500/5 hover:border-amber-500/50 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-accent-secondary/15 text-accent-secondary border border-accent-secondary/20 truncate max-w-[150px]">
                          {item.assuntos?.materias?.nm_materia || 'Matéria'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500 text-black">
                          HOJE
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-white font-display mb-1">
                        {item.assuntos?.nm_assunto || 'Assunto'}
                      </h3>
                      <p className="text-xs text-gray-400">
                        Estágio do ciclo: <strong className="text-gray-200">Revisão de Nível {item.nivel_ciclo}</strong>
                      </p>
                    </div>

                    <RevisionStepper topic={item} />

                    <div className="flex items-center justify-between pt-3 border-t border-gray-800/60">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => resetRevisionCycle(item.id_revisao)}
                          className="text-xs text-gray-400 hover:text-white p-1 rounded hover:bg-gray-800 transition-colors cursor-pointer"
                          title="Reiniciar Ciclo"
                        >
                          🔄 Reiniciar
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteRevisionTopic(item.id_revisao)}
                          className="text-xs text-red-400 hover:text-red-300 p-1 rounded hover:bg-gray-800 transition-colors cursor-pointer"
                          title="Excluir Ciclo"
                        >
                          🗑️ Excluir
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setReviewingTopicId(item.id_revisao)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-accent-primary to-accent-secondary text-white font-bold text-xs shadow-md shadow-accent-primary/20 hover:opacity-95 transition-all cursor-pointer"
                      >
                        Concluir Revisão
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ABA: PRÓXIMAS */}
        {activeSubTab === 'upcoming' && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            {filteredUpcoming.length === 0 ? (
              <div className="py-16 px-4 text-center border border-dashed border-gray-800 rounded-3xl bg-bg-card/20 flex flex-col items-center justify-center">
                <p className="text-sm text-gray-400">Nenhuma revisão agendada para os próximos dias.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredUpcoming.map((item) => (
                  <div
                    key={item.id_revisao}
                    className="p-5 rounded-3xl bg-bg-card/40 border border-gray-800 backdrop-blur-md flex flex-col justify-between gap-4 shadow-lg hover:border-gray-700 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-accent-secondary/15 text-accent-secondary border border-accent-secondary/20 truncate max-w-[150px]">
                          {item.assuntos?.materias?.nm_materia || 'Matéria'}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-800 text-gray-300 border border-gray-700">
                          🕒 {formatDateReadable(item.dt_revisao)}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-white font-display mb-1">
                        {item.assuntos?.nm_assunto || 'Assunto'}
                      </h3>
                      <p className="text-xs text-gray-400">
                        Próximo Estágio: <strong className="text-gray-200">Nível {item.nivel_ciclo}</strong>
                      </p>
                    </div>

                    <RevisionStepper topic={item} />

                    <div className="flex items-center justify-between pt-3 border-t border-gray-800/60">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => resetRevisionCycle(item.id_revisao)}
                          className="text-xs text-gray-400 hover:text-white p-1 rounded hover:bg-gray-800 transition-colors cursor-pointer"
                          title="Reiniciar Ciclo"
                        >
                          🔄 Reiniciar
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteRevisionTopic(item.id_revisao)}
                          className="text-xs text-red-400 hover:text-red-300 p-1 rounded hover:bg-gray-800 transition-colors cursor-pointer"
                          title="Excluir Ciclo"
                        >
                          🗑️ Excluir
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setReviewingTopicId(item.id_revisao)}
                        className="px-3.5 py-1.5 rounded-xl bg-bg-card hover:bg-gray-800 border border-gray-700 text-white font-bold text-xs transition-all cursor-pointer"
                      >
                        Adiantar / Concluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ABA: TODAS AS REVISÕES */}
        {activeSubTab === 'all' && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            {filteredAll.length === 0 ? (
              <div className="py-16 px-4 text-center border border-dashed border-gray-800 rounded-3xl bg-bg-card/20 flex flex-col items-center justify-center">
                <p className="text-sm text-gray-400">Nenhum assunto cadastrado no ciclo de revisões.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredAll.map((item) => (
                  <div
                    key={item.id_revisao}
                    className={`p-5 rounded-3xl border transition-all flex flex-col justify-between gap-4 shadow-lg ${
                      item.fl_concluida
                        ? 'bg-emerald-950/10 border-emerald-500/20 opacity-75'
                        : item.dt_revisao <= getTodayDateString()
                        ? 'bg-amber-500/5 border-amber-500/30'
                        : 'bg-bg-card/40 border-gray-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-accent-secondary/15 text-accent-secondary border border-accent-secondary/20 truncate max-w-[150px]">
                          {item.assuntos?.materias?.nm_materia || 'Matéria'}
                        </span>
                        {item.fl_concluida ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            ✓ Concluída
                          </span>
                        ) : item.dt_revisao <= getTodayDateString() ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500 text-black">
                            HOJE
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-800 text-gray-300 border border-gray-700">
                            {formatDateReadable(item.dt_revisao)}
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-white font-display mb-1">
                        {item.assuntos?.nm_assunto || 'Assunto'}
                      </h3>
                      <p className="text-xs text-gray-400">
                        {item.fl_concluida
                          ? 'Ciclo de Ebbinghaus finalizado com sucesso!'
                          : `Nível Atual: ${item.nivel_ciclo}`}
                      </p>
                    </div>

                    <RevisionStepper topic={item} />

                    <div className="flex items-center justify-between pt-3 border-t border-gray-800/60">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => resetRevisionCycle(item.id_revisao)}
                          className="text-xs text-gray-400 hover:text-white p-1 rounded hover:bg-gray-800 transition-colors cursor-pointer"
                          title="Reiniciar Ciclo"
                        >
                          🔄 Reiniciar
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteRevisionTopic(item.id_revisao)}
                          className="text-xs text-red-400 hover:text-red-300 p-1 rounded hover:bg-gray-800 transition-colors cursor-pointer"
                          title="Excluir Ciclo"
                        >
                          🗑️ Excluir
                        </button>
                      </div>

                      {!item.fl_concluida && (
                        <button
                          type="button"
                          onClick={() => setReviewingTopicId(item.id_revisao)}
                          className="px-3.5 py-1.5 rounded-xl bg-accent-primary hover:bg-accent-primary/90 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                        >
                          Concluir
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL: Avaliação de Retenção Ebbinghaus ao concluir revisão */}
      {reviewingTopicId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-bg-dark border border-gray-700/60 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center flex flex-col gap-4">
            <div>
              <h3 className="text-base font-bold text-white mb-1">Como foi a lembrança do assunto?</h3>
              <p className="text-xs text-gray-400">
                Sua resposta recalcula o intervalo para a próxima revisão baseada na Curva do Esquecimento.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mt-2">
              <button
                type="button"
                onClick={() => handleCompleteReviewWithRating('forgot')}
                className="p-3 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 hover:bg-red-500/25 transition-all text-xs font-bold flex flex-col items-center gap-1 cursor-pointer"
              >
                <span>🔴 Esqueci</span>
                <span className="text-[10px] text-red-400/80 font-normal">Reinicia o ciclo</span>
              </button>

              <button
                type="button"
                onClick={() => handleCompleteReviewWithRating('hard')}
                className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 transition-all text-xs font-bold flex flex-col items-center gap-1 cursor-pointer"
              >
                <span>🟡 Difícil</span>
                <span className="text-[10px] text-amber-400/80 font-normal">Com esforço</span>
              </button>

              <button
                type="button"
                onClick={() => handleCompleteReviewWithRating('good')}
                className="p-3 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-300 hover:bg-blue-500/25 transition-all text-xs font-bold flex flex-col items-center gap-1 cursor-pointer"
              >
                <span>🔵 Bom</span>
                <span className="text-[10px] text-blue-400/80 font-normal">Lembrei bem</span>
              </button>

              <button
                type="button"
                onClick={() => handleCompleteReviewWithRating('easy')}
                className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 transition-all text-xs font-bold flex flex-col items-center gap-1 cursor-pointer"
              >
                <span>🟢 Fácil</span>
                <span className="text-[10px] text-emerald-400/80 font-normal">Sem dúvida</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setReviewingTopicId(null)}
              className="mt-2 text-xs text-gray-500 hover:text-gray-300 cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
