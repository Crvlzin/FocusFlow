import { useState } from 'react';
import type { PomodoroMode } from '../types';
import { usePomodoro } from '../hooks';
import {
  Sidebar,
  SettingsPanel,
  TimerDisplay,
  TimerControls,
  HistoryPanel,
} from '../components';
import { StatsScreen } from './StatsScreen';

export function PomodoroScreen() {
  // Estado local para gerenciar a tela/aba ativa na barra de navegação esquerda
  const [activeTab, setActiveTab] = useState('timer');

  // Estados locais para controlar a visibilidade das barras laterais
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(true);

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
    changeMode,
  } = usePomodoro();

  // Mapeia o total de minutos correspondente ao modo atual do cronômetro
  const totalDurationMinutes =
    mode === 'focus'
      ? settings.focusTime
      : mode === 'short_break'
        ? settings.shortBreakTime
        : settings.longBreakTime;

  // Modificação de cor gradiente do fundo com base no modo atual do cronômetro
  const bgStyles = {
    focus: 'from-red-950/15 via-bg-dark to-bg-dark',
    short_break: 'from-teal-950/15 via-bg-dark to-bg-dark',
    long_break: 'from-blue-950/15 via-bg-dark to-bg-dark',
  };

  // Renderiza o painel central dependendo da aba ativa na sidebar
  const renderCenterContent = () => {
    switch (activeTab) {
      case 'timer':
        return (
          <div className="flex-1 flex flex-col lg:flex-row gap-6 animate-fadeIn">
            {/* Coluna Central: Zona de Foco, Cronômetro Circular e Controles */}
            <div className="flex-1 flex flex-col items-center justify-center p-4">

              {/* 1. Barra Superior de Seleção de Modo com Toggles de Colunas */}
              <div className="w-full max-w-xl flex items-center justify-between gap-4 mb-4">
                
                {/* Botão para Mostrar/Esconder Sidebar Esquerda */}
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className={`p-2.5 rounded-2xl border transition-all duration-300 cursor-pointer ${
                    isSidebarOpen
                      ? 'bg-accent-primary/10 text-accent-primary border-accent-primary/20 hover:bg-accent-primary/20'
                      : 'bg-bg-card/30 text-gray-400 border-gray-700/20 hover:text-white hover:bg-bg-card/50'
                  }`}
                  title={isSidebarOpen ? 'Ocultar Menu Lateral' : 'Mostrar Menu Lateral'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                  </svg>
                </button>

                {/* Cápsula Horizontal de Modos de Tempo */}
                <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-bg-card/30 border border-gray-700/20 backdrop-blur-md">
                  {(['focus', 'short_break', 'long_break'] as PomodoroMode[]).map((m) => {
                    const isActive = mode === m;
                    const labels = {
                      focus: 'Tempo de Foco',
                      short_break: 'Pausa Curta',
                      long_break: 'Pausa Longa',
                    };
                    const activeColors = {
                      focus: 'bg-red-500/15 text-red-400 border-red-500/25',
                      short_break: 'bg-teal-500/15 text-teal-400 border-teal-500/25',
                      long_break: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
                    };

                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => changeMode(m)}
                        className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[10px] md:text-xs font-bold transition-all duration-300 border cursor-pointer ${
                          isActive
                            ? `${activeColors[m]}`
                            : 'border-transparent text-gray-500 hover:text-white'
                        }`}
                      >
                        {labels[m]}
                      </button>
                    );
                  })}
                </div>

                {/* Botão para Mostrar/Esconder SettingsPanel Direito */}
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  className={`p-2.5 rounded-2xl border transition-all duration-300 cursor-pointer ${
                    isSettingsOpen
                      ? 'bg-accent-primary/10 text-accent-primary border-accent-primary/20 hover:bg-accent-primary/20'
                      : 'bg-bg-card/30 text-gray-400 border-gray-700/20 hover:text-white hover:bg-bg-card/50'
                  }`}
                  title={isSettingsOpen ? 'Ocultar Configurações' : 'Mostrar Configurações'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                  </svg>
                </button>

              </div>

              {/* 2. Cronômetro Esférico (Relógio Circular) */}
              <TimerDisplay
                secondsRemaining={secondsRemaining}
                totalDurationMinutes={totalDurationMinutes}
                mode={mode}
              />

              {/* 3. Controles Inferiores (Começar/Pausa e Pular/Reset) */}
              <TimerControls
                isRunning={isRunning}
                onStart={start}
                onPause={pause}
                onReset={reset}
                onSkip={skip}
              />

              {/* 4. Painel de Histórico e Progresso do Dia */}
              <div className="w-full mt-4">
                <HistoryPanel
                  history={completedSessions}
                  focusRounds={focusRounds}
                  onClearHistory={clearHistory}
                />
              </div>

            </div>

            {/* Coluna Direita: Painel Integrado de Presets (Com animação de colapso) */}
            <div className={`transition-all duration-300 ease-in-out overflow-hidden flex flex-col py-4 ${
              isSettingsOpen 
                ? 'w-full md:w-[300px] opacity-100' 
                : 'w-0 opacity-0 pointer-events-none md:py-0'
            }`}>
              <div className="w-full md:w-[300px] flex flex-col h-full">
                <SettingsPanel
                  settings={settings}
                  onChangePreset={changePreset}
                  onSaveCustomTimes={updateCustomTimes}
                />
              </div>
            </div>
          </div>
        );
      
      case 'tasks':
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-bg-card/20 border border-gray-700/20 rounded-3xl backdrop-blur-md min-h-[400px] text-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-accent-secondary mb-3 opacity-60">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h2 className="text-xl font-bold text-white mb-1">Painel de Tarefas</h2>
            <p className="text-sm text-gray-400 max-w-sm">Esta tela será implementada nas próximas etapas de desenvolvimento.</p>
          </div>
        );

      case 'stats':
        return <StatsScreen isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />;

      case 'settings':
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-bg-card/20 border border-gray-700/20 rounded-3xl backdrop-blur-md min-h-[400px] text-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-400 mb-3 opacity-60">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87" />
            </svg>
            <h2 className="text-xl font-bold text-white mb-1">Configurações do Sistema</h2>
            <p className="text-sm text-gray-400 max-w-sm">Opções adicionais de notificações e temas serão adicionadas aqui.</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-b ${bgStyles[mode]} py-8 px-4 md:px-8 transition-colors duration-1000 flex items-center justify-center overflow-x-hidden`}>
      <div className="max-w-7xl w-full flex flex-col md:flex-row gap-6 items-stretch">

        {/* Coluna 1 (Esquerda): Sidebar de Navegação (Com animação de colapso) */}
        <div className={`transition-all duration-300 ease-in-out overflow-hidden flex flex-col ${
          isSidebarOpen 
            ? 'w-full md:w-[250px] opacity-100' 
            : 'w-0 opacity-0 pointer-events-none md:mr-0'
        }`}>
          <div className="w-full md:w-[250px] flex flex-col h-full">
            <Sidebar activeTab={activeTab} onChangeTab={setActiveTab} />
          </div>
        </div>

        {/* Coluna 2 (Centro) e 3 (Direita): Renderização dinâmica baseada no menu */}
        {renderCenterContent()}

      </div>
    </div>
  );
}
