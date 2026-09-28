import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { materiasService } from '../services/materiasService';
import { estatisticasService } from '../services/estatisticasService';
import type { StudySessionMetric, DbEstatistica, DbMateria } from '../types';

export const formatLocalDate = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function useStudyMetrics() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<StudySessionMetric[]>([]);
  const [registeredMaterias, setRegisteredMaterias] = useState<DbMateria[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Estados de Filtros ---
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  // Filtro de período temporal ('7' | '15' | '30' | 'all' | 'custom') - Padrão: 7 dias
  const [periodFilter, setPeriodFilter] = useState<string>('7');

  // Estados de data customizada (De / Até) - Inicializa com a data de hoje no formato YYYY-MM-DD
  const [customStartDate, setCustomStartDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [customEndDate, setCustomEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Função para carregar dados do Supabase
  const loadMetrics = useCallback(async () => {
    if (!user) return;
    try {
      const [dbStats, mList] = await Promise.all([
        estatisticasService.fetchEstatisticas(),
        materiasService.fetchMaterias().catch(() => []),
      ]);
      
      // Mapeia os dados do Supabase para o formato legível das views existentes
      const mapped: StudySessionMetric[] = (dbStats as DbEstatistica[]).map((item) => {
        const certas = item.qtd_certas || 0;
        const erradas = item.qtd_erradas || 0;
        return {
          id: item.id_estatistica,
          subject: item.assuntos?.materias?.nm_materia || 'Geral',
          topic: item.assuntos?.nm_assunto || 'Outros',
          durationMinutes: item.qtd_minutos || 0,
          date: item.dt_registro ? item.dt_registro.split('T')[0] : formatLocalDate(),
          questionsCorrect: certas,
          questionsWrong: erradas,
          questionsTotal: certas + erradas,
        };
      });

      setMetrics(mapped);
      setRegisteredMaterias(mList);
    } catch (err) {
      console.error('Erro ao buscar estatísticas do Supabase:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let active = true;
    const fetchInitialMetrics = async () => {
      if (user) {
        setLoading(true);
        try {
          const [dbStats, mList] = await Promise.all([
            estatisticasService.fetchEstatisticas(),
            materiasService.fetchMaterias().catch(() => []),
          ]);
          const mapped: StudySessionMetric[] = (dbStats as DbEstatistica[]).map((item) => {
            const certas = item.qtd_certas || 0;
            const erradas = item.qtd_erradas || 0;
            return {
              id: item.id_estatistica,
              subject: item.assuntos?.materias?.nm_materia || 'Geral',
              topic: item.assuntos?.nm_assunto || 'Outros',
              durationMinutes: item.qtd_minutos || 0,
              date: item.dt_registro ? item.dt_registro.split('T')[0] : formatLocalDate(),
              questionsCorrect: certas,
              questionsWrong: erradas,
              questionsTotal: certas + erradas,
            };
          });
          if (active) {
            setMetrics(mapped);
            setRegisteredMaterias(mList);
          }
        } catch (err) {
          console.error(err);
        } finally {
          if (active) setLoading(false);
        }
      } else {
        setMetrics([]);
        setRegisteredMaterias([]);
        setLoading(false);
      }
    };
    fetchInitialMetrics();
    return () => {
      active = false;
    };
  }, [user]);

  // Invoca a limpeza de assunto quando a matéria for alterada no wrapper, evitando efeito colateral síncrono no render
  const changeSelectedSubject = (subject: string) => {
    setSelectedSubject(subject);
    setSelectedTopic('');
  };

  // --- Funções de Escrita de Dados ---
  const addMetric = async (newMetric: Omit<StudySessionMetric, 'id'>) => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Resolve id da matéria
      const materias = await materiasService.fetchMaterias();
      let materia = materias.find(
        (m) => m.nm_materia.toLowerCase().trim() === newMetric.subject.toLowerCase().trim()
      );
      if (!materia) {
        materia = await materiasService.addMateria(newMetric.subject);
      }

      // 2. Resolve id do assunto
      const assuntos = await materiasService.fetchAssuntos();
      let assunto = assuntos.find(
        (a) =>
          a.nm_assunto.toLowerCase().trim() === newMetric.topic.toLowerCase().trim() &&
          a.id_materia === materia!.id_materia
      );
      if (!assunto) {
        assunto = await materiasService.addAssunto(materia.id_materia, newMetric.topic);
      }

      // 3. Adiciona a estatística no Supabase
      await estatisticasService.addEstatistica(
        assunto.id_assunto,
        newMetric.questionsCorrect,
        newMetric.questionsWrong,
        newMetric.durationMinutes,
        newMetric.date
      );

      await loadMetrics();
    } catch (err) {
      console.error('Erro ao adicionar métrica no Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteMetric = async (id: string) => {
    if (window.confirm('Tem certeza de que deseja apagar este registro de estudos?')) {
      setLoading(true);
      try {
        await estatisticasService.deleteEstatistica(id);
        await loadMetrics();
      } catch (err) {
        console.error('Erro ao deletar métrica no Supabase:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const clearMetrics = async () => {
    if (window.confirm('Tem certeza de que deseja limpar TODO o seu histórico de estudos?')) {
      setLoading(true);
      try {
        await estatisticasService.clearEstatisticas();
        setMetrics([]);
        setSelectedSubject('');
        setSelectedTopic('');
        setPeriodFilter('7');
        const today = formatLocalDate();
        setCustomStartDate(today);
        setCustomEndDate(today);
      } catch (err) {
        console.error('Erro ao limpar histórico no Supabase:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  // --- Extração Dinâmica de Filtros Únicos ---

  // Obtém a lista de todas as matérias cadastradas (para preencher os selects e filtros)
  const uniqueSubjects = useMemo(() => {
    const set = new Set([
      ...registeredMaterias.map((m) => m.nm_materia.trim()),
      ...metrics.map((m) => m.subject.trim()),
    ]);
    return Array.from(set).sort();
  }, [registeredMaterias, metrics]);

  // Obtém a lista de todos os assuntos cadastrados para a matéria que está selecionada no momento
  const uniqueTopics = useMemo(() => {
    if (!selectedSubject) return [];
    const filtered = metrics.filter(
      (m) => m.subject.toLowerCase().trim() === selectedSubject.toLowerCase().trim()
    );
    const set = new Set(filtered.map((m) => m.topic.trim()));
    return Array.from(set).sort();
  }, [metrics, selectedSubject]);

  // --- Filtragem dos registros baseada no período, matéria e assunto ---
  const filteredMetrics = useMemo(() => {
    let cutoffTimeStart = 0;
    let cutoffTimeEnd = 0;

    if (periodFilter === 'custom') {
      if (customStartDate) {
        cutoffTimeStart = new Date(customStartDate + 'T00:00:00').getTime();
      }
      if (customEndDate) {
        cutoffTimeEnd = new Date(customEndDate + 'T23:59:59').getTime();
      }
    } else if (periodFilter !== 'all') {
      let days = 7;
      if (periodFilter === 'today' || periodFilter === '1') {
        days = 1;
      } else if (periodFilter === '7d' || periodFilter === '7') {
        days = 7;
      } else if (periodFilter === '30d' || periodFilter === '30') {
        days = 30;
      } else {
        const parsed = parseInt(periodFilter, 10);
        if (!isNaN(parsed)) days = parsed;
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days + 1); // +1 para incluir hoje
      cutoffDate.setHours(0, 0, 0, 0);
      cutoffTimeStart = cutoffDate.getTime();
    }

    return metrics.filter((m) => {
      // 1. Filtro por Data
      const sessionTime = new Date(m.date + 'T00:00:00').getTime();
      let matchDate = true;
      if (cutoffTimeStart > 0) {
        matchDate = matchDate && sessionTime >= cutoffTimeStart;
      }
      if (cutoffTimeEnd > 0) {
        matchDate = matchDate && sessionTime <= cutoffTimeEnd;
      }

      // 2. Filtros por Matéria e Assunto
      const matchSubject = !selectedSubject || m.subject.toLowerCase().trim() === selectedSubject.toLowerCase().trim();
      const matchTopic = !selectedTopic || m.topic.toLowerCase().trim() === selectedTopic.toLowerCase().trim();
      
      return matchDate && matchSubject && matchTopic;
    });
  }, [metrics, periodFilter, customStartDate, customEndDate, selectedSubject, selectedTopic]);

  // --- Gráfico de Barras Verticais: Cálculo das colunas diárias (Dia a Dia) ---
  const dailyPoints = useMemo(() => {
    let daysCount = 7;
    let baseEndDateStr = formatLocalDate();

    if (periodFilter === 'custom') {
      const startMs = new Date(customStartDate + 'T00:00:00').getTime();
      const endMs = new Date(customEndDate + 'T23:59:59').getTime();
      const diffMs = Math.abs(endMs - startMs);
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      
      // Limita a exibição do gráfico a no máximo os últimos 15 dias do intervalo customizado para caber na tela
      daysCount = Math.max(1, Math.min(diffDays, 15));
      baseEndDateStr = customEndDate;
    } else if (periodFilter !== 'all') {
      let days = 7;
      if (periodFilter === 'today' || periodFilter === '1') {
        days = 1;
      } else if (periodFilter === '7d' || periodFilter === '7') {
        days = 7;
      } else if (periodFilter === '30d' || periodFilter === '30') {
        days = 30;
      } else {
        const parsed = parseInt(periodFilter, 10);
        if (!isNaN(parsed)) days = parsed;
      }
      // Para o período padrão de 30 dias, limitamos a 15 colunas para melhor espaçamento
      daysCount = days > 15 ? 15 : days;
    }

    const points = [];
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(baseEndDateStr + 'T00:00:00');
      d.setDate(d.getDate() - i);
      const dateStr = formatLocalDate(d);
      
      // Filtra os registros que caíram no dia em questão, considerando também os filtros de disciplina selecionados
      const dayMetrics = metrics.filter(m => {
        const matchDate = m.date === dateStr;
        const matchSubject = !selectedSubject || m.subject.toLowerCase().trim() === selectedSubject.toLowerCase().trim();
        const matchTopic = !selectedTopic || m.topic.toLowerCase().trim() === selectedTopic.toLowerCase().trim();
        return matchDate && matchSubject && matchTopic;
      });
      
      const correct = dayMetrics.reduce((acc, curr) => acc + curr.questionsCorrect, 0);
      const total = dayMetrics.reduce((acc, curr) => acc + curr.questionsTotal, 0);
      const wrong = dayMetrics.reduce((acc, curr) => acc + curr.questionsWrong, 0);
      
      // Rótulo: Dia/Mês (ex: 04/07)
      const label = d.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
      
      points.push({
        dateStr,
        label,
        correct,
        wrong,
        total,
      });
    }
    return points;
  }, [metrics, periodFilter, customStartDate, customEndDate, selectedSubject, selectedTopic]);

  // --- Estatísticas Computadas (Agregados para KPIs e Relatório de Disciplinas) ---
  const analytics = useMemo(() => {
    let totalMinutes = 0;
    let questionsCorrect = 0;
    let questionsWrong = 0;
    let questionsTotal = 0;

    // Agrupamento auxiliar por matéria
    const subjectMap: Record<string, { minutes: number; totalQ: number; correctQ: number; wrongQ: number }> = {};

    filteredMetrics.forEach((m) => {
      totalMinutes += m.durationMinutes;
      questionsCorrect += m.questionsCorrect;
      questionsWrong += m.questionsWrong;
      questionsTotal += m.questionsTotal;

      // Agrupa os minutos e acertos por matéria
      const key = m.subject.trim();
      if (!subjectMap[key]) {
        subjectMap[key] = { minutes: 0, totalQ: 0, correctQ: 0, wrongQ: 0 };
      }
      subjectMap[key].minutes += m.durationMinutes;
      subjectMap[key].totalQ += m.questionsTotal;
      subjectMap[key].correctQ += m.questionsCorrect;
      subjectMap[key].wrongQ += m.questionsWrong;
    });

    const accuracyRate = questionsTotal > 0 ? (questionsCorrect / questionsTotal) * 100 : 0;

    // Converte o agrupamento de matérias para uma lista organizada
    const subjectStats = Object.keys(subjectMap).map((subj) => ({
      subject: subj,
      minutes: subjectMap[subj].minutes,
      questionsTotal: subjectMap[subj].totalQ,
      questionsCorrect: subjectMap[subj].correctQ,
      questionsWrong: subjectMap[subj].wrongQ,
      accuracyRate: subjectMap[subj].totalQ > 0 ? (subjectMap[subj].correctQ / subjectMap[subj].totalQ) * 100 : 0,
    })).sort((a, b) => b.questionsTotal - a.questionsTotal); // ordena por volume de questões resolvidas

    return {
      totalMinutes,
      questionsCorrect,
      questionsWrong,
      questionsTotal,
      accuracyRate,
      subjectStats,
    };
  }, [filteredMetrics]);

  // --- Cálculo da Ofensiva (Streak) em Dias Consecutivos ---
  const streakDays = useMemo(() => {
    if (!metrics || metrics.length === 0) return 0;
    
    // Coleta todas as datas únicas com estudo registrado (formato YYYY-MM-DD)
    const activeDates = new Set(metrics.map((m) => m.date));
    const todayStr = formatLocalDate(new Date());
    
    const getSubtractedDateStr = (daysAgo: number) => {
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      return formatLocalDate(d);
    };

    let count = 0;
    let currentCheckDaysAgo = 0;

    // Se hoje ainda não teve registro de estudos, verifica se ontem teve para não zerar a ofensiva do dia
    if (!activeDates.has(todayStr)) {
      const yesterdayStr = getSubtractedDateStr(1);
      if (!activeDates.has(yesterdayStr)) {
        return 0; // Nem hoje nem ontem teve estudo, ofensiva zerada
      }
      currentCheckDaysAgo = 1; // Começa a contar de ontem
    }

    // Incrementa enquanto houverem dias consecutivos no passado com registros de estudo
    while (activeDates.has(getSubtractedDateStr(currentCheckDaysAgo))) {
      count++;
      currentCheckDaysAgo++;
    }

    return count;
  }, [metrics]);

  const addMateria = async (nmMateria: string) => {
    setLoading(true);
    try {
      const newMat = await materiasService.addMateria(nmMateria);
      setRegisteredMaterias((prev) => [...prev, newMat]);
      await loadMetrics();
      return newMat;
    } catch (err) {
      console.error('Erro ao adicionar matéria:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteMateria = async (idOrName: string) => {
    setLoading(true);
    try {
      const mat = registeredMaterias.find(
        (m) =>
          m.id_materia === idOrName ||
          m.nm_materia.toLowerCase().trim() === idOrName.toLowerCase().trim()
      );
      if (mat) {
        await materiasService.deleteMateria(mat.id_materia);
        setRegisteredMaterias((prev) => prev.filter((m) => m.id_materia !== mat.id_materia));
      }
      await loadMetrics();
    } catch (err) {
      console.error('Erro ao deletar matéria:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    metrics,
    registeredMaterias,
    filteredMetrics,
    selectedSubject,
    selectedTopic,
    setSelectedSubject: changeSelectedSubject,
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
    streakDays,
    addMetric,
    addMateria,
    deleteMateria,
    deleteMetric,
    clearMetrics,
    loading,
  };
}

