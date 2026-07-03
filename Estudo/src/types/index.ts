export interface User {
  id: string;
  name: string;
}

/**
 * Modos de execução do cronômetro Pomodoro
 */
export type PomodoroMode = 'focus' | 'short_break' | 'long_break';

/**
 * Níveis ou Presets de dificuldade de foco disponíveis
 */
export type PomodoroPreset = 'iniciante' | 'medio' | 'avancado' | 'personalizado';

/**
 * Configurações de tempo para cada modo do Pomodoro (em minutos)
 */
export interface PomodoroSettings {
  focusTime: number;
  shortBreakTime: number;
  longBreakTime: number;
  preset: PomodoroPreset;
}

/**
 * Histórico de sessões de estudo concluídas pelo usuário (persiste localmente)
 */
export interface PomodoroSession {
  id: string;
  timestamp: number; // Data em milissegundos de quando a sessão foi concluída
  mode: PomodoroMode; // O modo que foi concluído (normalmente 'focus')
  durationMinutes: number; // Duração em minutos daquela sessão
}
