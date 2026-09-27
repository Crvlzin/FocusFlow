import { api } from '../config/api';
import type { DbRevisao } from '../types';

interface ApiRevisao {
  idRevisao: string;
  idMateria: string;
  nomeMateria: string;
  idAssunto: string;
  nomeAssunto: string;
  dtRevisao: string;
  nivelCiclo: number;
  flConcluida: boolean;
  dtConclusao: string | null;
  atrasada: boolean;
}

export interface ApiResumoRevisoes {
  totalParaHoje: number;
  totalAtrasadas: number;
  totalPendentes: number;
  totalConcluidas: number;
}

function toDbRevisao(r: ApiRevisao): DbRevisao {
  return {
    id_revisao: r.idRevisao,
    id_usuario: '',
    id_assunto: r.idAssunto,
    dt_revisao: r.dtRevisao,
    nivel_ciclo: r.nivelCiclo,
    fl_concluida: r.flConcluida,
    dt_conclusao: r.dtConclusao,
    assuntos: {
      id_assunto: r.idAssunto,
      id_materia: r.idMateria,
      nm_assunto: r.nomeAssunto,
      materias: {
        id_materia: r.idMateria,
        id_usuario: '',
        nm_materia: r.nomeMateria,
      },
    },
  };
}

export const revisoesService = {
  async fetchRevisoes(filtro?: string, idAssunto?: string): Promise<DbRevisao[]> {
    let url = '/revisoes';
    const params = new URLSearchParams();
    if (filtro) params.append('filtro', filtro);
    if (idAssunto) params.append('idAssunto', idAssunto);
    const query = params.toString();
    if (query) url += `?${query}`;

    const list = await api.get<ApiRevisao[]>(url);
    return list.map(toDbRevisao);
  },

  async addRevisao(idAssunto: string, dtRevisao: string, nivelCiclo: number): Promise<DbRevisao> {
    const res = await api.post<ApiRevisao>('/revisoes', {
      idAssunto,
      dtRevisao,
      nivelCiclo,
    });
    return toDbRevisao(res);
  },

  async gerarCiclos(idAssunto: string, dataBase?: string): Promise<DbRevisao[]> {
    const list = await api.post<ApiRevisao[]>('/revisoes/gerar-ciclos', {
      idAssunto,
      dataBase: dataBase || undefined,
    });
    return list.map(toDbRevisao);
  },

  async completeRevisao(idRevisao: string, dtConclusao?: string): Promise<DbRevisao> {
    const dateParam = dtConclusao ? `&dtConclusao=${dtConclusao}` : '';
    const res = await api.patch<ApiRevisao>(`/revisoes/${idRevisao}/concluir?concluida=true${dateParam}`);
    return toDbRevisao(res);
  },

  async deleteRevisao(idRevisao: string): Promise<void> {
    await api.delete(`/revisoes/${idRevisao}`);
  },

  async deleteRevisoesDoAssunto(idAssunto: string): Promise<void> {
    const list = await api.get<ApiRevisao[]>(`/revisoes?idAssunto=${idAssunto}`);
    for (const r of list) {
      await api.delete(`/revisoes/${r.idRevisao}`);
    }
  },

  async fetchResumo(): Promise<ApiResumoRevisoes> {
    return api.get<ApiResumoRevisoes>('/revisoes/resumo');
  },
};