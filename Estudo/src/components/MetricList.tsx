import { useState, useMemo } from 'react';
import type { StudySessionMetric } from '../types';

interface MetricListProps {
  metrics: StudySessionMetric[];
  onDelete: (id: string) => void;
}

export function MetricList({ metrics, onDelete }: MetricListProps) {
  // Estado local de pesquisa livre
  const [searchTerm, setSearchTerm] = useState('');

  // Filtra localmente baseado no termo digitado (procura na Matéria ou no Assunto)
  const searchedMetrics = useMemo(() => {
    if (!searchTerm.trim()) return metrics;
    const term = searchTerm.toLowerCase().trim();
    return metrics.filter(
      (m) =>
        m.subject.toLowerCase().includes(term) ||
        m.topic.toLowerCase().includes(term)
    );
  }, [metrics, searchTerm]);

  // Formata os minutos de estudo
  const formatMinutes = (m: number) => {
    const hrs = Math.floor(m / 60);
    const mins = m % 60;
    if (hrs === 0) return `${mins}m`;
    return `${hrs}h ${mins}m`;
  };

  // Formata a data (YYYY-MM-DD para DD/MM/YYYY)
  const formatDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 rounded-3xl bg-bg-card border border-gray-700/50 backdrop-blur-md shadow-2xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-white">Registros de Estudo</h3>
          <p className="text-xs text-gray-400">Total de {searchedMetrics.length} sessões encontradas</p>
        </div>

        {/* Input de Pesquisa Livre */}
        <div className="relative w-full sm:w-64">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.637z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Pesquisar matéria ou assunto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-bg-dark/80 text-xs text-white pl-9 pr-4 py-2 rounded-xl border border-gray-700 focus:outline-none focus:border-accent-primary"
          />
        </div>
      </div>

      {/* Lista de Registros */}
      <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
        {searchedMetrics.length === 0 ? (
          <div className="text-center py-12 text-sm text-gray-500 italic">
            Nenhum registro encontrado para a pesquisa.
          </div>
        ) : (
          searchedMetrics.map((session) => {
            const hasQuestions = session.questionsTotal > 0;
            const accuracy = hasQuestions ? (session.questionsCorrect / session.questionsTotal) * 100 : 0;

            return (
              <div
                key={session.id}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-2xl bg-bg-dark/30 border border-gray-800/50 hover:border-gray-700/50 transition-all gap-4"
              >
                {/* Lado Esquerdo: Matéria e Assunto */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{session.subject}</span>
                    <span className="text-[10px] text-gray-400 font-mono bg-bg-card px-2 py-0.5 rounded border border-gray-800/40">
                      {formatDate(session.date)}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">{session.topic}</span>
                </div>

                {/* Centro/Direita: Performance e Tempo */}
                <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto sm:justify-end">
                  
                  {/* Tempo de estudo */}
                  <div className="flex flex-col items-start sm:items-end gap-0.5">
                    <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">Tempo</span>
                    <span className="text-xs text-white font-bold font-mono">{formatMinutes(session.durationMinutes)}</span>
                  </div>

                  {/* Aproveitamento de questões */}
                  <div className="flex flex-col items-start sm:items-end gap-0.5 min-w-[120px]">
                    <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">Rendimento</span>
                    {hasQuestions ? (
                      <span className="text-xs text-gray-300 font-medium">
                        <span className="text-emerald-500 font-bold font-mono">{session.questionsCorrect}</span>
                        {'/'}
                        <span className="text-gray-400 font-mono">{session.questionsTotal} acertos </span>
                        <span className="text-accent-secondary font-bold font-mono bg-accent-secondary/15 px-1.5 py-0.5 rounded">
                          {accuracy.toFixed(0)}%
                        </span>
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500 italic">Sem exercícios</span>
                    )}
                  </div>

                  {/* Divisor no desktop */}
                  <div className="hidden sm:block w-px bg-gray-800 h-8 self-stretch" />

                  {/* Botão Deletar */}
                  <button
                    type="button"
                    onClick={() => onDelete(session.id)}
                    className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 active:scale-95 transition-all cursor-pointer ml-auto sm:ml-0"
                    title="Excluir registro"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>

                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
