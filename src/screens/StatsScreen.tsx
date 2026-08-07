import { useState } from 'react';
import { useStudyMetrics } from '../hooks';
import {
  MetricForm,
  DashboardOverview,
  MetricFilters,
  MetricList,
  DisciplineTable,
  SubjectManagerModal,
} from '../components';

interface StatsScreenProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

export function StatsScreen({ isSidebarOpen, setIsSidebarOpen }: StatsScreenProps) {
  // Estado local para recolher/mostrar o painel de gerenciamento de métricas (Formulário e Histórico)
  const [isMetricsOpen, setIsMetricsOpen] = useState(false);

  // Estado local para abrir o modal dedicado de Gerenciamento de Matérias
  const [isSubjectManagerOpen, setIsSubjectManagerOpen] = useState(false);

  // Estado local para gerenciar a exibição do modal de confirmação de exclusão
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Estado para confirmação de exclusão de matéria individual
  const [materiaToDelete, setMateriaToDelete] = useState<string | null>(null);

  const {
    metrics,
    filteredMetrics,
    selectedSubject,
    selectedTopic,
    setSelectedSubject,
    setSelectedTopic,
    periodFilter,
    setPeriodFilter,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    uniqueSubjects,
    uniqueTopics,
    dailyPoints,
    analytics,
    addMetric,
    addMateria,
    deleteMateria,
    deleteMetric,
    clearMetrics,
  } = useStudyMetrics();

  return (
    <div className="flex-1 flex flex-col gap-6 p-4 md:p-6 w-full max-w-7xl mx-auto animate-fadeIn overflow-y-auto max-h-[95vh] custom-scrollbar">

      {/* Cabeçalho da Tela de Estatísticas */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-800/60">

        {/* Lado Esquerdo: Botão Sidebar + Textos */}
        <div className="flex items-center gap-3">
          {/* Botão de Toggle da Sidebar (Idêntico ao do Pomodoro) */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-2.5 rounded-2xl border transition-all duration-300 cursor-pointer ${isSidebarOpen
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
            <h2 className="text-xl md:text-2xl font-black font-display text-white">
              Painel de Desempenho
            </h2>
            <p className="text-[10px] md:text-xs text-gray-400 font-medium">
              Estatísticas, rendimento de exercícios e tempo de foco por matéria.
            </p>
          </div>
        </div>

        {/* Lado Direito: Ações (Gerenciar Matérias e Toggle Métricas) */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          {/* Botão específico para Gerenciar/Excluir Matérias */}
          <button
            type="button"
            onClick={() => setIsSubjectManagerOpen(true)}
            className="py-2 px-3.5 rounded-xl border border-gray-700/60 bg-bg-card/40 hover:bg-bg-card text-xs font-bold text-gray-300 hover:text-white transition-all duration-300 flex items-center gap-1.5 cursor-pointer shadow-md"
            title="Gerenciar lista de matérias"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-accent-secondary">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            <span>Gerenciar Matérias</span>
          </button>

          {/* Botão de Toggle para expandir/colapsar os formulários e logs abaixo */}
          <button
            type="button"
            onClick={() => setIsMetricsOpen(!isMetricsOpen)}
            className={`py-2 px-3.5 rounded-xl border text-xs font-bold transition-all duration-300 cursor-pointer flex items-center gap-1.5 ${isMetricsOpen
              ? 'bg-accent-primary/10 text-accent-primary border-accent-primary/20 hover:bg-accent-primary/20'
              : 'bg-bg-card/30 text-gray-400 border-gray-700/20 hover:text-white hover:bg-bg-card/50'
              }`}
            title={isMetricsOpen ? 'Ocultar gerenciamento' : 'Mostrar gerenciamento'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {isMetricsOpen ? 'Fechar' : 'Inserir métricas'}
          </button>
        </div>
      </header>

      {/* MODAL EXCLUSIVO: Gerenciador de Matérias (Adicionar e Excluir) */}
      <SubjectManagerModal
        isOpen={isSubjectManagerOpen}
        onClose={() => setIsSubjectManagerOpen(false)}
        subjects={uniqueSubjects}
        onAddMateria={addMateria}
        onDeleteMateria={(name) => setMateriaToDelete(name)}
      />

      {/* 1. Formulário de Cadastro (Aparece POR CIMA dos gráficos quando ativo, abaixo do cabeçalho) */}
      {isMetricsOpen && (
        <div className="w-full animate-fadeIn">
          <MetricForm
            onSave={addMetric}
            onAddMateria={addMateria}
            onOpenSubjectManager={() => setIsSubjectManagerOpen(true)}
            existingSubjects={uniqueSubjects}
            existingMetrics={metrics}
          />
        </div>
      )}

      {/* 2. Dashboard de Desempenho (Sempre Visível - Centro/Topo da visualização principal) */}
      <DashboardOverview
        analytics={analytics}
        dailyPoints={dailyPoints}
        periodFilter={periodFilter}
        onPeriodChange={setPeriodFilter}
        customStartDate={customStartDate}
        onCustomStartDateChange={setCustomStartDate}
        customEndDate={customEndDate}
        onCustomEndDateChange={setCustomEndDate}
        onClearHistory={() => setShowConfirmModal(true)} // Abre o Modal customizado em vez do confirm nativo
      />

      {/* 3. Seção Inferior: Tabela por Disciplina (Sempre Visível) */}
      <DisciplineTable
        subjectStats={analytics.subjectStats}
        periodFilter={periodFilter}
        onPeriodChange={setPeriodFilter}
        customStartDate={customStartDate}
        onCustomStartDateChange={setCustomStartDate}
        customEndDate={customEndDate}
        onCustomEndDateChange={setCustomEndDate}
        subjects={uniqueSubjects}
        selectedSubject={selectedSubject}
        onSubjectChange={setSelectedSubject}
        onDeleteMateria={(name) => setMateriaToDelete(name)}
      />

      {/* 4. Filtros e Tabela de Registros Históricos (Aparece apenas quando o painel de métricas está aberto) */}
      {isMetricsOpen && (
        <div className="w-full flex flex-col gap-6 animate-fadeIn">
          {/* Filtros de Matéria e Assunto */}
          <MetricFilters
            selectedSubject={selectedSubject}
            selectedTopic={selectedTopic}
            onSubjectChange={setSelectedSubject}
            onTopicChange={setSelectedTopic}
            subjects={uniqueSubjects}
            topics={uniqueTopics}
          />
          {/* Tabela/Lista dos registros de estudo */}
          <MetricList metrics={filteredMetrics} onDelete={deleteMetric} />
        </div>
      )}

      {/* POP-UP MODAL: Alerta customizado de confirmação para apagar matéria */}
      {materiaToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-bg-card border border-gray-700/50 p-6 rounded-3xl max-w-sm w-full flex flex-col gap-4 shadow-2xl text-center items-center">

            <div className="w-12 h-12 text-red-500 bg-red-500/10 p-2.5 rounded-2xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </div>

            <div>
              <h4 className="text-base font-bold text-white mb-1">Excluir matéria "{materiaToDelete}"?</h4>
              <p className="text-xs text-gray-400 font-medium">
                Tem certeza que deseja excluir esta matéria? Os assuntos e históricos vinculados a ela serão removidos.
              </p>
            </div>

            <div className="flex gap-2.5 w-full mt-2">
              <button
                type="button"
                onClick={() => setMateriaToDelete(null)}
                className="flex-1 py-2.5 px-4 bg-gray-800 text-gray-400 hover:text-white rounded-xl border border-gray-700 text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (materiaToDelete) {
                    await deleteMateria(materiaToDelete);
                    setMateriaToDelete(null);
                  }
                }}
                className="flex-1 py-2.5 px-4 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-500/20 transition-all cursor-pointer"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POP-UP MODAL: Alerta customizado de confirmação para limpar dados */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-bg-card border border-gray-700/50 p-6 rounded-3xl max-w-sm w-full flex flex-col gap-4 shadow-2xl text-center items-center">

            {/* Warning Icon */}
            <div className="w-12 h-12 text-red-500 bg-red-500/10 p-2.5 rounded-2xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <div>
              <h4 className="text-base font-bold text-white mb-1">Apagar registros de estudo?</h4>
              <p className="text-xs text-gray-400 font-medium">
                Tem certeza que deseja apagar os dados? Esse processo não é reversivel.
              </p>
            </div>

            <div className="flex gap-2.5 w-full mt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 px-4 bg-gray-800 text-gray-400 hover:text-white rounded-xl border border-gray-700 text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  clearMetrics();
                  setShowConfirmModal(false);
                }}
                className="flex-1 py-2.5 px-4 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-500/20 transition-all cursor-pointer"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
