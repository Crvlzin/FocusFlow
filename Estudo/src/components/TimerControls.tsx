
interface TimerControlsProps {
  isRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSkip: () => void;
}

export function TimerControls({ isRunning, onStart, onPause, onReset, onSkip }: TimerControlsProps) {
  return (
    <div className="w-full max-w-xl mx-auto flex items-center justify-center gap-4 mb-6">
      {/* Botão de Reset */}
      <button
        type="button"
        onClick={onReset}
        title="Reiniciar cronômetro"
        className="p-4 rounded-full border border-gray-700 bg-bg-card/30 text-gray-400 hover:text-white hover:border-gray-500 active:scale-95 transition-all duration-200"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
      </button>

      {/* Botão Principal: Play/Pause */}
      <button
        type="button"
        onClick={isRunning ? onPause : onStart}
        className={`px-8 py-5 rounded-2xl font-bold uppercase tracking-wider text-white shadow-xl hover:bg-opacity-90 active:scale-95 transition-all duration-300 ${
          isRunning
            ? 'bg-amber-600 shadow-amber-600/10'
            : 'bg-accent-primary shadow-accent-primary/20'
        }`}
      >
        {isRunning ? (
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
              <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
            </svg>
            Pausar
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
              <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
            </svg>
            Iniciar
          </div>
        )}
      </button>

      {/* Botão de Pular (Skip) */}
      <button
        type="button"
        onClick={onSkip}
        title="Pular sessão"
        className="p-4 rounded-full border border-gray-700 bg-bg-card/30 text-gray-400 hover:text-white hover:border-gray-500 active:scale-95 transition-all duration-200"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.25V18a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 18V8.25m-18 0V6a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 6v2.25m-18 0h18M5.25 6h.008v.008H5.25V6zM7.5 6h.008v.008H7.5V6zm2.25 0h.008v.008H9.75V6z" />
        </svg>
      </button>
    </div>
  );
}
