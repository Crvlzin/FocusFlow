import { supabase } from '../config/supabase';
import type { DbMateria, DbAssunto } from '../types';

export const materiasService = {
  async fetchMaterias(): Promise<DbMateria[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('materias')
      .select('*')
      .eq('id_usuario', user.id)
      .order('nm_materia', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async addMateria(nmMateria: string): Promise<DbMateria> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('materias')
      .insert({
        nm_materia: nmMateria.trim(),
        id_usuario: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteMateria(idMateria: string): Promise<void> {
    const { error } = await supabase
      .from('materias')
      .delete()
      .eq('id_materia', idMateria);

    if (error) throw error;
  },

  async fetchAssuntos(): Promise<DbAssunto[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Busca assuntos cujos IDs de matéria pertençam ao usuário (fazendo join das tabelas)
    const { data, error } = await supabase
      .from('assuntos')
      .select('*, materias!inner(*)')
      .eq('materias.id_usuario', user.id)
      .order('nm_assunto', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async addAssunto(idMateria: string, nmAssunto: string): Promise<DbAssunto> {
    const { data, error } = await supabase
      .from('assuntos')
      .insert({
        id_materia: idMateria,
        nm_assunto: nmAssunto.trim(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteAssunto(idAssunto: string): Promise<void> {
    const { error } = await supabase
      .from('assuntos')
      .delete()
      .eq('id_assunto', idAssunto);

    if (error) throw error;
  },

  async updateAssuntoAnotacao(idAssunto: string, anotacao: string): Promise<void> {
    localStorage.setItem('focusflow_anotacao_' + idAssunto, anotacao);
    try {
      const { error } = await supabase
        .from('assuntos')
        .update({ anotacao })
        .eq('id_assunto', idAssunto);
      if (error) console.warn('Atualização de anotação no Supabase retornou aviso (salvo localmente):', error.message);
    } catch (err) {
      console.warn('Falha ao sincronizar anotação no Supabase (salvo no LocalStorage):', err);
    }
  },

  async updateMateriaAnotacao(idMateria: string, anotacao: string): Promise<void> {
    localStorage.setItem('focusflow_materia_anotacao_' + idMateria, anotacao);
    try {
      await supabase
        .from('materias')
        .update({ anotacao })
        .eq('id_materia', idMateria);
    } catch (err) {
      console.warn('Falha ao sincronizar anotação da matéria no Supabase (salvo no LocalStorage):', err);
    }
  },
};


