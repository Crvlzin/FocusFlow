import type { PomodoroSession } from '../types';

interface HistoryPanelProps {
  history: PomodoroSession[];
  focusRounds: number;
  onClearHistory: () => void;
}

export function HistoryPanel({ history, focusRounds, onClearHistory }: HistoryPanelProps) {
  return (
    <div className="w-full max-w-xl mx-auto p-6 rounded-3xl bg-bg-card border border-gray-700/50 backdrop-blur-md shadow-2xl">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">Seu Progresso</h3>
          <p className="text-xs text-gray-400">Histórico de sessões de hoje</p>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold text-accent-secondary uppercase tracking-wider">
            Rounds: {focusRounds}
          </span>
        </div>
      </div>

      {/* Estatísticas de Foco */}
      <div className="p-4 rounded-2xl bg-bg-dark/50 border border-gray-700/30 mb-4 flex justify-around text-center">
        <div>
          <div className="text-xl font-bold text-white font-mono">{history.length}</div>
          <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Ciclos</div>
        </div>
        <div className="w-px bg-gray-800 self-stretch" />
        <div>
          <div className="text-xl font-bold text-white font-mono">
            {history.reduce((acc, curr) => acc + curr.durationMinutes, 0)}m
          </div>
          <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Tempo Total</div>
        </div>
      </div>

      {/* Lista de Sessões */}
      <div className="max-h-48 overflow-y-auto pr-1 flex flex-col gap-2 custom-scrollbar">
        {history.length === 0 ? (
          <div className="text-center py-6 text-sm text-gray-500 italic">
            Nenhuma sessão concluída ainda. Comece a focar!
          </div>
        ) : (
          history.map((session) => {
            const time = new Date(session.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });
            return (
              <div
                key={session.id}
                className="flex justify-between items-center px-4 py-2.5 rounded-xl bg-bg-dark/30 border border-gray-800/50 text-sm font-medium hover:border-gray-700/50 transition-all"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-md shadow-red-500/20" />
                  <span className="text-gray-300">Foco Concluído</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 font-mono">{time}</span>
                  <span className="text-xs font-bold text-accent-primary font-mono bg-accent-primary/10 px-2.5 py-0.5 rounded-md">
                    +{session.durationMinutes}m
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {history.length > 0 && (
        <button
          type="button"
          onClick={onClearHistory}
          className="w-full mt-4 py-2 text-center text-xs font-semibold text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 rounded-xl transition-all"
        >
          Limpar Histórico
        </button>
      )}
    </div>
  );
}
