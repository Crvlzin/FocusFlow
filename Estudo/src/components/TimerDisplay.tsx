import type { PomodoroMode } from '../types';

interface TimerDisplayProps {
  secondsRemaining: number;
  totalDurationMinutes: number;
  mode: PomodoroMode;
}

export function TimerDisplay({ secondsRemaining, totalDurationMinutes, mode }: TimerDisplayProps) {
  // Formata o tempo restante em MM:SS
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Calcula a porcentagem do tempo decorrido
  const totalSeconds = totalDurationMinutes * 60;
  const elapsedSeconds = totalSeconds - secondsRemaining;
  const progressPercent = Math.min(100, Math.max(0, (elapsedSeconds / totalSeconds) * 100));

  // Rótulos e cores dependendo do modo ativo
  const modeSettings = {
    focus: {
      label: 'Tempo de Foco',
      badgeClass: 'bg-red-500/20 text-red-400 border-red-500/30',
      progressClass: 'bg-red-500',
    },
    short_break: {
      label: 'Pausa Curta',
      badgeClass: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
      progressClass: 'bg-teal-500',
    },
    long_break: {
      label: 'Pausa Longa',
      badgeClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      progressClass: 'bg-blue-500',
    },
  };

  const currentModeInfo = modeSettings[mode];

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center justify-center p-8 rounded-3xl bg-bg-card border border-gray-700/50 backdrop-blur-md shadow-2xl mb-6">
      {/* Indicador do modo atual */}
      <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border mb-6 transition-all duration-500 ${currentModeInfo.badgeClass}`}>
        {currentModeInfo.label}
      </span>

      {/* Relógio Digital (fonte monoespaçada Fira Code) */}
      <div className="text-6xl md:text-8xl font-bold font-mono tracking-tighter text-white select-none transition-all duration-300 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] mb-8">
        {formattedTime}
      </div>

      {/* Barra de Progresso do Ciclo */}
      <div className="w-full h-2.5 bg-gray-800 rounded-full overflow-hidden border border-gray-700/30">
        <div
          className={`h-full rounded-full transition-all duration-300 ${currentModeInfo.progressClass}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
