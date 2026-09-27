import { api } from '../config/api';
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

interface ApiCronograma {
  idCronograma: string;
  diaSemana: number;
  idMateria: string | null;
  nomeMateria: string | null;
  tituloEstudo: string;
  horarioInicio: string | null;
  horarioFim: string | null;
  observacao: string | null;
  flConcluido: boolean;
  ordem: number;
  dtCriacao?: string;
}

function toDbCronograma(c: ApiCronograma): DbCronograma {
  return {
    id_cronograma: c.idCronograma,
    id_usuario: '',
    dia_semana: c.diaSemana,
    id_materia: c.idMateria,
    titulo_estudo: c.tituloEstudo,
    horario_inicio: c.horarioInicio,
    horario_fim: c.horarioFim,
    observacao: c.observacao,
    fl_concluido: c.flConcluido,
    ordem: c.ordem,
    dt_criacao: c.dtCriacao,
    materias: c.idMateria
      ? {
          id_materia: c.idMateria,
          id_usuario: '',
          nm_materia: c.nomeMateria || '',
        }
      : null,
  };
}

export const cronogramaService = {
  async fetchCronograma(): Promise<DbCronograma[]> {
    const list = await api.get<ApiCronograma[]>('/cronograma');
    return list.map(toDbCronograma);
  },

  async addCronogramaItem(item: CreateCronogramaDTO): Promise<DbCronograma> {
    const payload = {
      diaSemana: item.dia_semana,
      tituloEstudo: item.titulo_estudo.trim(),
      idMateria: item.id_materia || null,
      horarioInicio: item.horario_inicio?.trim() || null,
      horarioFim: item.horario_fim?.trim() || null,
      observacao: item.observacao?.trim() || null,
      ordem: item.ordem ?? 0,
      flConcluido: false,
    };

    const res = await api.post<ApiCronograma>('/cronograma', payload);
    return toDbCronograma(res);
  },

  async updateCronogramaItem(idCronograma: string, updates: UpdateCronogramaDTO): Promise<DbCronograma> {
    const payload = {
      diaSemana: updates.dia_semana,
      tituloEstudo: updates.titulo_estudo ? updates.titulo_estudo.trim() : undefined,
      idMateria: updates.id_materia,
      horarioInicio: updates.horario_inicio ? updates.horario_inicio.trim() : null,
      horarioFim: updates.horario_fim ? updates.horario_fim.trim() : null,
      observacao: updates.observacao ? updates.observacao.trim() : null,
      flConcluido: updates.fl_concluido,
      ordem: updates.ordem,
    };

    const res = await api.put<ApiCronograma>(`/cronograma/${idCronograma}`, payload);
    return toDbCronograma(res);
  },

  async toggleConcluido(idCronograma: string, flConcluido: boolean): Promise<DbCronograma> {
    const res = await api.patch<ApiCronograma>(`/cronograma/${idCronograma}/concluido?concluido=${flConcluido}`);
    return toDbCronograma(res);
  },

  async deleteCronogramaItem(idCronograma: string): Promise<void> {
    await api.delete(`/cronograma/${idCronograma}`);
  },
};