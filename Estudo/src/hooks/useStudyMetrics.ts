import { useState, useEffect, useMemo } from 'react';
import type { StudySessionMetric } from '../types';

const METRICS_STORAGE_KEY = 'estudo_study_metrics';

export function useStudyMetrics() {
  // --- Estado principal: Lista de todas as sessões registradas ---
  const [metrics, setMetrics] = useState<StudySessionMetric[]>(() => {
    const saved = localStorage.getItem(METRICS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  // --- Estados de Filtros ---
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  // Filtro de período temporal ('7' | '15' | '30' | 'all' | 'custom') - Padrão: 7 dias
  const [periodFilter, setPeriodFilter] = useState<string>('7');

  // Estados de data customizada (De / Até) - Inicializa com a data de hoje no formato YYYY-MM-DD
  const [customStartDate, setCustomStartDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [customEndDate, setCustomEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Persiste a lista de métricas no localStorage toda vez que for alterada
  useEffect(() => {
    localStorage.setItem(METRICS_STORAGE_KEY, JSON.stringify(metrics));
  }, [metrics]);

  // Se a matéria mudar, limpamos o filtro de assunto, pois os assuntos pertencem a matérias específicas
  useEffect(() => {
    setSelectedTopic('');
  }, [selectedSubject]);

  // --- Funções de Escrita de Dados ---

  const addMetric = (newMetric: Omit<StudySessionMetric, 'id'>) => {
    const record: StudySessionMetric = {
      ...newMetric,
      id: crypto.randomUUID(),
    };
    setMetrics((prev) => [record, ...prev]);
  };

  const deleteMetric = (id: string) => {
    if (window.confirm('Tem certeza de que deseja apagar este registro de estudos?')) {
      setMetrics((prev) => prev.filter((m) => m.id !== id));
    }
  };

  const clearMetrics = () => {
    setMetrics([]);
    setSelectedSubject('');
    setSelectedTopic('');
    setPeriodFilter('7');
    const today = new Date().toISOString().split('T')[0];
    setCustomStartDate(today);
    setCustomEndDate(today);
  };

  // --- Extração Dinâmica de Filtros Únicos ---

  // Obtém a lista de todas as matérias cadastradas (para preencher o select de filtros)
  const uniqueSubjects = useMemo(() => {
    const set = new Set(metrics.map((m) => m.subject.trim()));
    return Array.from(set).sort();
  }, [metrics]);

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
      const days = Number(periodFilter);
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
    let baseEndDateStr = new Date().toISOString().split('T')[0];

    if (periodFilter === 'custom') {
      const startMs = new Date(customStartDate + 'T00:00:00').getTime();
      const endMs = new Date(customEndDate + 'T23:59:59').getTime();
      const diffMs = Math.abs(endMs - startMs);
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      
      // Limita a exibição do gráfico a no máximo os últimos 15 dias do intervalo customizado para caber na tela
      daysCount = Math.max(1, Math.min(diffDays, 15));
      baseEndDateStr = customEndDate;
    } else if (periodFilter !== 'all') {
      daysCount = Number(periodFilter);
      // Para o período padrão de 30 dias, limitamos a 15 colunas para melhor espaçamento
      daysCount = daysCount > 15 ? 15 : daysCount;
    }

    const points = [];
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(baseEndDateStr + 'T00:00:00');
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
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

  return {
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
    deleteMetric,
    clearMetrics,
  };
}
