import { useState, useMemo } from 'react';
import type { FormEvent } from 'react';
import type { StudySessionMetric } from '../types';

interface MetricFormProps {
  onSave: (metric: Omit<StudySessionMetric, 'id'>) => void;
  existingSubjects: string[];
  existingMetrics: StudySessionMetric[];
}

export function MetricForm({ onSave, existingSubjects, existingMetrics }: MetricFormProps) {
  // Estados dos inputs
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [duration, setDuration] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [correct, setCorrect] = useState('');
  const [wrong, setWrong] = useState('');
  const [total, setTotal] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Mapeia de forma inteligente e sugere assuntos (tópicos) com base na matéria digitada
  const existingTopics = useMemo(() => {
    if (!subject.trim()) return [];
    const typedSubject = subject.toLowerCase().trim();
    
    // Filtra registros que tenham a matéria igual à digitada
    const matchedMetrics = existingMetrics.filter(
      (m) => m.subject.toLowerCase().trim() === typedSubject
    );
    
    // Extrai assuntos únicos
    const set = new Set(matchedMetrics.map((m) => m.topic));
    return Array.from(set).sort();
  }, [existingMetrics, subject]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validações de campos obrigatórios
    if (!subject.trim() || !topic.trim() || !duration || !date) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const durationNum = Number(duration);
    const correctNum = Number(correct) || 0;
    const wrongNum = Number(wrong) || 0;
    const totalNum = Number(total) || 0;

    if (durationNum <= 0) {
      setErrorMsg('O tempo de estudo deve ser maior que 0 minutos.');
      return;
    }

    if (correctNum < 0 || wrongNum < 0 || totalNum < 0) {
      setErrorMsg('Os números de questões não podem ser negativos.');
      return;
    }

    // Validação matemática das questões
    if (totalNum < correctNum + wrongNum) {
      setErrorMsg('O número total de questões deve ser maior ou igual à soma de acertos e erros.');
      return;
    }

    // Função de formatação: Normaliza capitalizando a primeira letra de cada palavra
    // Ex: "matemática básica" -> "Matemática Básica"
    // Isso evita duplicidades por conta de caixa alta/baixa ou grafias variantes
    const formatName = (val: string) => {
      return val
        .trim()
        .replace(/\s+/g, ' ')
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    };

    // Passa os dados normalizados para a função de salvar do Hook
    onSave({
      subject: formatName(subject),
      topic: formatName(topic),
      durationMinutes: durationNum,
      date,
      questionsCorrect: correctNum,
      questionsWrong: wrongNum,
      questionsTotal: totalNum,
    });

    // Limpa os campos após salvar
    setSubject('');
    setTopic('');
    setDuration('');
    setCorrect('');
    setWrong('');
    setTotal('');
    setErrorMsg(null);
  };

  return (
    <div className="w-full max-w-7xl mx-auto rounded-3xl bg-bg-card border border-gray-700/50 backdrop-blur-md shadow-2xl p-6 flex flex-col gap-4">
      
      {/* Cabeçalho Estático do Formulário (Sempre Visível) */}
      <div className="pb-4 border-b border-gray-800/40">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-accent-secondary">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Inserir Nova Métrica de Estudos
        </h3>
        <p className="text-xs text-gray-400 mt-0.5">Cadastre matérias estudadas e aproveitamento de exercícios para os cálculos do dashboard</p>
      </div>

      {/* Formulário diretamente exposto */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        
        {errorMsg && (
          <div className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/10 text-xs font-semibold text-red-400 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            {errorMsg}
          </div>
        )}

        {/* Linha 1: Matéria e Assunto */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Matéria *</label>
            <input
              type="text"
              placeholder="ex: Matemática, Português, História"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              list="subjects-datalist"
              className="bg-bg-dark/80 text-sm text-white px-4 py-2.5 rounded-xl border border-gray-700 focus:outline-none focus:border-accent-primary"
              required
            />
            {/* Datalist nativo para sugerir matérias salvas */}
            <datalist id="subjects-datalist">
              {existingSubjects.map((sub) => (
                <option key={sub} value={sub} />
              ))}
            </datalist>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Assunto *</label>
            <input
              type="text"
              placeholder="ex: Frações, Crase, Revolução Francesa"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              list="topics-datalist"
              className="bg-bg-dark/80 text-sm text-white px-4 py-2.5 rounded-xl border border-gray-700 focus:outline-none focus:border-accent-primary"
              required
            />
            {/* Datalist nativo para sugerir assuntos da matéria digitada */}
            <datalist id="topics-datalist">
              {existingTopics.map((top) => (
                <option key={top} value={top} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Linha 2: Tempo de Estudo e Data */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Tempo de Estudo (minutos) *</label>
            <input
              type="number"
              min="1"
              placeholder="Tempo em minutos (ex: 45)"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="bg-bg-dark/80 text-sm text-white px-4 py-2.5 rounded-xl border border-gray-700 focus:outline-none focus:border-accent-primary font-mono"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Data do Estudo *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-bg-dark/80 text-sm text-white px-4 py-2.5 rounded-xl border border-gray-700 focus:outline-none focus:border-accent-primary font-mono"
              required
            />
          </div>
        </div>

        {/* Linha 3: Questões Resolvidas */}
        <div>
          <h4 className="text-xs font-extrabold text-gray-500 uppercase tracking-widest mb-3 border-b border-gray-800/40 pb-2">
            Resolução de Exercícios (Opcional)
          </h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Acertos</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={correct}
                onChange={(e) => setCorrect(e.target.value)}
                className="bg-bg-dark/80 text-sm text-white px-3 py-2.5 rounded-xl border border-gray-700 focus:outline-none focus:border-accent-primary font-mono text-center"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Erros</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={wrong}
                onChange={(e) => setWrong(e.target.value)}
                className="bg-bg-dark/80 text-sm text-white px-3 py-2.5 rounded-xl border border-gray-700 focus:outline-none focus:border-accent-primary font-mono text-center"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Resolvidas</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                className="bg-bg-dark/80 text-sm text-white px-3 py-2.5 rounded-xl border border-gray-700 focus:outline-none focus:border-accent-primary font-mono text-center"
              />
            </div>
          </div>
        </div>

        {/* Botão de Enviar */}
        <button
          type="submit"
          className="w-full mt-2 py-3 px-6 rounded-xl font-bold bg-accent-primary text-white hover:bg-opacity-90 active:scale-98 transition-all shadow-lg shadow-accent-primary/20 cursor-pointer"
        >
          Salvar Registro de Métrica
        </button>
      </form>
    </div>
  );
}
