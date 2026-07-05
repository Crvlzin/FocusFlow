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

/**
 * Módulo de Métricas: Registro detalhado de rendimento de uma sessão de estudos
 */
export interface StudySessionMetric {
  id: string;
  subject: string; // Matéria estudada (ex: Matemática, Biologia)
  topic: string; // Assunto específico (ex: Álgebra Linear, Citologia)
  durationMinutes: number; // Tempo dedicado (em minutos)
  date: string; // Data do estudo (formato YYYY-MM-DD)
  questionsCorrect: number; // Quantidade de acertos
  questionsWrong: number; // Quantidade de erros
  questionsTotal: number; // Quantidade total de questões resolvidas
}
