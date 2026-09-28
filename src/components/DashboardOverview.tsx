import type { useStudyMetrics } from '../hooks';

type AnalyticsType = ReturnType<typeof useStudyMetrics>['analytics'];
type DailyPointsType = ReturnType<typeof useStudyMetrics>['dailyPoints'];

interface DashboardOverviewProps {
  analytics: AnalyticsType;
  dailyPoints: DailyPointsType;
  periodFilter: string;
  onPeriodChange: (period: string) => void;
  customStartDate: string;
  onCustomStartDateChange: (date: string) => void;
  customEndDate: string;
  onCustomEndDateChange: (date: string) => void;
  onClearHistory: () => void;
}

export function DashboardOverview({
  analytics,
  dailyPoints,
  periodFilter,
  onPeriodChange,
  customStartDate,
  onCustomStartDateChange,
  customEndDate,
  onCustomEndDateChange,
  onClearHistory,
}: DashboardOverviewProps) {
  const {
    questionsCorrect,
    questionsWrong,
    questionsTotal,
    accuracyRate,
  } = analytics;

  // --- Geometria do Gráfico de Rosca (Donut SVG) ---
  const donutRadius = 60;
  const donutStrokeWidth = 14;
  const donutCircumference = 2 * Math.PI * donutRadius; // Aprox 377

  const totalQuestionsRegistered = Math.max(questionsTotal, questionsCorrect + questionsWrong);
  const correctPercent = totalQuestionsRegistered > 0 ? (questionsCorrect / totalQuestionsRegistered) * 100 : 0;
  const wrongPercent = totalQuestionsRegistered > 0 ? (questionsWrong / totalQuestionsRegistered) * 100 : 0;
  const blankPercent = totalQuestionsRegistered > 0 ? Math.max(0, 100 - correctPercent - wrongPercent) : 0;

  const correctOffset = donutCircumference - (correctPercent / 100) * donutCircumference;
  const wrongOffset = donutCircumference - (wrongPercent / 100) * donutCircumference;

  // A fatia de erros inicia rotacionada logo após os acertos terminarem
  const wrongRotation = (correctPercent / 100) * 360 - 90;

  // --- Geometria do Gráfico de Barras Verticais SVG ---
  // Encontra o maior número de questões feitas em um dia para escalar a altura Y do gráfico
  const maxDailyQuestions = Math.max(...dailyPoints.map((p) => p.total), 10);

  // Linhas horizontais de grade (valores Y correspondentes no gráfico)
  const gridLines = [
    { value: Math.round(maxDailyQuestions * 1.0), label: Math.round(maxDailyQuestions * 1.0) },
    { value: Math.round(maxDailyQuestions * 0.75), label: Math.round(maxDailyQuestions * 0.75) },
    { value: Math.round(maxDailyQuestions * 0.5), label: Math.round(maxDailyQuestions * 0.5) },
    { value: Math.round(maxDailyQuestions * 0.25), label: Math.round(maxDailyQuestions * 0.25) },
    { value: 0, label: 0 },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6">

      {/* SEÇÃO 1: Desempenho Geral e Percentual de Rendimento */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* Bloco: Desempenho Geral (Gráfico de Barras Verticais + KPIs) */}
        <div className="flex-[3] p-6 rounded-3xl bg-bg-card/30 border border-gray-700/50 backdrop-blur-md flex flex-col gap-6">

          {/* Cabeçalho do Bloco */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pb-4 border-b border-gray-800/40">
            <h3 className="text-base font-bold text-white font-display">Desempenho Geral</h3>

            <div className="flex flex-wrap items-center gap-2">
              {/* Filtro de Período Customizado (Inputs de De / Até) */}
              {periodFilter === 'custom' && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-gray-500 font-bold uppercase">De:</span>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => onCustomStartDateChange(e.target.value)}
                      className="bg-bg-dark/80 text-[10px] font-mono text-white px-2.5 py-1 rounded-xl border border-gray-700 focus:outline-none focus:border-accent-primary"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-gray-500 font-bold uppercase">Até:</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => onCustomEndDateChange(e.target.value)}
                      className="bg-bg-dark/80 text-[10px] font-mono text-white px-2.5 py-1 rounded-xl border border-gray-700 focus:outline-none focus:border-accent-primary"
                    />
                  </div>
                </div>
              )}

              {/* Seletor de Período Dinâmico */}
              <select
                value={periodFilter}
                onChange={(e) => onPeriodChange(e.target.value)}
                className="bg-bg-dark/80 text-[11px] font-bold text-gray-300 px-3 py-1.5 rounded-xl border border-gray-700 focus:outline-none focus:border-accent-primary cursor-pointer"
              >
                <option value="7">Últimos 7 dias</option>
                <option value="15">Últimos 15 dias</option>
                <option value="30">Últimos 30 dias</option>
                <option value="all">Todo o período</option>
                <option value="custom">Período Personalizado</option>
              </select>
            </div>
          </div>

          {/* Grid de KPIs Numéricas (Topo do Bloco) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center sm:text-left">
            <div>
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Resolvidas</div>
              <div className="text-xl font-extrabold text-blue-500 font-mono mt-0.5">{questionsTotal}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Certas</div>
              <div className="text-xl font-extrabold text-emerald-500 font-mono mt-0.5">{questionsCorrect}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Erradas</div>
              <div className="text-xl font-extrabold text-rose-500 font-mono mt-0.5">{questionsWrong}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">% de Acerto</div>
              <div className="text-xl font-extrabold text-purple-500 font-mono mt-0.5">
                {accuracyRate.toFixed(2)}%
              </div>
            </div>
          </div>

          {/* Gráfico de Barras Verticais SVG (Dia a Dia) */}
          <div className="w-full h-[300px] bg-bg-dark/25 rounded-2xl border border-gray-800/40 p-4 flex items-center justify-center">
            {questionsTotal === 0 ? (
              <span className="text-xs text-gray-500 italic">Nenhum exercício registrado neste período.</span>
            ) : (
              <svg className="w-full h-full" viewBox="0 0 540 180" preserveAspectRatio="none">
                {/* Linhas de Grade Y e Rótulos */}
                {gridLines.map((line, idx) => {
                  const yVal = 10 + idx * 35; // Divide 140px em 4 intervalos
                  return (
                    <g key={line.value}>
                      <text x="25" y={yVal + 3} className="fill-gray-500 font-mono text-[9px]" textAnchor="end">
                        {line.label}
                      </text>
                      <line x1="32" y1={yVal} x2="520" y2={yVal} className="stroke-gray-800/30" strokeWidth="1" strokeDasharray="3,3" />
                    </g>
                  );
                })}

                {/* Eixo X base */}
                <line x1="32" y1="150" x2="520" y2="150" className="stroke-gray-700/60" strokeWidth="1" />

                {/* Desenho das Barras (Acertos vs Total) por dia */}
                {dailyPoints.map((point, index) => {
                  const dayWidth = 478 / dailyPoints.length; // largura disponível do gráfico dividida pelos dias
                  const xGroupCenter = 32 + index * dayWidth + dayWidth / 2;

                  // Altura proporcional
                  const barHeightTotal = (point.total / maxDailyQuestions) * 140;
                  const yTotal = 150 - barHeightTotal;

                  const barHeightCorrect = (point.correct / maxDailyQuestions) * 140;
                  const yCorrect = 150 - barHeightCorrect;

                  return (
                    <g key={point.dateStr}>
                      {/* Barra Azul (Total Resolvidas) */}
                      {point.total > 0 && (
                        <rect
                          x={xGroupCenter + 2}
                          y={yTotal}
                          width={Math.max(6, dayWidth * 0.15)}
                          height={barHeightTotal}
                          className="fill-blue-600 transition-all duration-500"
                          rx="2"
                        />
                      )}

                      {/* Barra Verde (Questões Certas) */}
                      {point.correct > 0 && (
                        <rect
                          x={xGroupCenter - Math.max(6, dayWidth * 0.15) - 2}
                          y={yCorrect}
                          width={Math.max(6, dayWidth * 0.15)}
                          height={barHeightCorrect}
                          className="fill-emerald-500 transition-all duration-500"
                          rx="2"
                        />
                      )}

                      {/* Rótulo de Data (Eixo X) */}
                      <text x={xGroupCenter} y="165" className="fill-gray-500 font-mono text-[9px]" textAnchor="middle">
                        {point.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>

        </div>

        {/* Bloco: Percentual de Rendimento (Donut SVG) */}
        <div className="flex-[2] p-6 rounded-3xl bg-bg-card/30 border border-gray-700/50 backdrop-blur-md flex flex-col items-center justify-between text-center min-w-[260px]">

          <div className="w-full pb-4 border-b border-gray-800/40 text-left">
            <h3 className="text-base font-bold text-white font-display">Percentual de rendimento</h3>
          </div>

          {questionsTotal === 0 ? (
            <div className="flex-1 flex items-center justify-center text-sm text-gray-500 italic py-12">
              Sem dados.
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6 py-4 w-full">
              {/* Rosca SVG */}
              <div className="relative w-52 h-52 flex items-center justify-center">
                <svg className="absolute w-full h-full" viewBox="0 0 160 160">
                  {/* Track base */}
                  <circle cx="80" cy="80" r={donutRadius} className="stroke-gray-800/40 fill-none" strokeWidth={donutStrokeWidth} />
                  {/* Acertos (Verde) */}
                  <circle
                    cx="80"
                    cy="80"
                    r={donutRadius}
                    className="fill-none -rotate-90 origin-center transition-all duration-500"
                    stroke="#10b981"
                    strokeWidth={donutStrokeWidth}
                    strokeDasharray={donutCircumference}
                    strokeDashoffset={correctOffset}
                  />
                  {/* Erros (Rosa/Vermelho) */}
                  {questionsWrong > 0 && (
                    <circle
                      cx="80"
                      cy="80"
                      r={donutRadius}
                      className="fill-none transition-all duration-500 origin-center"
                      stroke="#f43f5e"
                      strokeWidth={donutStrokeWidth}
                      strokeDasharray={donutCircumference}
                      strokeDashoffset={wrongOffset}
                      style={{ transform: `rotate(${wrongRotation}deg)` }}
                    />
                  )}
                </svg>

                {/* Conteúdo Central */}
                <div className="z-10 flex flex-col items-center select-none">
                  <span className="text-3xl font-black text-white font-mono">{accuracyRate.toFixed(1)}%</span>
                  <span className="text-[11px] uppercase tracking-wider text-gray-500 font-bold">Rendimento</span>
                </div>
              </div>

              {/* Legenda do Donut */}
              <div className="flex justify-center gap-4 w-full text-[11px] font-bold">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
                  <span className="text-gray-300">Acertos ({correctPercent.toFixed(0)}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-rose-500" />
                  <span className="text-gray-300">Erros ({wrongPercent.toFixed(0)}%)</span>
                </div>
                {blankPercent > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-gray-500" />
                    <span className="text-gray-400">Em branco ({blankPercent.toFixed(0)}%)</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Botão de limpeza integrado */}
          <button
            type="button"
            onClick={onClearHistory}
            className="w-full mt-4 py-2 border-t border-gray-800/60 hover:bg-bg-card/10 text-orange-400 hover:text-orange-300 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
            </svg>
            Limpar histórico de desempenho
          </button>

        </div>

      </div>

    </div>
  );
}
