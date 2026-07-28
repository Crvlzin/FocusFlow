import type { useStudyMetrics } from '../hooks';

type SubjectStatsType = ReturnType<typeof useStudyMetrics>['analytics']['subjectStats'];

interface DisciplineTableProps {
  subjectStats: SubjectStatsType;
  periodFilter: string;
  onPeriodChange: (period: string) => void;
  customStartDate: string;
  onCustomStartDateChange: (date: string) => void;
  customEndDate: string;
  onCustomEndDateChange: (date: string) => void;
  subjects: string[];
  selectedSubject: string;
  onSubjectChange: (subj: string) => void;
}

export function DisciplineTable({
  subjectStats,
  periodFilter,
  onPeriodChange,
  customStartDate,
  onCustomStartDateChange,
  customEndDate,
  onCustomEndDateChange,
  subjects,
  selectedSubject,
  onSubjectChange,
}: DisciplineTableProps) {
  return (
    <div className="w-full max-w-7xl mx-auto p-6 rounded-3xl bg-bg-card/30 border border-gray-700/50 backdrop-blur-md flex flex-col gap-4">
      
      {/* Cabeçalho da Tabela com Filtros Integrados (Período, Calendário e Disciplinas) */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3 pb-4 border-b border-gray-800/40">
        
        <div>
          <h3 className="text-base font-bold text-white font-display">Estatísticas por disciplina</h3>
          <p className="text-[10px] text-gray-500 font-semibold tracking-wider uppercase mt-0.5">Rendimento de Questões</p>
        </div>

        {/* Seletores de Filtro do Relatório */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* 1. Calendários Customizados (Aparece se Período = custom) */}
          {periodFilter === 'custom' && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="text-[9px] text-gray-500 font-bold uppercase">De:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => onCustomStartDateChange(e.target.value)}
                  className="bg-bg-dark/80 text-[10px] font-mono text-white px-2.5 py-1 rounded-xl border border-gray-700 focus:outline-none focus:border-accent-primary"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[9px] text-gray-500 font-bold uppercase">Até:</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => onCustomEndDateChange(e.target.value)}
                  className="bg-bg-dark/80 text-[10px] font-mono text-white px-2.5 py-1 rounded-xl border border-gray-700 focus:outline-none focus:border-accent-primary"
                />
              </div>
            </div>
          )}

          {/* 2. Seleção de Período (Últimos 7 dias, etc.) */}
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-gray-500 font-bold uppercase hidden sm:inline">Período:</span>
            <select
              value={periodFilter}
              onChange={(e) => onPeriodChange(e.target.value)}
              className="bg-bg-dark/80 text-[11px] font-bold text-gray-300 px-3 py-1.5 rounded-xl border border-gray-700 focus:outline-none focus:border-accent-primary cursor-pointer"
            >
              <option value="7">Últimos 7 dias</option>
              <option value="15">Últimos 15 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="all">Todo o período</option>
              <option value="custom">Período Personalizado</option>
            </select>
          </div>

          {/* 3. Seleção de Disciplinas (Dropdown de Matéria) */}
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-gray-500 font-bold uppercase hidden sm:inline">Disciplina:</span>
            <select
              value={selectedSubject}
              onChange={(e) => onSubjectChange(e.target.value)}
              className="bg-bg-dark/80 text-[11px] font-bold text-gray-300 px-3 py-1.5 rounded-xl border border-gray-700 focus:outline-none focus:border-accent-primary cursor-pointer min-w-[130px]"
            >
              <option value="">Disciplinas</option>
              {subjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

        </div>

      </div>

      {/* Tabela de Estatísticas */}
      <div className="w-full overflow-x-auto rounded-2xl border border-gray-800/50 bg-bg-dark/15 custom-scrollbar">
        <table className="w-full border-collapse text-left text-xs text-gray-300">
          <thead>
            <tr className="border-b border-gray-800/60 text-gray-400 font-bold uppercase tracking-wider text-[10px] bg-bg-dark/35">
              <th className="px-5 py-3.5">Disciplina</th>
              <th className="px-5 py-3.5 text-center">Certas</th>
              <th className="px-5 py-3.5 text-center">Erradas</th>
              <th className="px-5 py-3.5 text-center">Total</th>
              <th className="px-5 py-3.5 text-center">%</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/40">
            {subjectStats.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-gray-500 italic">
                  Nenhum registro de questões para o período e disciplina selecionados.
                </td>
              </tr>
            ) : (
              subjectStats.map((stat) => {
                return (
                  <tr key={stat.subject} className="hover:bg-bg-card/10 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-gray-200">{stat.subject}</td>
                    <td className="px-5 py-3.5 text-center font-mono text-emerald-400 font-bold">{stat.questionsCorrect}</td>
                    <td className="px-5 py-3.5 text-center font-mono text-rose-400 font-bold">{stat.questionsWrong}</td>
                    <td className="px-5 py-3.5 text-center font-mono font-bold text-white">{stat.questionsTotal}</td>
                    <td className="px-5 py-3.5 text-center font-mono font-extrabold text-accent-secondary">
                      {stat.accuracyRate.toFixed(0)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
