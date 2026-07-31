import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { cronogramaService } from '../services/cronogramaService';
import type { CreateCronogramaDTO, UpdateCronogramaDTO } from '../services/cronogramaService';

import { materiasService } from '../services/materiasService';
import type { DbCronograma, DbMateria } from '../types';

export const DIAS_DA_SEMANA = [
  { id: 1, label: 'Segunda-Feira', short: 'Segunda' },
  { id: 2, label: 'Terça-Feira', short: 'Terça' },
  { id: 3, label: 'Quarta-Feira', short: 'Quarta' },
  { id: 4, label: 'Quinta-Feira', short: 'Quinta' },
  { id: 5, label: 'Sexta-Feira', short: 'Sexta' },
  { id: 6, label: 'Sábado', short: 'Sábado' },
  { id: 0, label: 'Domingo', short: 'Domingo' },
];


export function useCronograma() {
  const { user } = useAuth();
  const [items, setItems] = useState<DbCronograma[]>([]);
  const [materias, setMaterias] = useState<DbMateria[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Dia atual da semana (0 = Domingo, 1 = Segunda, ..., 6 = Sábado)
  const todayIndex = useMemo(() => new Date().getDay(), []);

  const LOCAL_STORAGE_KEY = 'focusflow_cronograma_fallback';

  // Carregar itens e matérias
  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [cronogramaData, materiasData] = await Promise.all([
        cronogramaService.fetchCronograma().catch((err) => {
          console.warn('Tabela cronograma no Supabase não encontrada ou indisponível. Usando armazenamento local temporário.', err);
          setError('A tabela "cronograma" não foi encontrada no seu Supabase. Execute a última seção do arquivo schema.sql no SQL Editor do Supabase.');
          const local = localStorage.getItem(LOCAL_STORAGE_KEY);
          return local ? (JSON.parse(local) as DbCronograma[]) : [];
        }),
        materiasService.fetchMaterias().catch(() => []),
      ]);
      setItems(cronogramaData);
      setMaterias(materiasData);
    } catch (err: unknown) {
      console.error('Erro ao carregar cronograma:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);


  useEffect(() => {
    loadData();
  }, [loadData]);

  // Itens organizados por dia
  const getItemsByDay = useCallback(
    (dayIndex: number) => {
      return items
        .filter((item) => item.dia_semana === dayIndex)
        .sort((a, b) => {
          if (a.horario_inicio && b.horario_inicio) {
            return a.horario_inicio.localeCompare(b.horario_inicio);
          }
          return a.ordem - b.ordem;
        });
    },
    [items]
  );

  // Itens do dia de hoje
  const todayItems = useMemo(() => {
    return getItemsByDay(todayIndex);
  }, [getItemsByDay, todayIndex]);

  // Métricas do dia de hoje
  const todayStats = useMemo(() => {
    const total = todayItems.length;
    const completed = todayItems.filter((i) => i.fl_concluido).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percent };
  }, [todayItems]);

  const saveToLocal = (newItems: DbCronograma[]) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newItems));
  };

  // Adicionar item
  const addItem = async (itemDTO: CreateCronogramaDTO) => {
    try {
      const newItem = await cronogramaService.addCronogramaItem(itemDTO);
      setItems((prev) => {
        const next = [...prev, newItem];
        saveToLocal(next);
        return next;
      });
      return newItem;
    } catch (err: unknown) {
      console.warn('Falha no Supabase. Salvando item localmente:', err);
      const matchedMateria = materias.find((m) => m.id_materia === itemDTO.id_materia);
      const fallbackItem: DbCronograma = {
        id_cronograma: 'local_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        id_usuario: user?.id || 'local',
        dia_semana: itemDTO.dia_semana,
        titulo_estudo: itemDTO.titulo_estudo.trim(),
        id_materia: itemDTO.id_materia || null,
        horario_inicio: itemDTO.horario_inicio || null,
        horario_fim: itemDTO.horario_fim || null,
        observacao: itemDTO.observacao || null,
        fl_concluido: false,
        ordem: itemDTO.ordem ?? 0,
        materias: matchedMateria || null,
      };
      setItems((prev) => {
        const next = [...prev, fallbackItem];
        saveToLocal(next);
        return next;
      });
      return fallbackItem;
    }
  };

  // Atualizar item
  const updateItem = async (id: string, updates: UpdateCronogramaDTO) => {
    try {
      const updated = await cronogramaService.updateCronogramaItem(id, updates);
      setItems((prev) => {
        const next = prev.map((item) => (item.id_cronograma === id ? updated : item));
        saveToLocal(next);
        return next;
      });
      return updated;
    } catch (err: unknown) {
      console.warn('Falha ao atualizar no Supabase. Atualizando localmente:', err);
      const matchedMateria = updates.id_materia
        ? materias.find((m) => m.id_materia === updates.id_materia)
        : null;

      setItems((prev) => {
        const next = prev.map((item) => {
          if (item.id_cronograma !== id) return item;
          return {
            ...item,
            ...updates,
            materias: matchedMateria !== undefined ? matchedMateria : item.materias,
          };
        });
        saveToLocal(next);
        return next;
      });
    }
  };

  // Alternar concluído
  const toggleItemConcluido = async (id: string) => {
    const item = items.find((i) => i.id_cronograma === id);
    if (!item) return;
    const newStatus = !item.fl_concluido;

    setItems((prev) => {
      const next = prev.map((i) => (i.id_cronograma === id ? { ...i, fl_concluido: newStatus } : i));
      saveToLocal(next);
      return next;
    });

    try {
      await cronogramaService.toggleConcluido(id, newStatus);
    } catch (err: unknown) {
      console.warn('Não foi possível sincronizar o status com Supabase (salvo localmente).', err);
    }
  };

  // Deletar item
  const deleteItem = async (id: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.id_cronograma !== id);
      saveToLocal(next);
      return next;
    });

    try {
      await cronogramaService.deleteCronogramaItem(id);
    } catch (err: unknown) {
      console.warn('Não foi possível excluir do Supabase (removido localmente).', err);
    }
  };

  // Reordenar itens no mesmo dia ou entre dias (Drag & Drop)
  const reorderCronogramaItems = async (
    draggedId: string,
    targetDayId: number,
    targetIndex: number
  ) => {
    setItems((prev) => {
      const draggedItem = prev.find((i) => i.id_cronograma === draggedId);
      if (!draggedItem) return prev;

      const remaining = prev.filter((i) => i.id_cronograma !== draggedId);
      const targetDayItems = remaining
        .filter((i) => i.dia_semana === targetDayId)
        .sort((a, b) => a.ordem - b.ordem);

      const updatedItem: DbCronograma = {
        ...draggedItem,
        dia_semana: targetDayId,
        ordem: targetIndex,
      };

      targetDayItems.splice(targetIndex, 0, updatedItem);

      const updatedDayItems = targetDayItems.map((item, idx) => ({
        ...item,
        ordem: idx,
      }));

      let updatedSourceDayItems: DbCronograma[] = [];
      if (draggedItem.dia_semana !== targetDayId) {
        const sourceDayItems = remaining
          .filter((i) => i.dia_semana === draggedItem.dia_semana)
          .sort((a, b) => a.ordem - b.ordem);
        updatedSourceDayItems = sourceDayItems.map((item, idx) => ({
          ...item,
          ordem: idx,
        }));
      }

      const otherItems = remaining.filter(
        (i) => i.dia_semana !== targetDayId && i.dia_semana !== draggedItem.dia_semana
      );

      const finalItems = [...otherItems, ...updatedDayItems, ...updatedSourceDayItems];
      saveToLocal(finalItems);

      // Sincronizar atualizações de ordem com Supabase
      const allToSync = [...updatedDayItems, ...updatedSourceDayItems];
      Promise.all(
        allToSync.map((it) =>
          cronogramaService.updateCronogramaItem(it.id_cronograma, {
            dia_semana: it.dia_semana,
            ordem: it.ordem,
          }).catch(() => {})
        )
      );

      return finalItems;
    });
  };

  // Mover item para cima ou para baixo no mesmo dia
  const moveItemInDay = async (id: string, direction: 'up' | 'down') => {
    const item = items.find((i) => i.id_cronograma === id);
    if (!item) return;

    const dayItems = getItemsByDay(item.dia_semana);
    const currentIndex = dayItems.findIndex((i) => i.id_cronograma === id);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= dayItems.length) return;

    await reorderCronogramaItems(id, item.dia_semana, targetIndex);
  };

  // Cadastrar nova matéria no banco / estado local
  const addMateria = async (nmMateria: string): Promise<DbMateria> => {
    const trimmed = nmMateria.trim();
    if (!trimmed) throw new Error('Nome da matéria inválido');

    // Se já existir no estado com o mesmo nome (ignorando maiúsculas/minúsculas)
    const existing = materias.find((m) => m.nm_materia.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing;

    try {
      const newMateria = await materiasService.addMateria(trimmed);
      setMaterias((prev) => [...prev, newMateria].sort((a, b) => a.nm_materia.localeCompare(b.nm_materia)));
      return newMateria;
    } catch (err: unknown) {
      console.warn('Erro ao salvar matéria no Supabase, fallback local:', err);
      const fallback: DbMateria = {
        id_materia: 'local_mat_' + Date.now(),
        id_usuario: user?.id || 'local',
        nm_materia: trimmed,
      };
      setMaterias((prev) => [...prev, fallback].sort((a, b) => a.nm_materia.localeCompare(b.nm_materia)));
      return fallback;
    }
  };

  // Excluir matéria cadastrada
  const deleteMateria = async (idMateria: string) => {
    try {
      await materiasService.deleteMateria(idMateria);
    } catch (err: unknown) {
      console.warn('Erro ao excluir matéria no Supabase, removendo localmente:', err);
    } finally {
      setMaterias((prev) => prev.filter((m) => m.id_materia !== idMateria));
    }
  };

  return {
    items,
    materias,
    loading,
    error,
    todayIndex,
    todayItems,
    todayStats,
    getItemsByDay,
    addItem,
    updateItem,
    toggleItemConcluido,
    deleteItem,
    reorderCronogramaItems,
    moveItemInDay,
    addMateria,
    deleteMateria,
    reload: loadData,
  };
}


