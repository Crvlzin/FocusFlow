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

/**
 * Histórico de revisões individuais realizadas pelo usuário
 */
export interface ReviewHistoryEntry {
  id: string;
  date: string; // Data da revisão (YYYY-MM-DD)
  rating: 'forgot' | 'hard' | 'good' | 'easy'; // Nota de retenção
}

/**
 * Representa um assunto cadastrado para o ciclo de Revisão baseada em Ebbinghaus
 */
export interface ReviewTopic {
  id: string;
  subject: string; // Ex: Matemática, História
  topic: string; // Ex: Logaritmos, Revolução Francesa
  createdAt: string; // Data de criação (YYYY-MM-DD)
  lastReviewedAt: string | null; // Data da última revisão concluída (YYYY-MM-DD)
  nextReviewAt: string; // Data agendada da próxima revisão (YYYY-MM-DD)
  intervalDays: number; // Intervalo atual do espaçamento em dias
  repetitionCount: number; // Estágio do ciclo de revisão (1 = 24h, 2 = 7d, 3 = 15d, 4 = 30d, etc.)
  easinessFactor: number; // Fator de facilidade (SM-2, padrão 2.5)
  completed: boolean; // Indica se concluiu as revisões básicas do ciclo
  history: ReviewHistoryEntry[];
}

/**
 * Tabela usuarios (id_usuario UUID FK auth.users, nm_usuario TEXT, email TEXT, dt_criacao TIMESTAMP)
 */
export interface DbUser {
  id_usuario: string;
  nm_usuario: string;
  email: string;
  dt_criacao?: string;
}

/**
 * Tabela materias (id_materia UUID PK, id_usuario UUID FK, nm_materia TEXT)
 */
export interface DbMateria {
  id_materia: string;
  id_usuario: string;
  nm_materia: string;
}

/**
 * Tabela assuntos (id_assunto UUID PK, id_materia UUID FK, nm_assunto TEXT)
 */
export interface DbAssunto {
  id_assunto: string;
  id_materia: string;
  nm_assunto: string;
  
  // Opcional para junções
  materias?: DbMateria;
}

/**
 * Tabela estatisticas (id_estatistica UUID PK, id_usuario UUID FK, id_assunto UUID FK, qtd_certas INT, qtd_erradas INT, qtd_total INT, dt_registro TIMESTAMP)
 */
export interface DbEstatistica {
  id_estatistica: string;
  id_usuario: string;
  id_assunto: string;
  qtd_certas: number;
  qtd_erradas: number;
  qtd_total?: number;
  qtd_minutos: number;
  dt_registro: string;
  
  // Opcional para junções
  assuntos?: DbAssunto;
}

/**
 * Tabela revisoes (id_revisao UUID PK, id_usuario UUID FK, id_assunto UUID FK, dt_revisao TIMESTAMP, nivel_ciclo INT [1=24h, 2=7d, 3=15d, 4=30d], fl_concluida BOOLEAN, dt_conclusao TIMESTAMP)
 */
export interface DbRevisao {
  id_revisao: string;
  id_usuario: string;
  id_assunto: string;
  dt_revisao: string;
  nivel_ciclo: number; // 1 = 24h, 2 = 7d, 3 = 15d, 4 = 30d
  fl_concluida: boolean;
  dt_conclusao: string | null;
  
  // Opcional para junções
  assuntos?: DbAssunto;
}
