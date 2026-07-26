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

  // Calcula a porcentagem do tempo decorrido para o anel radial
  const totalSeconds = totalDurationMinutes * 60;
  const elapsedSeconds = totalSeconds - secondsRemaining;
  const progressPercent = Math.min(100, Math.max(0, (elapsedSeconds / totalSeconds) * 100));

  // Geometria do anel circular SVG
  const radius = 130;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  // O strokeDashoffset define o quanto do anel circular está "esvaziado"
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  // Rótulos e classes de cores para cada modo
  const modeSettings = {
    focus: {
      label: 'Foco',
      strokeColor: '#ef4444', // Vermelho (Tailwind red-500)
      glowClass: 'shadow-red-500/10 border-red-500/20',
      textClass: 'text-red-400',
    },
    short_break: {
      label: 'Pausa Curta',
      strokeColor: '#14b8a6', // Verde-água (Tailwind teal-500)
      glowClass: 'shadow-teal-500/10 border-teal-500/20',
      textClass: 'text-teal-400',
    },
    long_break: {
      label: 'Pausa Longa',
      strokeColor: '#3b82f6', // Azul (Tailwind blue-500)
      glowClass: 'shadow-blue-500/10 border-blue-500/20',
      textClass: 'text-blue-400',
    },
  };

  const currentSettings = modeSettings[mode];

  return (
    <div className="flex flex-col items-center justify-center my-6">
      {/* Container Relógio Esférico */}
      <div className={`relative w-[320px] h-[320px] rounded-full flex flex-col items-center justify-center bg-bg-card/30 border border-gray-700/30 backdrop-blur-md shadow-2xl transition-all duration-500 ${currentSettings.glowClass}`}>
        
        {/* SVG do Anel Circular de Progresso */}
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 280 280">
          {/* Anel de fundo (Track) */}
          <circle
            cx="140"
            cy="140"
            r={radius}
            className="stroke-gray-800/40 fill-none"
            strokeWidth={strokeWidth}
          />
          {/* Anel ativo de progresso */}
          <circle
            cx="140"
            cy="140"
            r={radius}
            className="fill-none transition-all duration-300 ease-linear"
            stroke={currentSettings.strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>

        {/* Textos Internos do Relógio */}
        <div className="z-10 flex flex-col items-center select-none text-center">
          <span className={`text-xs font-black uppercase tracking-widest mb-1 ${currentSettings.textClass}`}>
            {currentSettings.label}
          </span>
          <span className="text-6xl font-extrabold font-mono tracking-tighter text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.08)]">
            {formattedTime}
          </span>
          <span className="text-[10px] text-gray-500 font-mono mt-1">
            de {totalDurationMinutes}m
          </span>
        </div>
      </div>
    </div>
  );
}
