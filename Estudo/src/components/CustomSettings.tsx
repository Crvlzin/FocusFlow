import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import type { PomodoroSettings } from '../types';

interface CustomSettingsProps {
  settings: PomodoroSettings;
  onSaveCustomTimes: (focus: number, short: number, long: number) => void;
}

export function CustomSettings({ settings, onSaveCustomTimes }: CustomSettingsProps) {
  // Estados locais para controlar os inputs de forma amigável antes de salvar
  const [focus, setFocus] = useState(settings.focusTime);
  const [short, setShort] = useState(settings.shortBreakTime);
  const [long, setLong] = useState(settings.longBreakTime);

  // Sincroniza os estados locais se as configurações globais mudarem (por exemplo, se o usuário trocar o preset)
  useEffect(() => {
    setFocus(settings.focusTime);
    setShort(settings.shortBreakTime);
    setLong(settings.longBreakTime);
  }, [settings]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    // Validações básicas de tempo (mínimo de 1 minuto, máximo de 180 minutos)
    const validFocus = Math.min(Math.max(1, focus), 180);
    const validShort = Math.min(Math.max(1, short), 60);
    const validLong = Math.min(Math.max(1, long), 120);

    onSaveCustomTimes(validFocus, validShort, validLong);
  };

  return (
    <div className="w-full max-w-xl mx-auto mb-6 p-4 rounded-2xl bg-bg-card/40 border border-gray-700/50 backdrop-blur-md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">
          Configuração de Ciclo Customizado
        </h4>
        
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400 font-medium">Foco (min)</label>
            <input
              type="number"
              min="1"
              max="180"
              value={focus}
              onChange={(e) => setFocus(Number(e.target.value))}
              className="bg-bg-dark/80 text-white font-mono px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-accent-primary"
            />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400 font-medium">P. Curta (min)</label>
            <input
              type="number"
              min="1"
              max="60"
              value={short}
              onChange={(e) => setShort(Number(e.target.value))}
              className="bg-bg-dark/80 text-white font-mono px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-accent-primary"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400 font-medium">P. Longa (min)</label>
            <input
              type="number"
              min="1"
              max="120"
              value={long}
              onChange={(e) => setLong(Number(e.target.value))}
              className="bg-bg-dark/80 text-white font-mono px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-accent-primary"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full mt-2 py-2 px-4 rounded-xl text-sm font-semibold bg-accent-primary text-white hover:bg-opacity-90 active:scale-98 transition-all shadow-md shadow-accent-primary/20"
        >
          Aplicar Novos Tempos
        </button>
      </form>
    </div>
  );
}
