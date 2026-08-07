import { useState } from 'react';
import { useCronograma, DIAS_DA_SEMANA } from '../hooks/useCronograma';
import type { DbCronograma } from '../types';

interface ScheduleScreenProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

export function ScheduleScreen({ isSidebarOpen, setIsSidebarOpen }: ScheduleScreenProps) {
  const {
    materias,
    loading,
    error,
    todayIndex,
    todayStats,
    getItemsByDay,
    addItem,
    updateItem,
    toggleItemConcluido,
    deleteItem,
    reorderCronogramaItems,
    moveItemInDay,
  } = useCronograma();

  // Estados de Drag & Drop
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverCell, setDragOverCell] = useState<{ dayId: number; rowIndex: number } | null>(null);

  // Estados do Modal de Criação / Edição de Item do Cronograma
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DbCronograma | null>(null);

  // Campos do formulário de Item
  const [formDia, setFormDia] = useState<number>(1); // Padrão Segunda-Feira
  const [formMateriaId, setFormMateriaId] = useState<string>('');
  const [formTitulo, setFormTitulo] = useState<string>('');
  const [formHorarioInicio, setFormHorarioInicio] = useState<string>('');
  const [formHorarioFim, setFormHorarioFim] = useState<string>('');
  const [formObservacao, setFormObservacao] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);



  // Modal de confirmação de exclusão de item
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Abrir modal para novo item
  const openNewItemModal = (dayIndex?: number) => {
    setEditingItem(null);
    setFormDia(dayIndex !== undefined ? dayIndex : (todayIndex === 0 ? 0 : todayIndex));
    setFormMateriaId('');
    setFormTitulo('');
    setFormHorarioInicio('');
    setFormHorarioFim('');
    setFormObservacao('');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Abrir modal para editar item
  const openEditModal = (item: DbCronograma) => {
    setEditingItem(item);
    setFormDia(item.dia_semana);
    setFormMateriaId(item.id_materia || '');
    setFormTitulo(item.titulo_estudo);
    setFormHorarioInicio(item.horario_inicio || '');
    setFormHorarioFim(item.horario_fim || '');
    setFormObservacao(item.observacao || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Tratar alteração na seleção de matéria
  const handleMateriaSelect = (materiaId: string) => {
    setFormMateriaId(materiaId);
    if (materiaId && !formTitulo.trim()) {
      const selected = materias.find((m) => m.id_materia === materiaId);
      if (selected) {
        setFormTitulo(selected.nm_materia);
      }
    }
  };





  // Submeter formulário do cronograma
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitulo.trim()) {
      setFormError('Por favor, informe o título da matéria ou assunto a estudar.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (editingItem) {
        await updateItem(editingItem.id_cronograma, {
          dia_semana: formDia,
          id_materia: formMateriaId || null,
          titulo_estudo: formTitulo.trim(),
          horario_inicio: formHorarioInicio || null,
          horario_fim: formHorarioFim || null,
          observacao: formObservacao.trim() || null,
        });
      } else {
        await addItem({
          dia_semana: formDia,
          id_materia: formMateriaId || null,
          titulo_estudo: formTitulo.trim(),
          horario_inicio: formHorarioInicio || null,
          horario_fim: formHorarioFim || null,
          observacao: formObservacao.trim() || null,
        });
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      console.error(err);
      setFormError('Ocorreu um erro ao salvar o item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tratar exclusão de item
  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await deleteItem(deletingId);
      setDeletingId(null);
    } catch (err) {
      console.error(err);
    }
  };


  // Handlers de Drag and Drop
  const handleDragStart = (e: React.DragEvent, item: DbCronograma) => {
    e.dataTransfer.setData('text/plain', item.id_cronograma);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedItemId(item.id_cronograma);
  };

  const handleDragOver = (e: React.DragEvent, dayId: number, rowIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!dragOverCell || dragOverCell.dayId !== dayId || dragOverCell.rowIndex !== rowIndex) {
      setDragOverCell({ dayId, rowIndex });
    }
  };

  const handleDragLeave = () => {
    setDragOverCell(null);
  };

  const handleDrop = (e: React.DragEvent, targetDayId: number, targetIndex: number) => {
    e.preventDefault();
    const itemId = draggedItemId || e.dataTransfer.getData('text/plain');
    if (itemId) {
      reorderCronogramaItems(itemId, targetDayId, targetIndex);
    }
    setDraggedItemId(null);
    setDragOverCell(null);
  };

  const todayInfo = DIAS_DA_SEMANA.find((d) => d.id === todayIndex);

  // Calcular número máximo de linhas para a tabela (mínimo de 4 linhas)
  const maxRowsCount = Math.max(
    4,
    ...DIAS_DA_SEMANA.map((d) => getItemsByDay(d.id).length)
  );

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 bg-bg-card/20 border border-gray-700/20 rounded-3xl backdrop-blur-md min-h-[600px] overflow-x-hidden animate-fadeIn">

      {/* 1. Cabeçalho Principal */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-800/60">
        <div className="flex items-center gap-3">
          {/* Botão de Toggle da Sidebar */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-2.5 rounded-2xl border transition-all duration-300 cursor-pointer ${isSidebarOpen
                ? 'bg-accent-primary/10 text-accent-primary border-accent-primary/20 hover:bg-accent-primary/20'
                : 'bg-bg-card/30 text-gray-400 border-gray-700/20 hover:text-white hover:bg-bg-card/50'
              }`}
            title={isSidebarOpen ? 'Ocultar Menu Lateral' : 'Mostrar Menu Lateral'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold text-white font-display tracking-tight">
                Cronograma de Estudos
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent-primary/15 text-accent-primary border border-accent-primary/20">
                Arraste & Solte (Drag & Drop)
              </span>
            </div>
            <p className="text-xs md:text-sm text-gray-400 mt-0.5">
              Organize suas matérias para cada dia e <strong className="text-gray-300 font-semibold">arraste os blocos</strong> para definir a ordem de prioridade.
            </p>
          </div>
        </div>

        {/* Botão de Adicionar ao Cronograma */}
        <button
          type="button"
          onClick={() => openNewItemModal()}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-accent-primary to-accent-secondary text-white font-semibold text-sm shadow-lg shadow-accent-primary/25 hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Adicionar ao Cronograma
        </button>
      </div>

      {/* 2. Banner de "Estudos de Hoje" */}
      <div className="my-6 p-4 rounded-2xl bg-gradient-to-r from-accent-primary/10 via-bg-card/40 to-accent-secondary/10 border border-accent-primary/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-primary/20 border border-accent-primary/30 flex items-center justify-center text-accent-primary">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-accent-primary">
                Hoje é {todayInfo?.label}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-sm font-semibold text-white mt-0.5">
              {todayStats.total === 0
                ? 'Nenhuma matéria agendada para hoje. Clique abaixo para planejar seu dia!'
                : `${todayStats.completed} de ${todayStats.total} matérias estudadas hoje (${todayStats.percent}%)`}
            </p>
          </div>
        </div>

        {/* Barra de Progresso */}
        {todayStats.total > 0 && (
          <div className="w-full md:w-48 flex flex-col gap-1">
            <div className="flex justify-between text-xs text-gray-400 font-medium">
              <span>Progresso</span>
              <span>{todayStats.percent}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent-primary to-emerald-400 transition-all duration-500 rounded-full"
                style={{ width: `${todayStats.percent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Banner Informativo se houver erro de conexão com Supabase */}
      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs md:text-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 flex-shrink-0 text-amber-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <div>
              <span className="font-bold block">Sincronização do Banco de Dados (Supabase)</span>
              <span>
                Executando em modo local temporário. Para sincronizar com Supabase, execute o script <code className="bg-black/30 px-1 py-0.5 rounded text-amber-200">schema.sql</code> no seu <strong>SQL Editor</strong>.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Estado de Carregamento */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-16 text-gray-400">
          <svg className="animate-spin h-8 w-8 text-accent-primary mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm">Carregando cronograma...</span>
        </div>
      ) : (
        /* 4. VISUALIZAÇÃO EM MATRIZ / TABELA COM SUPORTE A DRAG & DROP */
        <div className="flex-1 flex flex-col gap-6">
          <div className="w-full bg-bg-card/40 border border-gray-800 rounded-2xl overflow-x-auto shadow-2xl backdrop-blur-md">
            <table className="w-full text-left border-collapse min-w-[950px]">

              {/* Cabeçalho das Colunas (Dias da Semana: Segunda a Domingo) */}
              <thead>
                <tr className="bg-bg-card/70 border-b border-gray-700/60">
                  {DIAS_DA_SEMANA.map((dia) => {
                    const isToday = dia.id === todayIndex;
                    return (
                      <th
                        key={dia.id}
                        className={`w-[14.28%] min-w-[135px] p-3.5 border-r border-gray-800/80 font-display transition-colors ${isToday
                            ? 'bg-accent-primary/15 border-b-2 border-b-accent-primary text-white'
                            : 'text-gray-300 hover:bg-white/[0.02]'
                          }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-sm md:text-base tracking-tight">
                              {dia.short}
                            </span>
                            {isToday && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-accent-primary text-white tracking-wider">
                                HOJE
                              </span>
                            )}
                          </div>

                          {/* Botão de Adicionar Rápido para este Dia */}
                          <button
                            type="button"
                            onClick={() => openNewItemModal(dia.id)}
                            className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                            title={`Adicionar item em ${dia.label}`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                          </button>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {/* Corpo da Tabela (Linhas do Cronograma / Slots) */}
              <tbody className="divide-y divide-gray-800/60">
                {Array.from({ length: maxRowsCount }).map((_, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-white/[0.01] transition-colors">
                    {DIAS_DA_SEMANA.map((dia) => {
                      const isToday = dia.id === todayIndex;
                      const dayItems = getItemsByDay(dia.id);
                      const item = dayItems[rowIndex];
                      const isDragOver = dragOverCell?.dayId === dia.id && dragOverCell?.rowIndex === rowIndex;

                      return (
                        <td
                          key={dia.id}
                          onDragOver={(e) => handleDragOver(e, dia.id, rowIndex)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, dia.id, rowIndex)}
                          className={`w-[14.28%] min-w-[135px] p-2.5 border-r border-gray-800/60 align-top transition-all relative group ${isToday ? 'bg-accent-primary/[0.03]' : ''
                            } ${isDragOver
                              ? 'bg-accent-primary/20 border-2 border-dashed border-accent-primary shadow-lg shadow-accent-primary/20 scale-[0.99]'
                              : ''
                            }`}
                        >
                          {item ? (
                            /* Cartão de Matéria Arrastável */
                            <div
                              draggable={true}
                              onDragStart={(e) => handleDragStart(e, item)}
                              onDragEnd={() => {
                                setDraggedItemId(null);
                                setDragOverCell(null);
                              }}
                              className={`p-2.5 rounded-xl border transition-all duration-200 flex flex-col justify-between h-full min-h-[76px] group/card cursor-grab active:cursor-grabbing hover:shadow-md ${draggedItemId === item.id_cronograma ? 'opacity-40 border-dashed border-accent-primary' : ''
                                } ${item.fl_concluido
                                  ? 'bg-emerald-950/20 border-emerald-500/30 opacity-70'
                                  : isToday
                                    ? 'bg-bg-card/90 border-accent-primary/40 shadow-sm hover:border-accent-primary'
                                    : 'bg-bg-card/60 border-gray-700/40 hover:border-gray-500 hover:bg-bg-card/90'
                                }`}
                            >
                              <div>
                                {/* Linha Superior: Ícone Drag Grip + Checkbox + Tag + Ações */}
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    {/* Ícone de Arraste (Grip) */}
                                    <div
                                      className="text-gray-500 hover:text-gray-300 cursor-grab active:cursor-grabbing p-0.5"
                                      title="Clique e arraste para reordenar"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6h16.5" />
                                      </svg>
                                    </div>

                                    {/* Botão de Checkbox */}
                                    <button
                                      type="button"
                                      onMouseDown={(e) => e.stopPropagation()}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleItemConcluido(item.id_cronograma);
                                      }}
                                      className={`flex-shrink-0 w-3.5 h-3.5 rounded border transition-all flex items-center justify-center cursor-pointer ${item.fl_concluido
                                          ? 'bg-emerald-500 border-emerald-500 text-white'
                                          : 'border-gray-500 hover:border-accent-primary bg-bg-dark/50'
                                        }`}
                                      title={item.fl_concluido ? 'Marcar como não concluído' : 'Marcar como concluído'}
                                    >
                                      {item.fl_concluido && (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3.5} stroke="currentColor" className="w-2.5 h-2.5">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                        </svg>
                                      )}
                                    </button>
                                  </div>

                                  {/* Ações (Reordenar Cima/Baixo + Editar + Deletar no hover) */}
                                  <div className="flex items-center gap-0.5 opacity-0 group-hover/card:opacity-100 transition-opacity">
                                    {rowIndex > 0 && (
                                      <button
                                        type="button"
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          moveItemInDay(item.id_cronograma, 'up');
                                        }}
                                        className="p-0.5 rounded text-gray-400 hover:text-white hover:bg-gray-700/60 cursor-pointer"
                                        title="Mover para cima"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                                        </svg>
                                      </button>
                                    )}
                                    {rowIndex < dayItems.length - 1 && (
                                      <button
                                        type="button"
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          moveItemInDay(item.id_cronograma, 'down');
                                        }}
                                        className="p-0.5 rounded text-gray-400 hover:text-white hover:bg-gray-700/60 cursor-pointer"
                                        title="Mover para baixo"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                        </svg>
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onMouseDown={(e) => e.stopPropagation()}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openEditModal(item);
                                      }}
                                      className="p-0.5 rounded text-gray-400 hover:text-white hover:bg-gray-700/60 cursor-pointer"
                                      title="Editar"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                      </svg>
                                    </button>
                                    <button
                                      type="button"
                                      onMouseDown={(e) => e.stopPropagation()}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeletingId(item.id_cronograma);
                                      }}
                                      className="p-0.5 rounded text-gray-400 hover:text-red-400 hover:bg-gray-700/60 cursor-pointer"
                                      title="Excluir"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>

                                {/* Título da Matéria / Estudo */}
                                <h4
                                  className={`text-xs md:text-sm font-semibold tracking-tight leading-snug break-words ${item.fl_concluido ? 'line-through text-gray-500' : 'text-gray-100'
                                    }`}
                                >
                                  {item.titulo_estudo}
                                </h4>
                              </div>

                              {/* Rodapé do Cartão: Horários e Observações */}
                              {(item.horario_inicio || item.horario_fim || item.observacao) && (
                                <div className="mt-1.5 pt-1 border-t border-gray-800/40 flex flex-col gap-0.5">
                                  {(item.horario_inicio || item.horario_fim) && (
                                    <span className="text-[10px] text-gray-400 flex items-center gap-1 font-medium">
                                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-2.5 h-2.5 text-accent-primary">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      {item.horario_inicio || '--:--'} {item.horario_fim ? `- ${item.horario_fim}` : ''}
                                    </span>
                                  )}
                                  {item.observacao && (
                                    <span className="text-[10px] text-gray-400/90 italic truncate" title={item.observacao}>
                                      "{item.observacao}"
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            /* Célula Vazia com Alvo de Soltura (Drop Target) */
                            <button
                              type="button"
                              onClick={() => openNewItemModal(dia.id)}
                              className="w-full h-full min-h-[64px] rounded-xl border border-dashed border-transparent hover:border-gray-700/60 hover:bg-white/[0.02] flex items-center justify-center text-gray-600 hover:text-accent-primary text-xs font-semibold transition-all group/empty cursor-pointer"
                            >
                              <span className="opacity-0 group-hover/empty:opacity-100 transition-opacity flex items-center gap-1">
                                + Adicionar
                              </span>
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* 6. Modal de Adicionar / Editar Item */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-bg-dark border border-gray-700/60 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-800">
              <h3 className="text-lg font-bold text-white font-display">
                {editingItem ? 'Editar Item do Cronograma' : 'Adicionar ao Cronograma'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Dia da Semana */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Dia da Semana *
                </label>
                <select
                  value={formDia}
                  onChange={(e) => setFormDia(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl bg-bg-card/50 border border-gray-700 text-white text-sm focus:outline-none focus:border-accent-primary"
                >
                  {DIAS_DA_SEMANA.map((d) => (
                    <option key={d.id} value={d.id} className="bg-bg-dark text-white">
                      {d.label} {d.id === todayIndex ? '(Hoje)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vincular com Matéria Cadastrada */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Vincular à Matéria Cadastrada <span className="text-gray-500 font-normal">(Opcional)</span>
                </label>

                <select
                  value={formMateriaId}
                  onChange={(e) => handleMateriaSelect(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-bg-card/50 border border-gray-700 text-white text-sm focus:outline-none focus:border-accent-primary cursor-pointer"
                >
                  <option value="">-- Selecione uma Matéria Cadastrada --</option>
                  {materias.map((m) => (
                    <option key={m.id_materia} value={m.id_materia} className="bg-bg-dark text-white">
                      {m.nm_materia}
                    </option>
                  ))}
                </select>
              </div>

              {/* Título / O que estudar */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Título do Estudo / Assunto *
                </label>
                <input
                  type="text"
                  value={formTitulo}
                  onChange={(e) => setFormTitulo(e.target.value)}
                  placeholder="Ex: Português - Crase, Revisão Geral, Exercícios..."
                  className="w-full px-3 py-2.5 rounded-xl bg-bg-card/50 border border-gray-700 text-white text-sm focus:outline-none focus:border-accent-primary placeholder-gray-500"
                  required
                />
              </div>

              {/* Horários (Início / Fim - Opcionais) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-gray-300">
                      Horário de Início <span className="text-gray-500 font-normal">(Opcional)</span>
                    </label>
                    {formHorarioInicio && (
                      <button
                        type="button"
                        onClick={() => setFormHorarioInicio('')}
                        className="text-[10px] text-gray-400 hover:text-white"
                      >
                        Limpar
                      </button>
                    )}
                  </div>
                  <input
                    type="time"
                    value={formHorarioInicio}
                    onChange={(e) => setFormHorarioInicio(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-bg-card/50 border border-gray-700 text-white text-sm focus:outline-none focus:border-accent-primary"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-gray-300">
                      Horário de Fim <span className="text-gray-500 font-normal">(Opcional)</span>
                    </label>
                    {formHorarioFim && (
                      <button
                        type="button"
                        onClick={() => setFormHorarioFim('')}
                        className="text-[10px] text-gray-400 hover:text-white"
                      >
                        Limpar
                      </button>
                    )}
                  </div>
                  <input
                    type="time"
                    value={formHorarioFim}
                    onChange={(e) => setFormHorarioFim(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-bg-card/50 border border-gray-700 text-white text-sm focus:outline-none focus:border-accent-primary"
                  />
                </div>
              </div>

              {/* Observação */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Observações / Metas (Opcional)
                </label>
                <textarea
                  value={formObservacao}
                  onChange={(e) => setFormObservacao(e.target.value)}
                  placeholder="Ex: Resolver 20 questões, ler artigo 5º..."
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl bg-bg-card/50 border border-gray-700 text-white text-sm focus:outline-none focus:border-accent-primary placeholder-gray-500 resize-none"
                />
              </div>

              {/* Ações do Formulário */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800 mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-gray-400 hover:text-white font-semibold text-sm transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-accent-primary hover:bg-accent-primary/90 text-white font-semibold text-sm shadow-md shadow-accent-primary/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Salvando...' : editingItem ? 'Salvar Alterações' : 'Adicionar Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Modal de Confirmação de Exclusão de Item do Cronograma */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-bg-dark border border-gray-700/60 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-white font-display mb-1">Excluir do Cronograma</h3>
            <p className="text-xs text-gray-400 mb-6">
              Tem certeza que deseja remover esta matéria do seu cronograma?
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="flex-1 py-2.5 rounded-xl bg-bg-card/50 hover:bg-bg-card text-gray-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-xs transition-colors cursor-pointer shadow-md shadow-red-500/20"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

