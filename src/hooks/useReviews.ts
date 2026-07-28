import { useState, useEffect, useMemo } from 'react';
import type { ReviewTopic, ReviewHistoryEntry } from '../types';

const REVIEWS_STORAGE_KEY = 'estudo_ebbinghaus_reviews';

// Auxiliar para obter a data de hoje no formato YYYY-MM-DD local
function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Auxiliar para adicionar dias a uma data YYYY-MM-DD de forma segura
function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + 'T12:00:00'); // Evita problemas de fuso horário
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function useReviews() {
  const [reviews, setReviews] = useState<ReviewTopic[]>(() => {
    const saved = localStorage.getItem(REVIEWS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  // Persiste no localStorage
  useEffect(() => {
    localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
  }, [reviews]);

  // Adicionar um novo assunto para revisão
  const addReviewTopic = (subject: string, topic: string) => {
    const today = getTodayDateString();
    const newTopic: ReviewTopic = {
      id: crypto.randomUUID(),
      subject: subject.trim(),
      topic: topic.trim(),
      createdAt: today,
      lastReviewedAt: null,
      nextReviewAt: addDays(today, 1), // 1ª revisão é 24h depois (amanhã)
      intervalDays: 1,
      repetitionCount: 0, // Nenhuma revisão feita ainda
      easinessFactor: 2.5,
      completed: false,
      history: [],
    };
    setReviews((prev) => [newTopic, ...prev]);
  };

  // Registrar uma revisão concluída e calcular o próximo intervalo
  const completeReview = (id: string, rating: 'forgot' | 'hard' | 'good' | 'easy') => {
    const today = getTodayDateString();
    
    setReviews((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        // Criar registro de histórico
        const historyEntry: ReviewHistoryEntry = {
          id: crypto.randomUUID(),
          date: today,
          rating,
        };

        const updatedHistory = [...item.history, historyEntry];

        let nextInterval: number;
        let nextRepCount = item.repetitionCount;
        let nextEF: number;
        let isCompleted = item.completed;

        if (rating === 'forgot') {
          // Errou/Esqueceu: reinicia o ciclo
          nextInterval = 1;
          nextRepCount = 0;
          nextEF = Math.max(1.3, item.easinessFactor - 0.2);
        } else {
          // Sucesso: incrementa contagem
          nextRepCount += 1;
          
          // Ajusta o Easiness Factor (Fator de Facilidade) baseado na resposta (Algoritmo SM-2 adaptado)
          // rating: easy (q=5), good (q=4), hard (q=3)
          let q = 4;
          if (rating === 'easy') q = 5;
          if (rating === 'hard') q = 3;

          nextEF = item.easinessFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
          nextEF = Math.max(1.3, nextEF);

          // Determina o próximo intervalo em dias com base no estágio da Curva de Ebbinghaus
          // Estágios clássicos:
          // Rep 1 (pós-24h): próxima revisão em 7 dias após o estudo inicial (esperar +6 dias)
          // Rep 2 (pós-7d): próxima revisão em 15 dias após o estudo inicial (esperar +8 dias)
          // Rep 3 (pós-15d): próxima revisão em 30 dias após o estudo inicial (esperar +15 dias)
          // Rep 4 (pós-30d): ciclo completo. Próxima em 30 dias adicionais ou mais (multiplica pelo fator de facilidade)
          if (nextRepCount === 1) {
            nextInterval = 6; // Espera 6 dias (24h + 6d = 7d)
          } else if (nextRepCount === 2) {
            nextInterval = 8; // Espera 8 dias (7d + 8d = 15d)
          } else if (nextRepCount === 3) {
            nextInterval = 15; // Espera 15 dias (15d + 15d = 30d)
          } else {
            // A partir do estágio 4, concluiu o ciclo básico de Ebbinghaus
            isCompleted = true;
            nextInterval = Math.round(item.intervalDays * nextEF);
            // Garante que o intervalo pós-30 dias não encolha absurdamente a menos que tenha esquecido
            nextInterval = Math.max(30, nextInterval);
          }
        }

        const nextDate = addDays(today, nextInterval);

        return {
          ...item,
          lastReviewedAt: today,
          nextReviewAt: nextDate,
          intervalDays: nextInterval,
          repetitionCount: nextRepCount,
          easinessFactor: nextEF,
          completed: isCompleted,
          history: updatedHistory,
        };
      })
    );
  };

  // Excluir um assunto
  const deleteReviewTopic = (id: string) => {
    if (window.confirm('Tem certeza de que deseja excluir este assunto do ciclo de revisões?')) {
      setReviews((prev) => prev.filter((item) => item.id !== id));
    }
  };

  // Reiniciar ciclo
  const resetReviewCycle = (id: string) => {
    const today = getTodayDateString();
    setReviews((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          lastReviewedAt: null,
          nextReviewAt: addDays(today, 1),
          intervalDays: 1,
          repetitionCount: 0,
          easinessFactor: 2.5,
          completed: false,
          history: [],
        };
      })
    );
  };

  // Separação de revisões pendentes/atrasadas vs futuras
  const today = getTodayDateString();
  const { todayReviews, upcomingReviews } = useMemo(() => {
    const todayReviewsList: ReviewTopic[] = [];
    const upcomingReviewsList: ReviewTopic[] = [];

    reviews.forEach((item) => {
      // Se a data de agendamento é hoje ou já passou, precisa revisar hoje
      if (item.nextReviewAt <= today) {
        todayReviewsList.push(item);
      } else {
        upcomingReviewsList.push(item);
      }
    });

    // Ordena as de hoje por urgência (as mais atrasadas primeiro)
    todayReviewsList.sort((a, b) => a.nextReviewAt.localeCompare(b.nextReviewAt));
    // Ordena as futuras pela data mais próxima
    upcomingReviewsList.sort((a, b) => a.nextReviewAt.localeCompare(b.nextReviewAt));

    return {
      todayReviews: todayReviewsList,
      upcomingReviews: upcomingReviewsList,
    };
  }, [reviews, today]);

  return {
    reviews,
    todayReviews,
    upcomingReviews,
    addReviewTopic,
    completeReview,
    deleteReviewTopic,
    resetReviewCycle,
  };
}
