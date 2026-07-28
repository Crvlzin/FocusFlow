interface MetricFiltersProps {
  selectedSubject: string;
  selectedTopic: string;
  onSubjectChange: (subject: string) => void;
  onTopicChange: (topic: string) => void;
  subjects: string[];
  topics: string[];
}

export function MetricFilters({
  selectedSubject,
  selectedTopic,
  onSubjectChange,
  onTopicChange,
  subjects,
  topics,
}: MetricFiltersProps) {
  return (
    <div className="w-full max-w-7xl mx-auto p-5 rounded-2xl bg-bg-card/40 border border-gray-700/30 backdrop-blur-md flex flex-col md:flex-row gap-4 items-center justify-between">
      
      <div className="flex flex-col gap-0.5 text-center md:text-left">
        <h4 className="text-sm font-bold text-white">Filtrar Gráficos e Registros</h4>
        <p className="text-xs text-gray-400">Analise seu rendimento por matéria ou assunto específico</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
        {/* Filtro de Matéria */}
        <div className="flex flex-col gap-1 w-full sm:w-48">
          <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Matéria</label>
          <select
            value={selectedSubject}
            onChange={(e) => onSubjectChange(e.target.value)}
            className="w-full bg-bg-dark/80 text-xs text-white px-3 py-2 rounded-xl border border-gray-700 focus:outline-none focus:border-accent-primary cursor-pointer"
          >
            <option value="">Todas as Matérias</option>
            {subjects.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro de Assunto (Só habilita se houver matéria selecionada) */}
        <div className="flex flex-col gap-1 w-full sm:w-48">
          <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Assunto</label>
          <select
            value={selectedTopic}
            onChange={(e) => onTopicChange(e.target.value)}
            disabled={!selectedSubject}
            className={`w-full bg-bg-dark/80 text-xs text-white px-3 py-2 rounded-xl border border-gray-700 focus:outline-none focus:border-accent-primary cursor-pointer ${
              !selectedSubject ? 'opacity-40 cursor-not-allowed' : ''
            }`}
          >
            <option value="">Todos os Assuntos</option>
            {topics.map((top) => (
              <option key={top} value={top}>
                {top}
              </option>
            ))}
          </select>
        </div>

        {/* Limpar Filtros (Só exibe se algum filtro estiver ativo) */}
        {(selectedSubject || selectedTopic) && (
          <button
            type="button"
            onClick={() => onSubjectChange('')}
            className="self-end py-2 px-3 rounded-xl border border-gray-750 text-xs text-gray-400 hover:text-white hover:border-gray-600 transition-all font-semibold cursor-pointer w-full sm:w-auto text-center"
          >
            Limpar Filtros
          </button>
        )}
      </div>

    </div>
  );
}
