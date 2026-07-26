import { supabase } from '../config/supabase';
import type { DbRevisao } from '../types';

export const revisoesService = {
  async fetchRevisoes(): Promise<DbRevisao[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('revisoes')
      .select('*, assuntos!inner(*, materias!inner(*))')
      .eq('id_usuario', user.id)
      .order('dt_revisao', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async addRevisao(idAssunto: string, dtRevisao: string, nivelCiclo: number): Promise<DbRevisao> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('revisoes')
      .insert({
        id_usuario: user.id,
        id_assunto: idAssunto,
        dt_revisao: dtRevisao,
        nivel_ciclo: nivelCiclo,
        fl_concluida: false,
        dt_conclusao: null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async completeRevisao(idRevisao: string, dtConclusao: string): Promise<DbRevisao> {
    const { data, error } = await supabase
      .from('revisoes')
      .update({
        fl_concluida: true,
        dt_conclusao: dtConclusao,
      })
      .eq('id_revisao', idRevisao)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteRevisao(idRevisao: string): Promise<void> {
    const { error } = await supabase
      .from('revisoes')
      .delete()
      .eq('id_revisao', idRevisao);

    if (error) throw error;
  },

  async deleteRevisoesDoAssunto(idAssunto: string): Promise<void> {
    const { error } = await supabase
      .from('revisoes')
      .delete()
      .eq('id_assunto', idAssunto);

    if (error) throw error;
  },
};
