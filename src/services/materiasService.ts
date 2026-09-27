import { api } from '../config/api';
import type { DbMateria, DbAssunto } from '../types';

interface ApiAssunto {
  idAssunto: string;
  idMateria: string;
  nome: string;
}

interface ApiMateria {
  idMateria: string;
  nome: string;
  totalAssuntos: number;
  assuntos: ApiAssunto[];
}

export const materiasService = {
  async fetchMaterias(): Promise<DbMateria[]> {
    const list = await api.get<ApiMateria[]>('/materias');
    return list.map((m) => ({
      id_materia: m.idMateria,
      id_usuario: '',
      nm_materia: m.nome,
      anotacao: localStorage.getItem('focusflow_materia_anotacao_' + m.idMateria) || null,
    }));
  },

  async addMateria(nmMateria: string): Promise<DbMateria> {
    const m = await api.post<ApiMateria>('/materias', { nome: nmMateria.trim() });
    return {
      id_materia: m.idMateria,
      id_usuario: '',
      nm_materia: m.nome,
      anotacao: null,
    };
  },

  async deleteMateria(idMateria: string): Promise<void> {
    await api.delete('/materias/' + idMateria);
  },

  async fetchAssuntos(): Promise<DbAssunto[]> {
    const list = await api.get<ApiMateria[]>('/materias');
    const todosAssuntos: DbAssunto[] = [];
    for (const m of list) {
      if (m.assuntos) {
        for (const a of m.assuntos) {
          todosAssuntos.push({
            id_assunto: a.idAssunto,
            id_materia: m.idMateria,
            nm_assunto: a.nome,
            anotacao: localStorage.getItem('focusflow_anotacao_' + a.idAssunto) || null,
            materias: {
              id_materia: m.idMateria,
              id_usuario: '',
              nm_materia: m.nome,
            },
          });
        }
      }
    }
    return todosAssuntos;
  },

  async addAssunto(idMateria: string, nmAssunto: string): Promise<DbAssunto> {
    const a = await api.post<ApiAssunto>(`/materias/${idMateria}/assuntos`, { nome: nmAssunto.trim() });
    return {
      id_assunto: a.idAssunto,
      id_materia: idMateria,
      nm_assunto: a.nome,
      anotacao: null,
    };
  },

  async deleteAssunto(idAssunto: string): Promise<void> {
    await api.delete('/assuntos/' + idAssunto);
  },

  async updateAssuntoAnotacao(idAssunto: string, anotacao: string): Promise<void> {
    localStorage.setItem('focusflow_anotacao_' + idAssunto, anotacao);
  },

  async updateMateriaAnotacao(idMateria: string, anotacao: string): Promise<void> {
    localStorage.setItem('focusflow_materia_anotacao_' + idMateria, anotacao);
  },
};