import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import type { PomodoroPreset, PomodoroSettings } from '../types';

interface SettingsPanelProps {
  settings: PomodoroSettings;
  onChangePreset: (preset: PomodoroPreset) => void;
  onSaveCustomTimes: (focus: number, short: number, long: number) => void;
}

export function SettingsPanel({ settings, onChangePreset, onSaveCustomTimes }: SettingsPanelProps) {
  // Preset options
  const presets: { value: Exclude<PomodoroPreset, 'personalizado'>; label: string; desc: string }[] = [
    { value: 'iniciante', label: 'Iniciante', desc: '15m Foco / 3m Pausa' },
    { value: 'medio', label: 'Médio', desc: '25m Foco / 5m Pausa' },
    { value: 'avancado', label: 'Avançado', desc: '50m Foco / 10m Pausa' },
  ];

  // Local inputs state for Custom duration
  const [focus, setFocus] = useState(settings.focusTime);
  const [short, setShort] = useState(settings.shortBreakTime);
  const [long, setLong] = useState(settings.longBreakTime);

  useEffect(() => {
    setFocus(settings.focusTime);
    setShort(settings.shortBreakTime);
    setLong(settings.longBreakTime);
  }, [settings]);

  const handleCustomSubmit = (e: FormEvent) => {
    e.preventDefault();
    const validFocus = Math.min(Math.max(1, focus), 180);
    const validShort = Math.min(Math.max(1, short), 60);
    const validLong = Math.min(Math.max(1, long), 120);
    onSaveCustomTimes(validFocus, validShort, validLong);
  };

  return (
    <div className="w-full md:w-[300px] flex flex-col gap-5 p-5 rounded-3xl bg-bg-card/40 border border-gray-700/50 backdrop-blur-md">
      <div>
        <h3 className="text-base font-bold text-white mb-1">Configurações</h3>
        <p className="text-xs text-gray-400">Escolha seu ritmo ou personalize</p>
      </div>

      {/* Preset buttons container */}
      <div className="flex flex-col gap-2.5">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Presets</h4>
        
        {presets.map((preset) => {
          const isActive = settings.preset === preset.value;
          return (
            <button
              key={preset.value}
              type="button"
              onClick={() => onChangePreset(preset.value)}
              className={`p-3 rounded-xl border text-left flex flex-col transition-all duration-300 ${
                isActive
                  ? 'bg-accent-primary/20 border-accent-primary text-white shadow-lg shadow-accent-primary/5'
                  : 'bg-bg-card/25 border-gray-800/40 text-gray-400 hover:text-white hover:border-gray-700'
              }`}
            >
              <span className="font-bold text-sm">{preset.label}</span>
              <span className="text-[10px] text-gray-500 mt-0.5 font-mono">{preset.desc}</span>
            </button>
          );
        })}

        {/* Custom trigger button */}
        <button
          type="button"
          onClick={() => onChangePreset('personalizado')}
          className={`p-3 rounded-xl border text-left flex flex-col transition-all duration-300 ${
            settings.preset === 'personalizado'
              ? 'bg-accent-primary/20 border-accent-primary text-white shadow-lg shadow-accent-primary/5'
              : 'bg-bg-card/25 border-gray-800/40 text-gray-400 hover:text-white hover:border-gray-700'
          }`}
        >
          <span className="font-bold text-sm">Personalizado</span>
          <span className="text-[10px] text-gray-500 mt-0.5">Defina seus próprios limites</span>
        </button>
      </div>

      {/* Custom times fields (show only when preset is 'personalizado') */}
      {settings.preset === 'personalizado' && (
        <form onSubmit={handleCustomSubmit} className="flex flex-col gap-4 pt-4 border-t border-gray-800/60 animate-fadeIn">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Tempos Personalizados
          </h4>

          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center bg-bg-dark/30 p-2.5 rounded-xl border border-gray-800/60">
              <span className="text-xs text-gray-400 font-medium">Foco (min)</span>
              <input
                type="number"
                min="1"
                max="180"
                value={focus}
                onChange={(e) => setFocus(Number(e.target.value))}
                className="w-16 bg-bg-dark text-right text-white font-mono px-2 py-1 rounded border border-gray-700 focus:outline-none focus:border-accent-primary text-xs"
              />
            </div>

            <div className="flex justify-between items-center bg-bg-dark/30 p-2.5 rounded-xl border border-gray-800/60">
              <span className="text-xs text-gray-400 font-medium">Pausa Curta (min)</span>
              <input
                type="number"
                min="1"
                max="60"
                value={short}
                onChange={(e) => setShort(Number(e.target.value))}
                className="w-16 bg-bg-dark text-right text-white font-mono px-2 py-1 rounded border border-gray-700 focus:outline-none focus:border-accent-primary text-xs"
              />
            </div>

            <div className="flex justify-between items-center bg-bg-dark/30 p-2.5 rounded-xl border border-gray-800/60">
              <span className="text-xs text-gray-400 font-medium">Pausa Longa (min)</span>
              <input
                type="number"
                min="1"
                max="120"
                value={long}
                onChange={(e) => setLong(Number(e.target.value))}
                className="w-16 bg-bg-dark text-right text-white font-mono px-2 py-1 rounded border border-gray-700 focus:outline-none focus:border-accent-primary text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 rounded-xl text-xs font-bold bg-accent-primary text-white hover:bg-opacity-90 active:scale-98 transition-all"
          >
            Aplicar Tempos
          </button>
        </form>
      )}
    </div>
  );
}
