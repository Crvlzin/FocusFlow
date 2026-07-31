import { useState, useEffect, useRef } from 'react';
import type { PomodoroMode, PomodoroPreset, PomodoroSettings, PomodoroSession } from '../types';

// Constantes de tempos padrões para cada preset (em minutos)
const PRESETS: Record<Exclude<PomodoroPreset, 'personalizado'>, Omit<PomodoroSettings, 'preset'>> = {
  iniciante: { focusTime: 15, shortBreakTime: 3, longBreakTime: 10 },
  medio: { focusTime: 25, shortBreakTime: 5, longBreakTime: 15 },
  avancado: { focusTime: 50, shortBreakTime: 10, longBreakTime: 20 },
};

const LOCAL_STORAGE_KEYS = {
  SETTINGS: 'estudo_pomodoro_settings',
  HISTORY: 'estudo_pomodoro_history',
};
//
// Configuração padrão inicial da aplicação
const DEFAULT_SETTINGS: PomodoroSettings = {
  focusTime: 25,
  shortBreakTime: 5,
  longBreakTime: 15,
  preset: 'medio',
};

export function usePomodoro() {
  // --- Estados do Cronômetro ---
  const [settings, setSettings] = useState<PomodoroSettings>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.SETTINGS);
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [mode, setMode] = useState<PomodoroMode>('focus');
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState<PomodoroSession[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.HISTORY);
    return saved ? JSON.parse(saved) : [];
  });

  // Quantidade de segundos restantes no bloco atual
  const [secondsRemaining, setSecondsRemaining] = useState(() => {
    return DEFAULT_SETTINGS.focusTime * 60;
  });

  // Contador de rounds de Foco concluídos
  const [focusRounds, setFocusRounds] = useState(0);

  // --- Referências para controle de tempo preciso (Date.now) ---
  // Essas refs evitam o bug de atraso no timer quando a aba do navegador fica em segundo plano
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const startSecondsRemainingRef = useRef<number>(0);

  // Efeito para sincronizar os segundos sempre que mudar o modo ou as configurações de tempo
  useEffect(() => {
    let minutes = settings.focusTime;
    if (mode === 'short_break') minutes = settings.shortBreakTime;
    if (mode === 'long_break') minutes = settings.longBreakTime;

    setSecondsRemaining(minutes * 60);
    // Se o timer estiver rodando e mudar de modo, pausamos para evitar comportamento inesperado
    setIsRunning(false);
  }, [mode, settings]);

  // Efeito para persistir configurações sempre que forem alteradas pelo usuário
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  // Efeito para persistir o histórico de sessões
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.HISTORY, JSON.stringify(completedSessions));
  }, [completedSessions]);

  // Efeito principal do Cronômetro que executa a contagem precisa
  useEffect(() => {
    if (isRunning) {
      // 1. Registramos o carimbo de data/hora atual e os segundos que tínhamos no início do ciclo
      startTimeRef.current = Date.now();
      startSecondsRemainingRef.current = secondsRemaining;

      // 2. Iniciamos um intervalo curto (de 100ms) para recalcular rapidamente o tempo
      timerRef.current = window.setInterval(() => {
        const timePassedMs = Date.now() - startTimeRef.current;
        const secondsPassed = Math.floor(timePassedMs / 1000);
        const nextSecondsRemaining = startSecondsRemainingRef.current - secondsPassed;

        if (nextSecondsRemaining <= 0) {
          // Tempo esgotado!
          handleSessionCompletion();
        } else {
          setSecondsRemaining(nextSecondsRemaining);
        }
      }, 100);
    } else {
      // Se pausar, limpamos o intervalo
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    // Cleanup do useEffect para garantir que não vazaremos timers na memória
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning]);

  // Efeito para atualizar dinamicamente o título da aba do navegador
  useEffect(() => {
    if (isRunning) {
      const min = Math.floor(secondsRemaining / 60).toString().padStart(2, '0');
      const sec = (secondsRemaining % 60).toString().padStart(2, '0');

      let modeLabel = 'Foco';
      if (mode === 'short_break') modeLabel = 'Pausa Curta';
      if (mode === 'long_break') modeLabel = 'Pausa Longa';

      document.title = `(${min}:${sec}) ${modeLabel} | FocusFlow`;
    } else {
      document.title = 'FocusFlow';
    }

    // Restaurar título padrão quando o componente for desmontado
    return () => {
      document.title = 'FocusFlow';
    };
  }, [secondsRemaining, mode, isRunning]);


  // --- Função auxiliar de conclusão de ciclo ---
  const handleSessionCompletion = () => {
    setIsRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Tocar um bipe sonoro simples no navegador usando a API de Áudio do HTML5
    playBeepSound();

    let nextMode: PomodoroMode = 'focus';
    let durationMinutes = settings.focusTime;

    if (mode === 'focus') {
      const updatedRounds = focusRounds + 1;
      setFocusRounds(updatedRounds);

      // Registra a sessão concluída no histórico (para as estatísticas futuras)
      const newSession: PomodoroSession = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        mode: 'focus',
        durationMinutes: settings.focusTime,
      };
      setCompletedSessions((prev) => [newSession, ...prev]);

      // A cada 4 sessões de Foco, fazemos uma pausa longa, senão uma pausa curta
      if (updatedRounds % 4 === 0) {
        nextMode = 'long_break';
        durationMinutes = settings.longBreakTime;
      } else {
        nextMode = 'short_break';
        durationMinutes = settings.shortBreakTime;
      }
    } else {
      // Se encerrou uma pausa (curta ou longa), volta para o estado de Foco
      nextMode = 'focus';
      durationMinutes = settings.focusTime;
    }

    // Atualiza estados
    setMode(nextMode);
    setSecondsRemaining(durationMinutes * 60);
  };

  // --- API do Hook (Funções públicas) ---

  const start = () => setIsRunning(true);
  const pause = () => setIsRunning(false);
  const reset = () => {
    setIsRunning(false);
    let minutes = settings.focusTime;
    if (mode === 'short_break') minutes = settings.shortBreakTime;
    if (mode === 'long_break') minutes = settings.longBreakTime;
    setSecondsRemaining(minutes * 60);
  };

  // Pula a sessão atual indo direto para a próxima
  const skip = () => {
    if (window.confirm('Deseja mesmo pular a sessão atual?')) {
      handleSessionCompletion();
    }
  };

  // Altera o preset de tempos do Pomodoro
  const changePreset = (preset: PomodoroPreset) => {
    setIsRunning(false);

    if (preset === 'personalizado') {
      setSettings((prev) => ({
        ...prev,
        preset: 'personalizado',
      }));
    } else {
      const times = PRESETS[preset];
      setSettings({
        ...times,
        preset,
      });
    }
  };

  // Atualiza os tempos do modo personalizado
  const updateCustomTimes = (focus: number, short: number, long: number) => {
    setIsRunning(false);
    setSettings({
      focusTime: focus,
      shortBreakTime: short,
      longBreakTime: long,
      preset: 'personalizado',
    });
  };

  // Limpa o histórico de estudos do usuário
  const clearHistory = () => {
    if (window.confirm('Tem certeza que deseja apagar todo o seu histórico de foco?')) {
      setCompletedSessions([]);
      setFocusRounds(0);
    }
  };

  // Altera manualmente o modo ativo (Foco / Pausa Curta / Pausa Longa)
  const changeMode = (newMode: PomodoroMode) => {
    setIsRunning(false);
    setMode(newMode);
  };

  // Gera som simples via sintetizador do navegador
  const playBeepSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.value = 880; // Frequência do bipe (Lá maior)

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) {
      console.warn('AudioContext não suportado ou bloqueado pelo navegador:', e);
    }
  };

  // Retorna os dados necessários formatados
  return {
    secondsRemaining,
    mode,
    isRunning,
    settings,
    focusRounds,
    completedSessions,
    start,
    pause,
    reset,
    skip,
    changePreset,
    updateCustomTimes,
    clearHistory,
    changeMode,
  };
}
