import { supabase } from '../config/supabase';
import type { DbEstatistica } from '../types';

export const estatisticasService = {
  async fetchEstatisticas(): Promise<DbEstatistica[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('estatisticas')
      .select('*, assuntos!inner(*, materias!inner(*))')
      .eq('id_usuario', user.id)
      .order('dt_registro', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async addEstatistica(idAssunto: string, qtdCertas: number, qtdErradas: number, qtdMinutos: number): Promise<DbEstatistica> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('estatisticas')
      .insert({
        id_usuario: user.id,
        id_assunto: idAssunto,
        qtd_certas: qtdCertas,
        qtd_erradas: qtdErradas,
        qtd_minutos: qtdMinutos,
        dt_registro: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteEstatistica(idEstatistica: string): Promise<void> {
    const { error } = await supabase
      .from('estatisticas')
      .delete()
      .eq('id_estatistica', idEstatistica);

    if (error) throw error;
  },

  async clearEstatisticas(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
      .from('estatisticas')
      .delete()
      .eq('id_usuario', user.id);

    if (error) throw error;
  },
};
