import type { PomodoroPreset } from '../types';

interface PresetSelectorProps {
  currentPreset: PomodoroPreset;
  onChangePreset: (preset: PomodoroPreset) => void;
}

export function PresetSelector({ currentPreset, onChangePreset }: PresetSelectorProps) {
  const options: { value: PomodoroPreset; label: string; description: string }[] = [
    { value: 'iniciante', label: 'Iniciante', description: '15m Foco / 3m Pausa' },
    { value: 'medio', label: 'Médio', description: '25m Foco / 5m Pausa' },
    { value: 'avancado', label: 'Avançado', description: '50m Foco / 10m Pausa' },
    { value: 'personalizado', label: 'Personalizado', description: 'Ajuste livre' },
  ];

  return (
    <div className="w-full max-w-xl mx-auto mb-6">
      <h3 className="text-sm font-semibold tracking-wider uppercase text-gray-400 mb-3 text-center">
        Selecione o nível de foco
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {options.map((option) => {
          const isActive = currentPreset === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChangePreset(option.value)}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all duration-300 ${
                isActive
                  ? 'bg-accent-primary/20 border-accent-primary text-white shadow-lg shadow-accent-primary/10'
                  : 'bg-bg-card/40 border-gray-700/50 text-gray-400 hover:text-white hover:border-gray-500'
              }`}
            >
              <span className="font-bold text-sm md:text-base">{option.label}</span>
              <span className="text-[10px] md:text-xs text-gray-500 mt-1 text-center font-mono">
                {option.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
