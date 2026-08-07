import { useState } from 'react';

interface SubjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: string[];
  onAddMateria: (name: string) => Promise<unknown>;
  onDeleteMateria: (name: string) => void;
}

export function SubjectManagerModal({
  isOpen,
  onClose,
  subjects,
  onAddMateria,
  onDeleteMateria,
}: SubjectManagerModalProps) {
  const [newSubjectInput, setNewSubjectInput] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectInput.trim()) return;
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      await onAddMateria(newSubjectInput.trim());
      setNewSubjectInput('');
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Falha ao adicionar a matéria. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSubjects = subjects.filter((s) =>
    s.toLowerCase().includes(searchFilter.toLowerCase().trim())
  );

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-bg-dark border border-gray-700/60 rounded-3xl p-6 w-full max-w-lg shadow-2xl flex flex-col gap-5 animate-scaleUp">
        
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-display">Gerenciar Matérias</h3>
              <p className="text-xs text-gray-400">Cadastre novas disciplinas ou exclua as existentes</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-all cursor-pointer"
            title="Fechar Modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Formulário: Adicionar Nova Matéria */}
        <form onSubmit={handleAddSubject} className="flex flex-col gap-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Adicionar Nova Matéria
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="ex: Direito Administrativo, Física..."
              value={newSubjectInput}
              onChange={(e) => setNewSubjectInput(e.target.value)}
              className="flex-1 bg-bg-card/50 text-xs text-white px-4 py-2.5 rounded-xl border border-gray-700 focus:outline-none focus:border-accent-primary placeholder-gray-500 font-medium"
            />
            <button
              type="submit"
              disabled={isSubmitting || !newSubjectInput.trim()}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-accent-primary to-accent-secondary text-white text-xs font-bold shadow-lg shadow-accent-primary/25 hover:opacity-95 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>{isSubmitting ? 'Salvando...' : 'Adicionar'}</span>
            </button>
          </div>
          {errorMsg && <span className="text-xs text-red-400 font-medium mt-1">{errorMsg}</span>}
        </form>

        {/* Divisor */}
        <div className="h-px bg-gray-800/80 my-1" />

        {/* Lista de Matérias Cadastradas */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Matérias Cadastradas ({subjects.length})
            </span>

            {/* Input de Filtro */}
            {subjects.length > 5 && (
              <input
                type="text"
                placeholder="Buscar matéria..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="bg-bg-card/40 text-[11px] text-white px-3 py-1 rounded-lg border border-gray-700 focus:outline-none focus:border-accent-primary w-36"
              />
            )}
          </div>

          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
            {filteredSubjects.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-500 italic border border-dashed border-gray-800 rounded-2xl">
                {searchFilter ? 'Nenhuma matéria encontrada na busca.' : 'Nenhuma matéria cadastrada ainda.'}
              </div>
            ) : (
              filteredSubjects.map((sub) => (
                <div
                  key={sub}
                  className="flex items-center justify-between p-3 rounded-2xl bg-bg-card/30 border border-gray-800 hover:border-gray-700 transition-all gap-2"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="w-2.5 h-2.5 rounded-full bg-accent-secondary shrink-0" />
                    <span className="text-xs font-bold text-gray-200 truncate">{sub}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteMateria(sub)}
                    className="px-3 py-1.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                    title={`Excluir matéria ${sub}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                    <span>Excluir</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Rodapé do Modal */}
        <div className="pt-2 border-t border-gray-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
          >
            Concluído
          </button>
        </div>

      </div>
    </div>
  );
}
