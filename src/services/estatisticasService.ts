import { api } from '../config/api';
import type { DbEstatistica } from '../types';

interface ApiEstatistica {
  idEstatistica: string;
  idMateria: string;
  nomeMateria: string;
  idAssunto: string;
  nomeAssunto: string;
  qtdCertas: number;
  qtdErradas: number;
  qtdTotal: number;
  qtdMinutos: number;
  taxaAcerto: number;
  dataEstudo: string;
  dtRegistro: string;
}

export interface ApiResumoEstatisticas {
  totalMinutos: number;
  totalCertas: number;
  totalErradas: number;
  totalQuestoes: number;
  taxaAcertoGeral: number;
  totalSessoes: number;
}

function toDbEstatistica(e: ApiEstatistica): DbEstatistica {
  return {
    id_estatistica: e.idEstatistica,
    id_usuario: '',
    id_assunto: e.idAssunto,
    qtd_certas: e.qtdCertas,
    qtd_erradas: e.qtdErradas,
    qtd_total: e.qtdTotal,
    qtd_minutos: e.qtdMinutos,
    dt_registro: e.dataEstudo ? `${e.dataEstudo}T12:00:00` : e.dtRegistro,
    assuntos: {
      id_assunto: e.idAssunto,
      id_materia: e.idMateria,
      nm_assunto: e.nomeAssunto,
      materias: {
        id_materia: e.idMateria,
        id_usuario: '',
        nm_materia: e.nomeMateria,
      },
    },
  };
}

export const estatisticasService = {
  async fetchEstatisticas(idAssunto?: string, dataInicio?: string, dataFim?: string): Promise<DbEstatistica[]> {
    let url = '/estatisticas';
    const params = new URLSearchParams();
    if (idAssunto) params.append('idAssunto', idAssunto);
    if (dataInicio) params.append('dataInicio', dataInicio);
    if (dataFim) params.append('dataFim', dataFim);
    const query = params.toString();
    if (query) url += `?${query}`;

    const list = await api.get<ApiEstatistica[]>(url);
    return list.map(toDbEstatistica);
  },

  async addEstatistica(
    idAssunto: string,
    qtdCertas: number,
    qtdErradas: number,
    qtdMinutos: number,
    dataEstudo?: string,
    qtdTotal?: number
  ): Promise<DbEstatistica> {
    const payload = {
      idAssunto,
      qtdCertas,
      qtdErradas,
      qtdTotal: qtdTotal != null ? qtdTotal : undefined,
      qtdMinutos,
      dataEstudo: dataEstudo || undefined,
    };

    const res = await api.post<ApiEstatistica>('/estatisticas', payload);
    return toDbEstatistica(res);
  },

  async deleteEstatistica(idEstatistica: string): Promise<void> {
    await api.delete(`/estatisticas/${idEstatistica}`);
  },

  async fetchResumo(dataInicio?: string, dataFim?: string): Promise<ApiResumoEstatisticas> {
    let url = '/estatisticas/resumo';
    const params = new URLSearchParams();
    if (dataInicio) params.append('dataInicio', dataInicio);
    if (dataFim) params.append('dataFim', dataFim);
    const query = params.toString();
    if (query) url += `?${query}`;

    return api.get<ApiResumoEstatisticas>(url);
  },

  async clearEstatisticas(): Promise<void> {
    const list = await api.get<ApiEstatistica[]>('/estatisticas');
    for (const item of list) {
      await api.delete(`/estatisticas/${item.idEstatistica}`);
    }
  },
};