# Diretrizes de Desenvolvimento (Guidelines)

Este documento descreve as regras e padrões arquiteturais a serem seguidos no desenvolvimento deste projeto.

---

## 🛠️ Regras de Versionamento (Git)

1. **Responsabilidade de Commit**: 
   - O agente desenvolvedor faz as modificações nos arquivos locais.
   - O **usuário** (desenvolvedor sênior / owner) é responsável por realizar os commits no Git. O agente não deve commitar alterações automaticamente.

---

## 🏗️ Padrões de Arquitetura e Componentização

2. **Componentização Estrita**:
   - Todas as peças de interface reutilizáveis ou isoladas devem ser criadas na pasta `src/components/`.
   - As telas (`src/screens/`) devem funcionar como organizadores limpos e focados 90% na renderização da UI, importando e instanciando os componentes da pasta `components/`.

3. **Lógica de Negócio e Hooks**:
   - Se uma tela (`src/screens/`) contiver lógica complexa ou de negócio (estados, chamadas de API, manipuladores) que ultrapasse **50 linhas de código**, essa lógica deve ser extraída para um Custom Hook dedicado na pasta `src/hooks/`.
   - Isso mantém as telas simples, declarativas e fáceis de ler.

---

## 🧹 Código Limpo e Documentação

4. **Legibilidade e Comentários**:
   - Manter o código o mais limpo, autoexplicativo e sem duplicações possível (princípios Clean Code / DRY).
   - Adicionar comentários claros e explicativos em trechos complexos, facilitando futuras refatorações e manutenções sem dificuldades.
   - Tipar rigorosamente todos os contratos e dados no `src/types/index.ts`.
