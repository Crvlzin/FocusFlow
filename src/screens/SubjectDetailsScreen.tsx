import { useState, useMemo, useEffect, useRef } from 'react';
import { useRevision, getTodayDateString, addDays } from '../hooks/useRevision';
import { useStudyMetrics } from '../hooks/useStudyMetrics';
import { useCronograma } from '../hooks/useCronograma';
import { materiasService } from '../services/materiasService';
import type { DbMateria } from '../types';

interface SubjectDetailsScreenProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

export function SubjectDetailsScreen({ isSidebarOpen, setIsSidebarOpen }: SubjectDetailsScreenProps) {
  const {
    materias: revisionMaterias,
    assuntos,
    revisoes,
    addAssuntoDirect,
    scheduleRevisionForAssunto,
    deleteAssunto,
  } = useRevision();

  const { metrics } = useStudyMetrics();
  const { materias: cronogramaMaterias } = useCronograma();

  // Combina lista de matérias únicas do sistema
  const allMaterias = useMemo(() => {
    const map = new Map<string, DbMateria>();
    cronogramaMaterias.forEach((m) => map.set(m.id_materia, m));
    revisionMaterias.forEach((m) => {
      if (!map.has(m.id_materia)) map.set(m.id_materia, m);
    });
    return Array.from(map.values()).sort((a, b) => a.nm_materia.localeCompare(b.nm_materia));
  }, [cronogramaMaterias, revisionMaterias]);

  // Estado da Matéria Selecionada
  const [selectedMateriaId, setSelectedMateriaId] = useState<string | null>(null);

  // Se nada foi selecionado e houver matérias, seleciona a primeira automaticamente
  const activeMateria = useMemo(() => {
    if (selectedMateriaId) {
      return allMaterias.find((m) => m.id_materia === selectedMateriaId) || null;
    }
    return allMaterias.length > 0 ? allMaterias[0] : null;
  }, [allMaterias, selectedMateriaId]);

  // Estado do Dropdown Customizado de Matérias
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Estados do Filtro de Período Temporal ---
  const [periodFilter, setPeriodFilter] = useState<string>('7');
  const [customStartDate, setCustomStartDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [customEndDate, setCustomEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Anotações / Informações Gerais da Matéria Selecionada
  const [materiaAnotacao, setMateriaAnotacao] = useState('');

  // Carrega anotações da matéria ativa
  useEffect(() => {
    if (activeMateria) {
      const stored = localStorage.getItem('focusflow_materia_anotacao_' + activeMateria.id_materia);
      setMateriaAnotacao(stored || activeMateria.anotacao || '');
    } else {
      setMateriaAnotacao('');
    }
  }, [activeMateria]);

  // Salva anotações em tempo real
  const handleSaveMateriaAnotacao = (val: string) => {
    setMateriaAnotacao(val);
    if (activeMateria) {
      materiasService.updateMateriaAnotacao(activeMateria.id_materia, val);
    }
  };

  // Modais de Criação e Programação
  const [isAddAssuntoOpen, setIsAddAssuntoOpen] = useState(false);
  const [newAssuntoInput, setNewAssuntoInput] = useState('');

  const [schedulingAssuntoId, setSchedulingAssuntoId] = useState<string | null>(null);
  const [scheduleDateInput, setScheduleDateInput] = useState(() => addDays(getTodayDateString(), 1));

  // Assuntos da matéria ativa
  const materiaAssuntos = useMemo(() => {
    if (!activeMateria) return [];
    return assuntos.filter((a) => a.id_materia === activeMateria.id_materia);
  }, [assuntos, activeMateria]);

  // Métricas de exercícios da matéria ativa filtradas por período temporal
  const filteredMateriaMetrics = useMemo(() => {
    if (!activeMateria) return [];
    const matName = activeMateria.nm_materia.toLowerCase().trim();
    
    // 1. Filtra por Matéria
    const baseList = metrics.filter((m) => m.subject.toLowerCase().trim() === matName);

    // 2. Filtra por Período Temporal
    let cutoffTimeStart = 0;
    let cutoffTimeEnd = 0;

    if (periodFilter === 'custom') {
      if (customStartDate) cutoffTimeStart = new Date(customStartDate + 'T00:00:00').getTime();
      if (customEndDate) cutoffTimeEnd = new Date(customEndDate + 'T23:59:59').getTime();
    } else if (periodFilter !== 'all') {
      let days = 7;
      if (periodFilter === 'today' || periodFilter === '1') days = 1;
      else if (periodFilter === '7d' || periodFilter === '7') days = 7;
      else if (periodFilter === '15d' || periodFilter === '15') days = 15;
      else if (periodFilter === '30d' || periodFilter === '30') days = 30;

      const now = new Date();
      now.setHours(0, 0, 0, 0);
      now.setDate(now.getDate() - (days - 1));
      cutoffTimeStart = now.getTime();
    }

    return baseList.filter((item) => {
      if (!item.date) return true;
      const itemTime = new Date(item.date + 'T12:00:00').getTime();
      if (cutoffTimeStart > 0 && itemTime < cutoffTimeStart) return false;
      if (cutoffTimeEnd > 0 && itemTime > cutoffTimeEnd) return false;
      return true;
    });
  }, [metrics, activeMateria, periodFilter, customStartDate, customEndDate]);

  // Estatísticas consolidadas dinâmicas da matéria ativa baseadas no filtro de período
  const materiaStats = useMemo(() => {
    let totalMinutes = 0;
    let correct = 0;
    let wrong = 0;
    let totalQ = 0;

    filteredMateriaMetrics.forEach((m) => {
      totalMinutes += m.durationMinutes;
      correct += m.questionsCorrect;
      wrong += m.questionsWrong;
      totalQ += m.questionsTotal;
    });

    const accuracy = totalQ > 0 ? Math.round((correct / totalQ) * 100) : 0;
    return { totalMinutes, correct, wrong, totalQ, accuracy };
  }, [filteredMateriaMetrics]);

  // Revisões da matéria ativa
  const materiaRevisoes = useMemo(() => {
    if (!activeMateria) return [];
    const assuntoIds = new Set(materiaAssuntos.map((a) => a.id_assunto));
    return revisoes.filter((r) => assuntoIds.has(r.id_assunto));
  }, [revisoes, materiaAssuntos]);

  const pendingRevisoesCount = useMemo(() => {
    return materiaRevisoes.filter((r) => !r.fl_concluida).length;
  }, [materiaRevisoes]);



  // Handler para cadastrar Assunto
  const handleCreateAssunto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMateria || !newAssuntoInput.trim()) return;
    try {
      await addAssuntoDirect(activeMateria.id_materia, newAssuntoInput.trim());
      setNewAssuntoInput('');
      setIsAddAssuntoOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Handler para programar data de revisão de um assunto
  const handleConfirmScheduleRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulingAssuntoId) return;
    try {
      await scheduleRevisionForAssunto(schedulingAssuntoId, scheduleDateInput);
      setSchedulingAssuntoId(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Formatar tempo em horas e minutos
  const formatMinutes = (totalMinutes: number) => {
    if (totalMinutes === 0) return '0 min';
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours === 0) return `${mins} min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  // Formatar data legível
  const formatDateReadable = (dateStr: string) => {
    if (!dateStr) return '';
    const today = getTodayDateString();
    if (dateStr === today) return 'Hoje';
    if (dateStr === addDays(today, 1)) return 'Amanhã';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year.slice(-2)}`;
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 bg-bg-card/20 border border-gray-700/20 rounded-3xl backdrop-blur-md min-h-[600px] overflow-x-hidden animate-fadeIn gap-6">

      {/* 1. CABEÇALHO DA TELA + SELETOR DROPDOWN DE MATÉRIAS */}
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
                Detalhamento das Matérias
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent-primary/15 text-accent-primary border border-accent-primary/20">
                Análise Completa
              </span>
            </div>
            <p className="text-xs md:text-sm text-gray-400 mt-0.5">
              Consulte questões resolvidas, horas estudadas, próximas revisões e escreva anotações por disciplina.
            </p>
          </div>
        </div>

        {/* Lado Direito: Seletor em Dropdown + Botão Nova Matéria */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          
          {/* DROPDOWN DE MATÉRIAS */}
          <div className="relative w-full sm:w-64" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full px-4 py-2.5 rounded-xl bg-bg-card/80 border border-gray-700/80 hover:border-accent-primary text-white text-xs font-bold transition-all flex items-center justify-between gap-2 shadow-md cursor-pointer"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="w-2.5 h-2.5 rounded-full bg-accent-secondary flex-shrink-0" />
                <span className="truncate">
                  {activeMateria ? activeMateria.nm_materia : '-- Selecionar Matéria --'}
                </span>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180 text-accent-primary' : ''}`}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {/* Menu Suspenso */}
            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-full sm:w-72 bg-bg-dark border border-gray-700/80 rounded-2xl shadow-2xl z-50 py-2 animate-fadeIn max-h-72 overflow-y-auto custom-scrollbar">
                <div className="px-3 py-1.5 border-b border-gray-800 text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                  Disciplinas Cadastradas ({allMaterias.length})
                </div>

                {allMaterias.length === 0 ? (
                  <div className="p-3 text-xs text-gray-500 italic text-center">
                    Nenhuma matéria cadastrada
                  </div>
                ) : (
                  allMaterias.map((m) => {
                    const isSelected = activeMateria?.id_materia === m.id_materia;
                    return (
                      <button
                        key={m.id_materia}
                        type="button"
                        onClick={() => {
                          setSelectedMateriaId(m.id_materia);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full px-3.5 py-2.5 text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-accent-primary/20 text-accent-primary font-bold border-l-4 border-accent-primary'
                            : 'text-gray-300 hover:bg-bg-card hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-accent-primary' : 'bg-accent-secondary/60'}`} />
                          <span className="truncate">{m.nm_materia}</span>
                        </div>
                      </button>
                    );
                  })
                )}
                {allMaterias.length === 0 && (
                  <div className="p-3 text-xs text-gray-500 italic text-center">
                    Nenhuma matéria cadastrada
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. CONTEÚDO PRINCIPAL DA MATÉRIA SELECIONADA */}
      {!activeMateria ? (
        <div className="flex-1 p-8 rounded-3xl bg-bg-card/20 border border-dashed border-gray-800 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gray-800/60 flex items-center justify-center text-gray-400 mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18c-2.305 0-4.408.867-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-white">Nenhuma matéria cadastrada</h3>
          <p className="text-xs text-gray-400 max-w-sm">
            Cadastre suas matérias na tela de <strong className="text-accent-primary font-semibold">Estatísticas</strong> para visualizar os detalhamentos, métricas de questões, horas dedicadas e anotações aqui.
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-6 animate-fadeIn">
          
          {/* BARRA DE FILTRO DE PERÍODO TEMPORAL */}
          <div className="p-4 rounded-2xl bg-bg-card/40 border border-gray-800 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-accent-secondary">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-bold text-white">Filtrar Métricas por Período:</span>
            </div>

            {/* Cápsula de Botões de Período */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: '1', label: 'Hoje' },
                { id: '7', label: '7 dias' },
                { id: '15', label: '15 dias' },
                { id: '30', label: '30 dias' },
                { id: 'all', label: 'Todo o Período' },
                { id: 'custom', label: 'Personalizado' },
              ].map((p) => {
                const isActive = periodFilter === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPeriodFilter(p.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      isActive
                        ? 'bg-accent-primary text-white border-accent-primary shadow-md'
                        : 'bg-bg-dark/60 text-gray-400 border-gray-800 hover:text-white hover:border-gray-700'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Campos de Data Customizada quando o período for 'custom' */}
            {periodFilter === 'custom' && (
              <div className="flex items-center gap-2 animate-fadeIn w-full md:w-auto">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-bg-dark/80 text-white text-xs px-2.5 py-1.5 rounded-xl border border-gray-700 font-mono focus:outline-none focus:border-accent-primary"
                />
                <span className="text-xs text-gray-500 font-bold">até</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-bg-dark/80 text-white text-xs px-2.5 py-1.5 rounded-xl border border-gray-700 font-mono focus:outline-none focus:border-accent-primary"
                />
              </div>
            )}
          </div>

          {/* CARDS DE KPIS DA MATÉRIA (Horas Estudadas, Questões, Assuntos, Revisões Pendentes) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* KPI 1: HORAS ESTUDADAS NA MATÉRIA */}
            <div className="p-5 rounded-3xl bg-bg-card/40 border border-gray-800 backdrop-blur-md flex flex-col justify-between shadow-lg relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 font-display">
                  Horas Estudadas
                </span>
                <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/20">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>

              <div className="mt-3">
                <h3 className="text-2xl font-extrabold text-white font-mono tracking-tight">
                  {formatMinutes(materiaStats.totalMinutes)}
                </h3>
                <p className="text-[11px] text-gray-400 mt-1">Tempo no período selecionado</p>
              </div>
            </div>

            {/* KPI 2: TANTO DE QUESTÕES (RESOLVIDAS / ACERTO) */}
            <div className="p-5 rounded-3xl bg-bg-card/40 border border-gray-800 backdrop-blur-md flex flex-col justify-between shadow-lg relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 font-display">
                  Tanto de Questões
                </span>
                <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>

              <div className="mt-3">
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-extrabold text-white font-mono tracking-tight">
                    {materiaStats.totalQ} <span className="text-xs text-gray-400 font-normal">questões</span>
                  </h3>
                  <span className="text-xs font-extrabold text-emerald-400 font-mono">
                    ({materiaStats.accuracy}% acerto)
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-1 font-mono">
                  <span><strong className="text-emerald-400">{materiaStats.correct}</strong> certas</span>
                  <span>•</span>
                  <span><strong className="text-red-400">{materiaStats.wrong}</strong> erradas</span>
                </div>
              </div>
            </div>

            {/* KPI 3: ASSUNTOS CADASTRADOS */}
            <div className="p-5 rounded-3xl bg-bg-card/40 border border-gray-800 backdrop-blur-md flex flex-col justify-between shadow-lg relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 font-display">
                  Assuntos Cadastrados
                </span>
                <div className="p-2 rounded-xl bg-accent-primary/15 text-accent-primary border border-accent-primary/20">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18c-2.305 0-4.408.867-6 2.292m0-14.25v14.25" />
                  </svg>
                </div>
              </div>

              <div className="mt-3">
                <h3 className="text-2xl font-extrabold text-white font-mono tracking-tight">
                  {materiaAssuntos.length}
                </h3>
                <p className="text-[11px] text-gray-400 mt-1">Tópicos registrados na matéria</p>
              </div>
            </div>

            {/* KPI 4: REVISÕES PENDENTES */}
            <div className="p-5 rounded-3xl bg-bg-card/40 border border-gray-800 backdrop-blur-md flex flex-col justify-between shadow-lg relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 font-display">
                  Revisões Pendentes
                </span>
                <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/20">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3M3 12a48.29 48.29 0 017.324 0c1.884.143 3.42 1.547 3.7 3.439.092 1.21.138 2.43.138 3.661m0 0l-3-3m3 3l3-3" />
                  </svg>
                </div>
              </div>

              <div className="mt-3">
                <h3 className="text-2xl font-extrabold text-amber-400 font-mono tracking-tight">
                  {pendingRevisoesCount}
                </h3>
                <p className="text-[11px] text-gray-400 mt-1">Revisões pendentes/vencidas</p>
              </div>
            </div>

          </div>

          {/* PAINEL CENTRAL DIVIDIDO: (ESQUERDA) ANOTAÇÕES DA MATÉRIA + (DIREITA) PRÓXIMAS REVISÕES DOS ASSUNTOS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* ESQUERDA: CAMPO ONDE PODE ESCREVER INFORMAÇÕES / ANOTAÇÕES SOBRE A MATÉRIA (7 COLUNAS) */}
            <div className="lg:col-span-7 p-6 rounded-3xl bg-bg-card/40 border border-gray-800 backdrop-blur-md flex flex-col gap-3 shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-accent-secondary">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                    </svg>
                    Informações e Anotações da Matéria
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Escreva aqui resumos, pegadinhas, mapas mentais ou anotações gerais sobre <strong className="text-accent-secondary">{activeMateria.nm_materia}</strong>.
                  </p>
                </div>

                <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 flex-shrink-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Salvo automaticamente
                </span>
              </div>

              <textarea
                value={materiaAnotacao}
                onChange={(e) => handleSaveMateriaAnotacao(e.target.value)}
                placeholder={`Escreva aqui todas as informações importantes sobre ${activeMateria.nm_materia} (fórmulas, pontos de atenção, caderno de erros, observações de aulas...)...`}
                rows={12}
                className="w-full p-4 rounded-2xl bg-bg-dark/80 border border-gray-800 text-white text-xs md:text-sm leading-relaxed focus:outline-none focus:border-accent-primary placeholder-gray-600 resize-y font-sans shadow-inner"
              />
            </div>

            {/* DIREITA: AS PRÓXIMAS REVISÕES DE CADA ASSUNTO POR MATÉRIA (5 COLUNAS) */}
            <div className="lg:col-span-5 p-6 rounded-3xl bg-bg-card/40 border border-gray-800 backdrop-blur-md flex flex-col gap-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-amber-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Próximas Revisões por Assunto
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Datas das próximas revisões agendadas para cada tópico.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsAddAssuntoOpen(true);
                    setNewAssuntoInput('');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-accent-primary hover:bg-accent-primary/90 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex-shrink-0"
                >
                  + Assunto
                </button>
              </div>

              {materiaAssuntos.length === 0 ? (
                <div className="py-8 px-4 text-center border border-dashed border-gray-800 rounded-2xl bg-bg-dark/40 flex flex-col items-center justify-center">
                  <p className="text-xs text-gray-400 mb-2">Nenhum assunto cadastrado nesta matéria.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddAssuntoOpen(true);
                      setNewAssuntoInput('');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-accent-primary text-white text-xs font-bold cursor-pointer"
                  >
                    + Adicionar Primeiro Assunto
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                  {materiaAssuntos.map((ass) => {
                    // Busca revisão ativa do assunto
                    const rev = revisoes.find((r) => r.id_assunto === ass.id_assunto && !r.fl_concluida);
                    const isDueToday = rev && rev.dt_revisao <= getTodayDateString();

                    return (
                      <div
                        key={ass.id_assunto}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          isDueToday
                            ? 'bg-amber-500/10 border-amber-500/30'
                            : rev
                            ? 'bg-bg-dark/60 border-gray-800'
                            : 'bg-bg-dark/30 border-gray-800/50'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${rev ? 'bg-accent-primary' : 'bg-gray-600'}`} />
                            <h4 className="text-xs font-bold text-white truncate">
                              {ass.nm_assunto}
                            </h4>
                          </div>

                          {rev ? (
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400 font-mono">
                              <span>Próxima:</span>
                              <strong className={isDueToday ? 'text-amber-400 font-extrabold' : 'text-gray-200 font-semibold'}>
                                {formatDateReadable(rev.dt_revisao)}
                              </strong>
                              <span className="text-gray-600">•</span>
                              <span className="text-gray-500 text-[10px]">Nível {rev.nivel_ciclo}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-gray-500 italic mt-0.5 block">
                              Sem ciclo de revisão agendado
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {rev ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSchedulingAssuntoId(ass.id_assunto);
                                setScheduleDateInput(rev.dt_revisao);
                              }}
                              className="px-2.5 py-1 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-[10px] font-bold transition-all cursor-pointer"
                              title="Reagendar data"
                            >
                              📅 Reagendar
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setSchedulingAssuntoId(ass.id_assunto);
                                setScheduleDateInput(addDays(getTodayDateString(), 1));
                              }}
                              className="px-2.5 py-1 rounded-xl bg-accent-secondary/20 hover:bg-accent-secondary/30 text-accent-secondary border border-accent-secondary/30 text-[10px] font-bold transition-all cursor-pointer"
                            >
                              + Programar
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => deleteAssunto(ass.id_assunto)}
                            className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-gray-800 transition-colors cursor-pointer"
                            title="Excluir assunto"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* 3. SEÇÃO INFERIOR: HISTÓRICO DE QUESTÕES DA MATÉRIA FILTRADO POR PERÍODO */}
          <div className="p-6 rounded-3xl bg-bg-card/40 border border-gray-800 backdrop-blur-md flex flex-col gap-4 shadow-xl">
            <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-emerald-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
              Histórico de Resolução de Questões no Período ({filteredMateriaMetrics.length} sessões)
            </h3>

            {filteredMateriaMetrics.length === 0 ? (
              <div className="py-8 px-4 text-center border border-dashed border-gray-800 rounded-2xl bg-bg-dark/40 flex flex-col items-center justify-center">
                <p className="text-xs text-gray-400">Nenhum registro de estudo encontrado no período selecionado.</p>
              </div>
            ) : (
              <div className="w-full bg-bg-dark/50 border border-gray-800 rounded-2xl overflow-x-auto shadow-inner">
                <table className="w-full text-left border-collapse min-w-[600px] text-xs">
                  <thead>
                    <tr className="bg-bg-card/80 border-b border-gray-800 text-gray-400 font-display">
                      <th className="p-3">Data</th>
                      <th className="p-3">Assunto</th>
                      <th className="p-3">Duração</th>
                      <th className="p-3">Acertos / Erros</th>
                      <th className="p-3">Total Resolvidas</th>
                      <th className="p-3 text-right">% Aproveitamento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50 text-gray-200">
                    {filteredMateriaMetrics.map((m) => {
                      const acc = m.questionsTotal > 0 ? Math.round((m.questionsCorrect / m.questionsTotal) * 100) : 0;
                      return (
                        <tr key={m.id} className="hover:bg-white/[0.02]">
                          <td className="p-3 font-mono text-gray-400">{formatDateReadable(m.date)}</td>
                          <td className="p-3 font-semibold text-white">{m.topic}</td>
                          <td className="p-3 font-mono">{m.durationMinutes} min</td>
                          <td className="p-3 font-mono">
                            <span className="text-emerald-400">{m.questionsCorrect}</span> / <span className="text-red-400">{m.questionsWrong}</span>
                          </td>
                          <td className="p-3 font-mono">{m.questionsTotal}</td>
                          <td className="p-3 text-right font-extrabold font-mono text-accent-primary">{acc}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}



      {/* MODAL: Cadastrar Novo Assunto */}
      {isAddAssuntoOpen && activeMateria && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-bg-dark border border-gray-700/60 rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-white font-display mb-1">Novo Assunto</h3>
            <p className="text-xs text-gray-400 mb-4">Matéria: <strong className="text-accent-secondary">{activeMateria.nm_materia}</strong></p>
            <form onSubmit={handleCreateAssunto} className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="ex: Direitos Fundamentais, Leis de Newton..."
                value={newAssuntoInput}
                onChange={(e) => setNewAssuntoInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-bg-card/60 border border-gray-700 text-white text-sm focus:outline-none focus:border-accent-primary"
                autoFocus
                required
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddAssuntoOpen(false)}
                  className="px-4 py-2 rounded-xl text-gray-400 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-accent-primary text-white text-xs font-bold shadow-md shadow-accent-primary/30 hover:bg-opacity-90 cursor-pointer"
                >
                  Salvar Assunto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Programar / Reagendar Revisão de Assunto */}
      {schedulingAssuntoId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-bg-dark border border-gray-700/60 rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-white font-display mb-1">Programar / Reagendar Revisão</h3>
            <p className="text-xs text-gray-400 mb-4">
              Assunto: <strong className="text-accent-primary">{assuntos.find((a) => a.id_assunto === schedulingAssuntoId)?.nm_assunto}</strong>
            </p>

            <form onSubmit={handleConfirmScheduleRevision} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase">Data da Próxima Revisão *</label>
                <input
                  type="date"
                  value={scheduleDateInput}
                  onChange={(e) => setScheduleDateInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-bg-card/60 border border-gray-700 text-white text-sm font-mono focus:outline-none focus:border-accent-primary"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setSchedulingAssuntoId(null)}
                  className="px-4 py-2 rounded-xl text-gray-400 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-accent-primary text-white text-xs font-bold shadow-md shadow-accent-primary/30 hover:bg-opacity-90 cursor-pointer"
                >
                  Confirmar Programação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
