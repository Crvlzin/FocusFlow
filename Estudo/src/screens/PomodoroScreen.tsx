import { usePomodoro } from '../hooks';
import {
  PresetSelector,
  CustomSettings,
  TimerDisplay,
  TimerControls,
  HistoryPanel,
} from '../components';

export function PomodoroScreen() {
  const {
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
  } = usePomodoro();

  // Mapeia o total de minutos correspondente ao modo atual
  const totalDurationMinutes =
    mode === 'focus'
      ? settings.focusTime
      : mode === 'short_break'
      ? settings.shortBreakTime
      : settings.longBreakTime;

  // Estilização dinâmica de fundo com base no modo ativo para feedback visual sutil
  const bgStyles = {
    focus: 'from-red-950/20 via-bg-dark to-bg-dark text-red-50',
    short_break: 'from-teal-950/20 via-bg-dark to-bg-dark text-teal-50',
    long_break: 'from-blue-950/20 via-bg-dark to-bg-dark text-blue-50',
  };

  return (
    <div className={`min-h-screen bg-gradient-to-b ${bgStyles[mode]} py-12 px-4 transition-colors duration-1000`}>
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        
        {/* Cabeçalho da Aplicação */}
        <header className="text-center mb-4">
          <h1 className="text-4xl md:text-5xl font-black font-display tracking-tight text-white mb-2">
            Focus<span className="text-accent-secondary">Flow</span>
          </h1>
          <p className="text-sm md:text-base text-gray-400 font-medium">
            Gerencie seu tempo de estudo, cultive hábitos e alcance seus objetivos.
          </p>
        </header>

        {/* Seletor de Presets (Nível de Foco) */}
        <PresetSelector
          currentPreset={settings.preset}
          onChangePreset={changePreset}
        />

        {/* Configuração de tempos personalizados (só exibe se o preset for personalizado) */}
        {settings.preset === 'personalizado' && (
          <CustomSettings
            settings={settings}
            onSaveCustomTimes={updateCustomTimes}
          />
        )}

        {/* Display do Relógio Digital */}
        <TimerDisplay
          secondsRemaining={secondsRemaining}
          totalDurationMinutes={totalDurationMinutes}
          mode={mode}
        />

        {/* Controles do Cronômetro */}
        <TimerControls
          isRunning={isRunning}
          onStart={start}
          onPause={pause}
          onReset={reset}
          onSkip={skip}
        />

        {/* Painel do Histórico e Estatísticas */}
        <HistoryPanel
          history={completedSessions}
          focusRounds={focusRounds}
          onClearHistory={clearHistory}
        />

      </div>
    </div>
  );
}
