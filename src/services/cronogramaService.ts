import { supabase } from '../config/supabase';
import type { DbCronograma } from '../types';

export interface CreateCronogramaDTO {
  dia_semana: number;
  titulo_estudo: string;
  id_materia?: string | null;
  horario_inicio?: string | null;
  horario_fim?: string | null;
  observacao?: string | null;
  ordem?: number;
}

export interface UpdateCronogramaDTO {
  dia_semana?: number;
  titulo_estudo?: string;
  id_materia?: string | null;
  horario_inicio?: string | null;
  horario_fim?: string | null;
  observacao?: string | null;
  fl_concluido?: boolean;
  ordem?: number;
}

function cleanTime(timeStr?: string | null): string | null {
  if (!timeStr || typeof timeStr !== 'string' || !timeStr.trim()) return null;
  return timeStr.trim();
}

export const cronogramaService = {
  /**
   * Carrega todas as entradas do cronograma do usuário
   */
  async fetchCronograma(): Promise<DbCronograma[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('cronograma')
      .select('*, materias(*)')
      .eq('id_usuario', user.id)
      .order('dia_semana', { ascending: true })
      .order('ordem', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Adiciona um novo item ao cronograma
   */
  async addCronogramaItem(item: CreateCronogramaDTO): Promise<DbCronograma> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const payload = {
      id_usuario: user.id,
      dia_semana: item.dia_semana,
      titulo_estudo: item.titulo_estudo.trim(),
      id_materia: item.id_materia || null,
      horario_inicio: cleanTime(item.horario_inicio),
      horario_fim: cleanTime(item.horario_fim),
      observacao: item.observacao?.trim() || null,
      fl_concluido: false,
      ordem: item.ordem ?? 0,
    };

    const { data, error } = await supabase
      .from('cronograma')
      .insert(payload)
      .select('*, materias(*)')
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Atualiza um item do cronograma
   */
  async updateCronogramaItem(idCronograma: string, updates: UpdateCronogramaDTO): Promise<DbCronograma> {
    const payload: Record<string, any> = {};

    if (updates.dia_semana !== undefined) payload.dia_semana = updates.dia_semana;
    if (updates.titulo_estudo !== undefined) payload.titulo_estudo = updates.titulo_estudo.trim();
    if (updates.id_materia !== undefined) payload.id_materia = updates.id_materia || null;
    if (updates.horario_inicio !== undefined) payload.horario_inicio = cleanTime(updates.horario_inicio);
    if (updates.horario_fim !== undefined) payload.horario_fim = cleanTime(updates.horario_fim);
    if (updates.observacao !== undefined) payload.observacao = updates.observacao?.trim() || null;
    if (updates.fl_concluido !== undefined) payload.fl_concluido = updates.fl_concluido;
    if (updates.ordem !== undefined) payload.ordem = updates.ordem;

    const { data, error } = await supabase
      .from('cronograma')
      .update(payload)
      .eq('id_cronograma', idCronograma)
      .select('*, materias(*)')
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Alterna o status de concluído de um item
   */
  async toggleConcluido(idCronograma: string, flConcluido: boolean): Promise<DbCronograma> {
    const { data, error } = await supabase
      .from('cronograma')
      .update({ fl_concluido: flConcluido })
      .eq('id_cronograma', idCronograma)
      .select('*, materias(*)')
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Exclui um item do cronograma
   */
  async deleteCronogramaItem(idCronograma: string): Promise<void> {
    const { error } = await supabase
      .from('cronograma')
      .delete()
      .eq('id_cronograma', idCronograma);

    if (error) throw error;
  },
};

