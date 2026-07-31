import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { materiasService } from '../services/materiasService';
import { revisoesService } from '../services/revisoesService';
import type { DbMateria, DbAssunto, DbRevisao } from '../types';

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + 'T12:00:00');
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function useRevision() {
  const { user } = useAuth();
  const [materias, setMaterias] = useState<DbMateria[]>([]);
  const [assuntos, setAssuntos] = useState<DbAssunto[]>([]);
  const [revisoes, setRevisoes] = useState<DbRevisao[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar dados iniciais do Supabase
  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [mList, aList, rList] = await Promise.all([
        materiasService.fetchMaterias(),
        materiasService.fetchAssuntos(),
        revisoesService.fetchRevisoes(),
      ]);
      setMaterias(mList);
      setAssuntos(aList);
      setRevisoes(rList);
    } catch (err) {
      console.error('Erro ao carregar dados de revisões:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let active = true;
    const fetchInitialData = async () => {
      if (user) {
        setLoading(true);
        try {
          const [mList, aList, rList] = await Promise.all([
            materiasService.fetchMaterias(),
            materiasService.fetchAssuntos(),
            revisoesService.fetchRevisoes(),
          ]);
          if (active) {
            setMaterias(mList);
            setAssuntos(aList);
            setRevisoes(rList);
          }
        } catch (err) {
          console.error(err);
        } finally {
          if (active) setLoading(false);
        }
      } else {
        setMaterias([]);
        setAssuntos([]);
        setRevisoes([]);
        setLoading(false);
      }
    };
    fetchInitialData();
    return () => {
      active = false;
    };
  }, [user]);

  // Adicionar um assunto no ciclo de Ebbinghaus
  const addRevisionTopic = async (nmMateria: string, nmAssunto: string) => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Verifica ou cria Matéria
      let materia = materias.find(
        (m) => m.nm_materia.toLowerCase().trim() === nmMateria.toLowerCase().trim()
      );
      if (!materia) {
        materia = await materiasService.addMateria(nmMateria);
        setMaterias((prev) => [...prev, materia!]);
      }

      // 2. Verifica ou cria Assunto
      let assunto = assuntos.find(
        (a) =>
          a.nm_assunto.toLowerCase().trim() === nmAssunto.toLowerCase().trim() &&
          a.id_materia === materia!.id_materia
      );
      if (!assunto) {
        assunto = await materiasService.addAssunto(materia.id_materia, nmAssunto);
        setAssuntos((prev) => [...prev, assunto!]);
      }

      // 3. Agenda primeira revisão (Amanhã - 24h)
      const tomorrow = addDays(getTodayDateString(), 1);
      await revisoesService.addRevisao(assunto.id_assunto, tomorrow, 1);
      
      // Atualiza estado local de revisões
      await loadData();
    } catch (err) {
      console.error('Erro ao adicionar tópico de revisão:', err);
    } finally {
      setLoading(false);
    }
  };

  // Concluir uma revisão e programar a próxima no ciclo
  const completeRevision = async (idRevisao: string, rating: 'forgot' | 'hard' | 'good' | 'easy') => {
    setLoading(true);
    try {
      const today = getTodayDateString();
      const current = revisoes.find((r) => r.id_revisao === idRevisao);
      if (!current) return;

      // Conclui a revisão atual no Supabase
      await revisoesService.completeRevisao(idRevisao, today);

      if (rating === 'forgot') {
        // Se esqueceu, apaga as revisões pendentes futuras desse assunto e reinicia o ciclo
        await revisoesService.deleteRevisoesDoAssunto(current.id_assunto);
        const tomorrow = addDays(today, 1);
        await revisoesService.addRevisao(current.id_assunto, tomorrow, 1);
      } else {
        // Se lembrou, agenda o próximo nível do ciclo se ainda não for o final (nível 4)
        if (current.nivel_ciclo < 4) {
          const nextNivel = current.nivel_ciclo + 1;
          let daysToAdd = 1;
          
          if (nextNivel === 2) daysToAdd = 6;       // 1d + 6d = 7d
          else if (nextNivel === 3) daysToAdd = 8;  // 7d + 8d = 15d
          else if (nextNivel === 4) daysToAdd = 15; // 15d + 15d = 30d

          const nextDate = addDays(today, daysToAdd);
          await revisoesService.addRevisao(current.id_assunto, nextDate, nextNivel);
        }
      }

      await loadData();
    } catch (err) {
      console.error('Erro ao concluir revisão:', err);
    } finally {
      setLoading(false);
    }
  };

  // Excluir um ciclo de revisões (deleta todas as revisões do assunto)
  const deleteRevisionTopic = async (idRevisao: string) => {
    const target = revisoes.find((r) => r.id_revisao === idRevisao);
    if (!target) return;

    if (window.confirm('Tem certeza de que deseja excluir este ciclo de revisões?')) {
      setLoading(true);
      try {
        await revisoesService.deleteRevisoesDoAssunto(target.id_assunto);
        await loadData();
      } catch (err) {
        console.error('Erro ao excluir ciclo de revisões:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  // Reiniciar o ciclo de um assunto
  const resetRevisionCycle = async (idRevisao: string) => {
    const target = revisoes.find((r) => r.id_revisao === idRevisao);
    if (!target) return;

    if (window.confirm('Tem certeza de que deseja reiniciar o ciclo de revisões para este assunto?')) {
      setLoading(true);
      try {
        await revisoesService.deleteRevisoesDoAssunto(target.id_assunto);
        const tomorrow = addDays(getTodayDateString(), 1);
        await revisoesService.addRevisao(target.id_assunto, tomorrow, 1);
        await loadData();
      } catch (err) {
        console.error('Erro ao reiniciar ciclo:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  // Separar revisões de hoje vs futuras com base na data de agendamento
  const today = getTodayDateString();
  const { todayRevisions, upcomingRevisions } = useMemo(() => {
    const todayList: DbRevisao[] = [];
    const upcomingList: DbRevisao[] = [];

    // Consideramos apenas as revisões que NÃO foram concluídas
    revisoes.forEach((r) => {
      if (!r.fl_concluida) {
        if (r.dt_revisao <= today) {
          todayList.push(r);
        } else {
          upcomingList.push(r);
        }
      }
    });

    return {
      todayRevisions: todayList,
      upcomingRevisions: upcomingList,
    };
  }, [revisoes, today]);

  // Salvar/Atualizar Anotação de um Assunto
  const saveAssuntoAnotacao = async (idAssunto: string, anotacao: string) => {
    setAssuntos((prev) =>
      prev.map((a) => (a.id_assunto === idAssunto ? { ...a, anotacao } : a))
    );
    try {
      await materiasService.updateAssuntoAnotacao(idAssunto, anotacao);
    } catch (err) {
      console.warn('Erro ao salvar anotação:', err);
    }
  };

  // Deletar um assunto diretamente
  const deleteAssunto = async (idAssunto: string) => {
    if (window.confirm('Tem certeza de que deseja apagar este assunto?')) {
      setLoading(true);
      try {
        await revisoesService.deleteRevisoesDoAssunto(idAssunto);
        await materiasService.deleteAssunto(idAssunto);
        await loadData();
      } catch (err) {
        console.error('Erro ao deletar assunto:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  // Adicionar um assunto diretamente para uma matéria
  const addAssuntoDirect = async (idMateria: string, nmAssunto: string) => {
    if (!nmAssunto.trim()) return;
    setLoading(true);
    try {
      const newAssunto = await materiasService.addAssunto(idMateria, nmAssunto.trim());
      setAssuntos((prev) => [...prev, newAssunto]);
      
      // Agenda primeira revisão (24h)
      const tomorrow = addDays(getTodayDateString(), 1);
      await revisoesService.addRevisao(newAssunto.id_assunto, tomorrow, 1);
      await loadData();
    } catch (err) {
      console.error('Erro ao adicionar assunto:', err);
    } finally {
      setLoading(false);
    }
  };

  // Programar/Iniciar um ciclo de revisão para um assunto existente
  const scheduleRevisionForAssunto = async (idAssunto: string, targetDate?: string) => {
    setLoading(true);
    try {
      const dt = targetDate || addDays(getTodayDateString(), 1);
      // Apaga revisões existentes para reiniciar/agendar novo ciclo limpo
      await revisoesService.deleteRevisoesDoAssunto(idAssunto);
      await revisoesService.addRevisao(idAssunto, dt, 1);
      await loadData();
    } catch (err) {
      console.error('Erro ao programar revisão para assunto:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    materias,
    assuntos,
    revisoes,
    todayRevisions,
    upcomingRevisions,
    loading,
    addRevisionTopic,
    addAssuntoDirect,
    scheduleRevisionForAssunto,
    completeRevision,
    deleteRevisionTopic,
    deleteAssunto,
    resetRevisionCycle,
    saveAssuntoAnotacao,
    refresh: loadData,
  };
}


