import { useState } from 'react';
import { useReviews, getTodayDateString, addDays } from '../hooks/useReviews';
import type { ReviewTopic } from '../types';

interface ReviewsScreenProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

export function ReviewsScreen({ isSidebarOpen, setIsSidebarOpen }: ReviewsScreenProps) {
  const {
    todayReviews,
    upcomingReviews,
    reviews,
    addReviewTopic,
    completeReview,
    deleteReviewTopic,
    resetReviewCycle,
  } = useReviews();

  // Estados locais
  const [activeSubTab, setActiveSubTab] = useState<'today' | 'upcoming' | 'all'>('today');
  const [newSubject, setNewSubject] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [reviewingTopicId, setReviewingTopicId] = useState<string | null>(null);
  const [showInfoPanel, setShowInfoPanel] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(true);

  // Manipulador de submissão do formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newTopic.trim()) return;
    addReviewTopic(newSubject, newTopic);
    setNewSubject('');
    setNewTopic('');
  };

  // Filtra as matérias baseado na busca
  const filterList = (list: ReviewTopic[]) => {
    if (!filterSubject.trim()) return list;
    return list.filter(
      (item) =>
        item.subject.toLowerCase().includes(filterSubject.toLowerCase()) ||
        item.topic.toLowerCase().includes(filterSubject.toLowerCase())
    );
  };

  const filteredToday = filterList(todayReviews);
  const filteredUpcoming = filterList(upcomingReviews);
  const filteredAll = filterList(reviews);

  // Formata datas para exibição legível
  const formatDateReadable = (dateStr: string) => {
    const today = getTodayDateString();
    if (dateStr === today) return 'Hoje';
    if (dateStr === addDays(today, 1)) return 'Amanhã';

    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year.slice(-2)}`;
  };

  // Componente interno para renderizar o gráfico SVG interativo da Curva do Esquecimento
  const ForgettingCurveChart = ({ repetitionCount }: { repetitionCount: number }) => {
    // Dimensões do gráfico
    const w = 400;
    const h = 140;
    const padding = 20;

    // Função de geração da linha da curva com base na quantidade de revisões concluídas
    // Eixo X: Dias de 0 a 30 (Mapeado de padding a w-padding)
    // Eixo Y: Retenção de 0% a 100% (Mapeado de h-padding a padding)
    const getX = (day: number) => padding + (day / 30) * (w - 2 * padding);
    const getY = (retention: number) => h - padding - (retention / 100) * (h - 2 * padding);

    // 1. Curva de Esquecimento sem revisões (Vermelha)
    // Decai rápido para 20% no final de 30 dias
    const noReviewPath = `
      M ${getX(0)} ${getY(100)} 
      C ${getX(2)} ${getY(50)}, ${getX(10)} ${getY(25)}, ${getX(30)} ${getY(20)}
    `;

    // 2. Curva de Esquecimento com revisões realizadas (Ciano/Violeta)
    let reviewPath = `M ${getX(0)} ${getY(100)}`;

    // Dia 1 (Revisão 24h)
    if (repetitionCount >= 1) {
      // Cai até 33% no dia 1, depois sobe para 100%
      reviewPath += ` Q ${getX(0.5)} ${getY(60)}, ${getX(1)} ${getY(33)}`;
      reviewPath += ` L ${getX(1)} ${getY(100)}`;
    } else {
      // Se não revisou ainda, desenha o decaimento até o ponto atual (aproximadamente hoje/dia 1)
      reviewPath += ` Q ${getX(0.5)} ${getY(60)}, ${getX(1)} ${getY(33)}`;
    }

    // Dia 7 (Revisão 7d)
    if (repetitionCount >= 2) {
      // Do dia 1 ao 7 decai mais devagar (até 50%), depois sobe para 100%
      reviewPath += ` Q ${getX(4)} ${getY(65)}, ${getX(7)} ${getY(50)}`;
      reviewPath += ` L ${getX(7)} ${getY(100)}`;
    } else if (repetitionCount === 1) {
      // Decaindo após a primeira revisão
      reviewPath += ` Q ${getX(4)} ${getY(65)}, ${getX(7)} ${getY(50)}`;
    }

    // Dia 15 (Revisão 15d)
    if (repetitionCount >= 3) {
      // Do dia 7 ao 15 decai menos ainda (até 70%), depois sobe para 100%
      reviewPath += ` Q ${getX(11)} ${getY(80)}, ${getX(15)} ${getY(70)}`;
      reviewPath += ` L ${getX(15)} ${getY(100)}`;
    } else if (repetitionCount === 2) {
      // Decaindo após a segunda revisão
      reviewPath += ` Q ${getX(11)} ${getY(80)}, ${getX(15)} ${getY(70)}`;
    }

    // Dia 30 (Revisão 30d)
    if (repetitionCount >= 4) {
      // Do dia 15 ao 30 decai quase nada (até 85%), depois sobe para 100%
      reviewPath += ` Q ${getX(22)} ${getY(90)}, ${getX(30)} ${getY(85)}`;
      reviewPath += ` L ${getX(30)} ${getY(100)}`;
    } else if (repetitionCount === 3) {
      // Decaindo após a terceira revisão
      reviewPath += ` Q ${getX(22)} ${getY(90)}, ${getX(30)} ${getY(85)}`;
    }

    return (
      <div className="relative w-full">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-32 bg-bg-dark/40 rounded-xl border border-gray-800/40 p-1">
          <defs>
            <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Linhas de grade horizontais (Retenção 50% e 100%) */}
          <line x1={padding} y1={getY(100)} x2={w - padding} y2={getY(100)} stroke="#374151" strokeDasharray="3 3" strokeWidth={1} />
          <line x1={padding} y1={getY(50)} x2={w - padding} y2={getY(50)} stroke="#1f2937" strokeDasharray="3 3" strokeWidth={1} />

          {/* Eixo de Referência vertical dos marcos (1d, 7d, 15d, 30d) */}
          <line x1={getX(1)} y1={padding} x2={getX(1)} y2={h - padding} stroke="#1f2937" strokeWidth={1} />
          <line x1={getX(7)} y1={padding} x2={getX(7)} y2={h - padding} stroke="#1f2937" strokeWidth={1} />
          <line x1={getX(15)} y1={padding} x2={getX(15)} y2={h - padding} stroke="#1f2937" strokeWidth={1} />
          <line x1={getX(30)} y1={padding} x2={getX(30)} y2={h - padding} stroke="#1f2937" strokeWidth={1} />

          {/* Curva Vermelha (Sem Revisão) */}
          <path d={noReviewPath} fill="none" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="3 2" opacity={0.4} />

          {/* Curva Neon (Com Revisão) */}
          <path d={reviewPath} fill="none" stroke="#06b6d4" strokeWidth={2.5} filter="url(#glow-cyan)" />

          {/* Pontos indicadores nos dias de revisão */}
          <circle cx={getX(0)} cy={getY(100)} r={3} fill="#8b5cf6" />
          <circle cx={getX(1)} cy={getY(33)} r={3} fill={repetitionCount >= 1 ? '#06b6d4' : '#4b5563'} />
          <circle cx={getX(7)} cy={getY(50)} r={3} fill={repetitionCount >= 2 ? '#06b6d4' : '#4b5563'} />
          <circle cx={getX(15)} cy={getY(70)} r={3} fill={repetitionCount >= 3 ? '#06b6d4' : '#4b5563'} />
          <circle cx={getX(30)} cy={getY(85)} r={3} fill={repetitionCount >= 4 ? '#06b6d4' : '#4b5563'} />

          {/* Rótulos dos Eixos */}
          <text x={getX(0)} y={h - 4} fontSize="8" fill="#9ca3af" textAnchor="middle">0d</text>
          <text x={getX(1)} y={h - 4} fontSize="8" fill="#9ca3af" textAnchor="middle">1d</text>
          <text x={getX(7)} y={h - 4} fontSize="8" fill="#9ca3af" textAnchor="middle">7d</text>
          <text x={getX(15)} y={h - 4} fontSize="8" fill="#9ca3af" textAnchor="middle">15d</text>
          <text x={getX(30)} y={h - 4} fontSize="8" fill="#9ca3af" textAnchor="middle">30d</text>

          <text x={padding - 5} y={getY(100) + 3} fontSize="8" fill="#9ca3af" textAnchor="end">100%</text>
          <text x={padding - 5} y={getY(50) + 3} fontSize="8" fill="#9ca3af" textAnchor="end">50%</text>
        </svg>
        <div className="flex items-center justify-between mt-1 px-1">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 border-t-2 border-dashed border-red-500/50"></span>
            <span className="text-[9px] text-gray-500 font-medium">Curva Sem Revisão</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-cyan-400"></span>
            <span className="text-[9px] text-cyan-400 font-semibold font-display">Sua Retenção Estimada</span>
          </div>
        </div>
      </div>
    );
  };

  // Componente interno para renderizar a Linha de Marcos de Revisão (Timeline Stepper)
  const RevisionStepper = ({ topic }: { topic: ReviewTopic }) => {
    // Mapeia o progresso do ciclo
    // Estágios: 0 (não revisado), 1 (revisão de 24h feita), 2 (7 dias feita), 3 (15 dias feita), 4 (30 dias feita)
    const stages = [
      { id: 1, label: '24h', labelLong: '1 Dia' },
      { id: 2, label: '7d', labelLong: '7 Dias' },
      { id: 3, label: '15d', labelLong: '15 Dias' },
      { id: 4, label: '30d', labelLong: '30 Dias' },
    ];

    return (
      <div className="flex items-center justify-between w-full relative py-3">
        {/* Barra de Progresso Traseira */}
        <div className="absolute left-[8%] right-[8%] top-[26px] h-0.5 bg-gray-800" />

        {/* Barra de Progresso Ativa */}
        <div
          className="absolute left-[8%] top-[26px] h-0.5 bg-gradient-to-r from-accent-primary to-accent-secondary transition-all duration-500 ease-in-out"
          style={{
            width: `${Math.min(100, Math.max(0, (topic.repetitionCount / 4) * 84))}%`
          }}
        />

        {stages.map((stage) => {
          const isDone = topic.repetitionCount >= stage.id;
          const isNext = topic.repetitionCount === stage.id - 1 && !topic.completed;

          return (
            <div key={stage.id} className="flex flex-col items-center z-10 flex-1 relative">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] transition-all duration-500 ${isDone
                  ? 'bg-gradient-to-tr from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/20'
                  : isNext
                    ? 'bg-bg-dark border-2 border-accent-secondary text-white shadow-lg shadow-accent-secondary/15 scale-110 animate-pulse'
                    : 'bg-bg-dark border border-gray-800 text-gray-500'
                  }`}
              >
                {isDone ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                ) : (
                  stage.label
                )}
              </div>
              <span className={`text-[9px] mt-1 font-semibold ${isDone ? 'text-green-400' : isNext ? 'text-accent-secondary' : 'text-gray-500'}`}>
                {stage.labelLong}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col gap-6 p-4 md:p-6 w-full max-w-7xl mx-auto animate-fadeIn overflow-y-auto max-h-[95vh] custom-scrollbar">

      {/* Cabeçalho */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-800/60">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-2.5 rounded-2xl border transition-all duration-300 cursor-pointer ${isSidebarOpen
              ? 'bg-accent-primary/10 text-accent-primary border-accent-primary/20 hover:bg-accent-primary/20'
              : 'bg-bg-card/30 text-gray-400 border-gray-700/20 hover:text-white hover:bg-bg-card/50'
              }`}
            title={isSidebarOpen ? 'Ocultar Menu' : 'Mostrar Menu'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
          </button>

          <div>
            <h2 className="text-xl md:text-2xl font-black font-display text-white flex items-center gap-2">
              Revisões Inteligentes
            </h2>
            <p className="text-[10px] md:text-xs text-gray-400 font-medium">
              Vença a curva do esquecimento estudando em intervalos otimizados para máxima retenção de memória.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsFormOpen(!isFormOpen)}
            className={`py-1.5 px-3 rounded-lg border text-[11px] font-bold transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${isFormOpen
              ? 'bg-accent-primary/10 text-accent-primary border-accent-primary/20'
              : 'bg-bg-card/30 text-gray-500 border-gray-700/20 hover:text-white'
              }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
              {isFormOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              )}
            </svg>
            {isFormOpen ? 'Ocultar Formulário' : 'Novo Assunto'}
          </button>

          <button
            type="button"
            onClick={() => setShowInfoPanel(!showInfoPanel)}
            className={`py-1.5 px-3 rounded-lg border text-[11px] font-bold transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${showInfoPanel
              ? 'bg-accent-secondary/10 text-accent-secondary border-accent-secondary/20'
              : 'bg-bg-card/30 text-gray-500 border-gray-700/20 hover:text-white'
              }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 111.085 1.085l-.041.02m0 0a1.5 1.5 0 10-2.25-2.25m2.25 2.25L9 15m.75-12h11.25c.621 0 1.125.504 1.125 1.125v17.25c0 .621-.504 1.125-1.125 1.125H9.75a1.125 1.125 0 01-1.125-1.125V4.125C8.625 3.504 9.13 3 9.75 3z" />
            </svg>
            {showInfoPanel ? 'Ocultar Teoria' : 'Como Funciona?'}
          </button>
        </div>
      </header>

      {/* Painel Informativo sobre a Curva */}
      {showInfoPanel && (
        <section className="p-5 rounded-2xl glass-panel border border-accent-primary/20 bg-accent-primary/5 text-gray-300 text-xs leading-relaxed flex flex-col md:flex-row gap-5 items-center justify-between animate-fadeIn">
          <div className="flex-1 space-y-2">
            <h3 className="font-bold text-white text-sm font-display flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-accent-secondary">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.626 9H9z" clipRule="evenodd" />
              </svg>
              O Método Ebbinghaus e a Repetição Espaçada
            </h3>
            <p>
              Hermann Ebbinghaus descobriu que esquecemos mais de <strong>60%</strong> do que aprendemos em apenas 24 horas. Para combater isso, devemos realizar revisões programadas no momento exato antes da curva de esquecimento se acentuar.
            </p>
            <p>
              Ao registrar um novo assunto, o sistema agenda automaticamente sua primeira revisão para amanhã (<strong>24h</strong>). Cada vez que você revisa e avalia seu recall, o FocusFlow recalcula o intervalo de forma inteligente:
            </p>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 list-disc pl-4 text-gray-400">
              <li><strong>Etapa 1:</strong> Revisar após 24 horas.</li>
              <li><strong>Etapa 2:</strong> Revisar após 7 dias.</li>
              <li><strong>Etapa 3:</strong> Revisar após 15 dias.</li>
              <li><strong>Etapa 4:</strong> Revisar após 30 dias (conclusão).</li>
            </ul>
          </div>
          <div className="w-full md:w-80 flex flex-col gap-2 p-3 bg-bg-dark/50 rounded-xl border border-gray-800">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-display">Conceito Visual da Curva</span>
            <div className="w-full h-24 relative overflow-hidden flex items-center justify-center">
              {/* Mini gráfico estático conceitual */}
              <svg viewBox="0 0 200 80" className="w-full h-full">
                {/* Eixos */}
                <line x1="15" y1="10" x2="15" y2="70" stroke="#4b5563" strokeWidth="1" />
                <line x1="15" y1="70" x2="190" y2="70" stroke="#4b5563" strokeWidth="1" />
                {/* Linha vermelha de esquecimento total */}
                <path d="M 15 15 C 30 50, 70 65, 180 68" fill="none" stroke="#ef4444" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
                {/* Linhas verdes de revisão */}
                <path d="M 15 15 C 20 30, 24 35, 25 40 L 25 15 C 35 30, 48 35, 50 40 L 50 15 C 75 25, 95 30, 100 35 L 100 15 C 135 20, 175 22, 185 25" fill="none" stroke="#10b981" strokeWidth="1.5" />
                <text x="100" y="78" fontSize="6" fill="#9ca3af" textAnchor="middle">Tempo</text>
                <text x="5" y="40" fontSize="6" fill="#9ca3af" textAnchor="middle" transform="rotate(-90 5 40)">Retenção</text>
              </svg>
            </div>
            <p className="text-[9px] text-center text-gray-500 font-medium">Os picos mostram a retenção voltando a 100% a cada revisão.</p>
          </div>
        </section>
      )}

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* Coluna da Esquerda: Formulário de Adicionar + Filtros */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          {/* Card de Cadastro */}
          {isFormOpen && (
            <div className="p-5 rounded-3xl bg-bg-card/40 border border-gray-700/50 backdrop-blur-md flex flex-col gap-4 shadow-xl animate-fadeIn">
              <h3 className="font-extrabold text-white text-base font-display flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-accent-primary/20 flex items-center justify-center text-accent-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </span>
                Novo Assunto
              </h3>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-display">Matéria / Categoria</label>
                  <input
                    type="text"
                    placeholder="Ex: Programação, Matemática, História"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full bg-bg-dark/60 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-accent-primary transition-colors font-semibold"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-display">Tópico Estudado</label>
                  <input
                    type="text"
                    placeholder="Ex: Hooks React, Matrizes, Segunda Guerra"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    className="w-full bg-bg-dark/60 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-accent-primary transition-colors font-semibold"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-accent-primary to-accent-secondary text-white font-bold text-xs shadow-lg shadow-accent-primary/20 hover:shadow-accent-primary/30 glow-btn flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Iniciar ciclo de revisões
                </button>
              </form>
            </div>
          )}

          {/* Filtros */}
          <div className="p-5 rounded-3xl bg-bg-card/40 border border-gray-700/50 backdrop-blur-md flex flex-col gap-4 shadow-xl">
            <h3 className="font-extrabold text-white text-base font-display flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-gray-800 flex items-center justify-center text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </span>
              Filtro de Assuntos
            </h3>

            <input
              type="text"
              placeholder="Buscar por matéria ou tópico..."
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="w-full bg-bg-dark/60 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-accent-primary transition-colors font-semibold"
            />

            {filterSubject && (
              <button
                type="button"
                onClick={() => setFilterSubject('')}
                className="text-[10px] text-gray-500 hover:text-white transition-colors font-bold text-left cursor-pointer"
              >
                ✕ Limpar Filtro
              </button>
            )}
          </div>
        </div>

        {/* Coluna da Direita (2/3 de largura): Abas e Listagem */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Navegação de Abas Internas */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-bg-card/30 border border-gray-800 backdrop-blur-md">
            {([
              { id: 'today', label: 'Hoje para Revisar', count: todayReviews.length },
              { id: 'upcoming', label: 'Próximas Revisões', count: upcomingReviews.length },
              { id: 'all', label: 'Todos os Assuntos', count: reviews.length },
            ] as const).map((tab) => {
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveSubTab(tab.id);
                    setReviewingTopicId(null); // Fecha formulários de revisão ativos ao trocar
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer ${isActive
                    ? 'bg-accent-primary/15 text-white border-l-2 border-accent-primary'
                    : 'text-gray-500 hover:text-white hover:bg-bg-card/30'
                    }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${tab.id === 'today'
                      ? 'bg-red-500/25 text-red-400 border border-red-500/20'
                      : isActive
                        ? 'bg-accent-primary/20 text-white'
                        : 'bg-gray-800 text-gray-400'
                      }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Listagem Dinâmica baseada na aba */}
          <div className="flex flex-col gap-4">

            {/* Caso 1: Aba "Hoje" */}
            {activeSubTab === 'today' && (
              filteredToday.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 bg-bg-card/15 border border-gray-800/40 rounded-3xl text-center backdrop-blur-sm min-h-[300px]">
                  <div className="w-12 h-12 rounded-2xl bg-green-500/10 text-green-400 flex items-center justify-center mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                    </svg>
                  </div>
                  <h4 className="text-base font-bold text-white mb-1">Tudo em dia!</h4>
                  <p className="text-xs text-gray-500 max-w-xs">Nenhum assunto pendente de revisão para hoje. Bom trabalho!</p>
                </div>
              ) : (
                filteredToday.map((item) => (
                  <div key={item.id} className="p-5 rounded-3xl bg-bg-card/30 border border-gray-800/80 backdrop-blur-md flex flex-col gap-4 transition-all duration-300 hover:border-gray-700/60 shadow-lg">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                      <div>
                        <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-accent-secondary/15 text-accent-secondary rounded border border-accent-secondary/10">
                          {item.subject}
                        </span>
                        <h4 className="text-sm sm:text-base font-extrabold text-white mt-1.5">{item.topic}</h4>
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-500 font-semibold">
                          <span>Criado em: {formatDateReadable(item.createdAt)}</span>
                          <span>•</span>
                          <span className="text-red-400">Revisão atrasada desde: {formatDateReadable(item.nextReviewAt)}</span>
                        </div>
                      </div>

                      {reviewingTopicId !== item.id && (
                        <button
                          type="button"
                          onClick={() => setReviewingTopicId(item.id)}
                          className="py-1.5 px-4 rounded-xl bg-accent-secondary text-bg-dark font-black text-xs hover:bg-cyan-400 transition-all duration-300 flex items-center gap-1 shadow-md shadow-accent-secondary/15 cursor-pointer"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                          </svg>
                          Revisar
                        </button>
                      )}
                    </div>

                    {/* Stepper Visual de Marcos de Revisão */}
                    <RevisionStepper topic={item} />

                    {/* Gráfico da Curva */}
                    <ForgettingCurveChart repetitionCount={item.repetitionCount} />

                    {/* Popover / Formulário de Confirmação de Revisão */}
                    {reviewingTopicId === item.id && (
                      <div className="p-4 rounded-2xl bg-bg-dark/80 border border-accent-secondary/25 flex flex-col gap-3 mt-1.5 animate-slideDown">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-800">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-accent-secondary font-display">Como foi sua retenção desse assunto?</span>
                          <button
                            type="button"
                            onClick={() => setReviewingTopicId(null)}
                            className="text-gray-500 hover:text-white text-xs cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {([
                            { rating: 'forgot', label: 'Esqueci', color: 'hover:bg-red-500/10 hover:border-red-500/30 border-gray-800', text: 'text-red-400', desc: 'Recomeçar' },
                            { rating: 'hard', label: 'Difícil', color: 'hover:bg-amber-500/10 hover:border-amber-500/30 border-gray-800', text: 'text-amber-400', desc: 'Recall falho' },
                            { rating: 'good', label: 'Bom', color: 'hover:bg-cyan-500/10 hover:border-cyan-500/30 border-gray-800', text: 'text-cyan-400', desc: 'Recall certo' },
                            { rating: 'easy', label: 'Fácil', color: 'hover:bg-green-500/10 hover:border-green-500/30 border-gray-800', text: 'text-green-400', desc: 'Recall total' },
                          ] as const).map((option) => (
                            <button
                              key={option.rating}
                              type="button"
                              onClick={() => {
                                completeReview(item.id, option.rating);
                                setReviewingTopicId(null);
                              }}
                              className={`p-2.5 rounded-xl border bg-bg-dark/30 text-left transition-all duration-300 flex flex-col items-start gap-0.5 cursor-pointer ${option.color}`}
                            >
                              <span className={`text-xs font-black ${option.text}`}>{option.label}</span>
                              <span className="text-[9px] text-gray-500 font-semibold">{option.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )
            )}

            {/* Caso 2: Aba "Próximas" */}
            {activeSubTab === 'upcoming' && (
              filteredUpcoming.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 bg-bg-card/15 border border-gray-800/40 rounded-3xl text-center backdrop-blur-sm min-h-[300px]">
                  <h4 className="text-base font-bold text-white mb-1">Nenhuma revisão futura</h4>
                  <p className="text-xs text-gray-500 max-w-xs">Insira um novo assunto no formulário lateral para dar início às programações.</p>
                </div>
              ) : (
                filteredUpcoming.map((item) => (
                  <div key={item.id} className="p-5 rounded-3xl bg-bg-card/30 border border-gray-800/80 backdrop-blur-md flex flex-col gap-4 shadow-lg opacity-85">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                      <div>
                        <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-gray-800 text-gray-400 rounded border border-gray-700/30">
                          {item.subject}
                        </span>
                        <h4 className="text-sm sm:text-base font-extrabold text-white mt-1.5">{item.topic}</h4>
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-500 font-semibold">
                          <span>Criado em: {formatDateReadable(item.createdAt)}</span>
                          <span>•</span>
                          {item.lastReviewedAt && (
                            <>
                              <span>Última revisão: {formatDateReadable(item.lastReviewedAt)}</span>
                              <span>•</span>
                            </>
                          )}
                          <span className="text-accent-secondary font-bold">Próxima em: {formatDateReadable(item.nextReviewAt)}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-gray-500 font-bold">Próxima revisão</span>
                        <span className="text-xs text-accent-secondary font-black font-display mt-0.5">
                          {formatDateReadable(item.nextReviewAt)}
                        </span>
                      </div>
                    </div>

                    <RevisionStepper topic={item} />
                  </div>
                ))
              )
            )}

            {/* Caso 3: Aba "Todos os Assuntos" */}
            {activeSubTab === 'all' && (
              filteredAll.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 bg-bg-card/15 border border-gray-800/40 rounded-3xl text-center backdrop-blur-sm min-h-[300px]">
                  <h4 className="text-base font-bold text-white mb-1">Nenhum assunto cadastrado</h4>
                  <p className="text-xs text-gray-500 max-w-xs">Use a aba lateral esquerda para adicionar seu primeiro tópico de revisão.</p>
                </div>
              ) : (
                filteredAll.map((item) => {
                  const isDoneToday = item.nextReviewAt <= getTodayDateString();
                  return (
                    <div key={item.id} className="p-4 rounded-2xl bg-bg-card/25 border border-gray-800/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all duration-300 hover:border-gray-700/40">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider bg-gray-800 text-gray-400 rounded">
                            {item.subject}
                          </span>
                          {item.completed && (
                            <span className="px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider bg-green-500/15 text-green-400 border border-green-500/20 rounded">
                              Ciclo Concluído (30d+)
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-extrabold text-white mt-1">{item.topic}</h4>
                        <div className="flex items-center gap-2.5 mt-1 text-[9px] text-gray-500 font-semibold">
                          <span>Criado: {formatDateReadable(item.createdAt)}</span>
                          <span>•</span>
                          <span>Revisões Feitas: {item.repetitionCount}</span>
                          <span>•</span>
                          <span>Fator EF: {item.easinessFactor.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="text-right sm:block hidden">
                          <span className="text-[9px] text-gray-500 font-bold block">Status do Agendamento</span>
                          <span className={`text-[10px] font-black font-display ${isDoneToday ? 'text-red-400' : 'text-gray-400'
                            }`}>
                            {isDoneToday ? 'Pendente Hoje' : `Rever em ${formatDateReadable(item.nextReviewAt)}`}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => resetReviewCycle(item.id)}
                            className="p-1.5 rounded-lg border border-gray-800 hover:border-gray-700 text-gray-500 hover:text-white transition-colors cursor-pointer"
                            title="Reiniciar Ciclo de Revisões"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                            </svg>
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteReviewTopic(item.id)}
                            className="p-1.5 rounded-lg border border-red-950/40 text-red-500/60 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all duration-300 cursor-pointer"
                            title="Excluir Assunto"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )
            )}

          </div>
        </div>

      </div>

    </div>
  );
}
