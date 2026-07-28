-- Script de Criação de Tabelas do Supabase (PostgreSQL)
-- FocusFlow - Gerenciador de Estudos Inteligente

-- Habilita extensão de UUID se não estiver habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela usuarios
CREATE TABLE IF NOT EXISTS public.usuarios (
    id_usuario UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nm_usuario TEXT NOT NULL,
    email TEXT NOT NULL,
    dt_criacao TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela materias
CREATE TABLE IF NOT EXISTS public.materias (
    id_materia UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_usuario UUID NOT NULL REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE,
    nm_materia TEXT NOT NULL
);

-- 3. Tabela assuntos
CREATE TABLE IF NOT EXISTS public.assuntos (
    id_assunto UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_materia UUID NOT NULL REFERENCES public.materias(id_materia) ON DELETE CASCADE,
    nm_assunto TEXT NOT NULL
);

-- 4. Tabela estatisticas
CREATE TABLE IF NOT EXISTS public.estatisticas (
    id_estatistica UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_usuario UUID NOT NULL REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE,
    id_assunto UUID NOT NULL REFERENCES public.assuntos(id_assunto) ON DELETE CASCADE,
    qtd_certas INT NOT NULL DEFAULT 0,
    qtd_erradas INT NOT NULL DEFAULT 0,
    qtd_minutos INT NOT NULL DEFAULT 0,
    qtd_total INT GENERATED ALWAYS AS (qtd_certas + qtd_erradas) STORED,
    dt_registro TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabela revisoes
CREATE TABLE IF NOT EXISTS public.revisoes (
    id_revisao UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_usuario UUID NOT NULL REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE,
    id_assunto UUID NOT NULL REFERENCES public.assuntos(id_assunto) ON DELETE CASCADE,
    dt_revisao DATE NOT NULL,
    nivel_ciclo INT NOT NULL CHECK (nivel_ciclo BETWEEN 1 AND 4),
    fl_concluida BOOLEAN DEFAULT false NOT NULL,
    dt_conclusao DATE
);

-- Habilita Row Level Security (RLS) em todas as tabelas
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assuntos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estatisticas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revisoes ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS DE ROW LEVEL SECURITY (RLS)

-- 1. Políticas para usuarios
CREATE POLICY "Permitir leitura de si mesmo" ON public.usuarios
    FOR SELECT USING (auth.uid() = id_usuario);
    
CREATE POLICY "Permitir inserção de si mesmo" ON public.usuarios
    FOR INSERT WITH CHECK (auth.uid() = id_usuario);

CREATE POLICY "Permitir atualização de si mesmo" ON public.usuarios
    FOR UPDATE USING (auth.uid() = id_usuario);

-- 2. Políticas para materias
CREATE POLICY "Permitir tudo das minhas materias" ON public.materias
    FOR ALL USING (auth.uid() = id_usuario);

-- 3. Políticas para assuntos (ligado à propriedade da materia)
CREATE POLICY "Permitir leitura dos assuntos das minhas materias" ON public.assuntos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.materias
            WHERE materias.id_materia = assuntos.id_materia
            AND materias.id_usuario = auth.uid()
        )
    );

CREATE POLICY "Permitir inserção de assuntos nas minhas materias" ON public.assuntos
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.materias
            WHERE materias.id_materia = assuntos.id_materia
            AND materias.id_usuario = auth.uid()
        )
    );

CREATE POLICY "Permitir exclusão de assuntos nas minhas materias" ON public.assuntos
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.materias
            WHERE materias.id_materia = assuntos.id_materia
            AND materias.id_usuario = auth.uid()
        )
    );

-- 4. Políticas para estatisticas
CREATE POLICY "Permitir tudo das minhas estatisticas" ON public.estatisticas
    FOR ALL USING (auth.uid() = id_usuario);

-- 5. Políticas para revisoes
CREATE POLICY "Permitir tudo das minhas revisoes" ON public.revisoes
    FOR ALL USING (auth.uid() = id_usuario);

-- 6. Tabela cronograma (Cronograma Semanal de Estudos)
CREATE TABLE IF NOT EXISTS public.cronograma (
    id_cronograma UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_usuario UUID NOT NULL REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE,
    dia_semana INT NOT NULL CHECK (dia_semana BETWEEN 0 AND 6), -- 0=Domingo, 1=Segunda, 2=Terça, 3=Quarta, 4=Quinta, 5=Sexta, 6=Sábado
    id_materia UUID REFERENCES public.materias(id_materia) ON DELETE SET NULL,
    titulo_estudo TEXT NOT NULL,
    horario_inicio TIME,
    horario_fim TIME,
    observacao TEXT,
    fl_concluido BOOLEAN DEFAULT false NOT NULL,
    ordem INT DEFAULT 0 NOT NULL,
    dt_criacao TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.cronograma ENABLE ROW LEVEL SECURITY;

-- Políticas para cronograma
CREATE POLICY "Permitir tudo do meu cronograma" ON public.cronograma
    FOR ALL USING (auth.uid() = id_usuario);

