# 📋 Passive Voice Quiz — Documento de Handover

## 1. Objetivo do Projeto

Aplicação web de **quiz de Passive Voice** (voz passiva em inglês) para o **Instituto J&F**. O usuário configura uma sessão de quiz, responde questões de múltipla escolha sobre passive voice, e ao final recebe um relatório com seu desempenho e justificativas para cada questão.

### Público-alvo

- Profissionais de negócios e alunos do Instituto J&F que desejam praticar inglês.

### Funcionalidades principais

1. **Tela de Configuração** — Configurar quantidade de questões, timer opcional e modo de feedback imediato.
2. **Tela de Quiz** — Responder questões com 4 alternativas (A/B/C/D), com timer opcional e feedback imediato opcional.
3. **Tela de Resultados** — Score circular animado, revisão de todas as questões em accordion (acerto/erro, justificativa).
4. **Repetição inteligente** — Prioriza questões que o usuário ainda não viu (histórico salvo em localStorage).

---

## 2. Stack Técnica

| Tecnologia           | Versão                        | Uso                                       |
| -------------------- | ----------------------------- | ----------------------------------------- |
| **React**            | 19.x                          | UI framework                              |
| **TypeScript**       | 5.9                           | Tipagem estática                          |
| **Vite**             | 8.x                           | Bundler e dev server                      |
| **Tailwind CSS**     | 4.x (via `@tailwindcss/vite`) | Utilitários CSS                           |
| **Framer Motion**    | 12.x                          | Animações e transições                    |
| **PapaParse**        | 5.x                           | Parsing do CSV de questões                |
| **Lucide React**     | 1.x                           | Ícones (usado em ConfigScreen/QuizScreen) |
| **Material Symbols** | CDN                           | Ícones (usado em ResultsScreen)           |
| **clsx**             | 2.x                           | Merge condicional de classes CSS          |

### Fontes (Google Fonts, via CDN no `index.html`)

- **Manrope** (headline/títulos) — weights: 400, 600, 700, 800
- **Inter** (body/labels) — weights: 400, 500, 600, 700
- **Material Symbols Outlined** (ícones)

---

## 3. Fonte de Dados — CSV do Google Sheets

As questões do quiz são carregadas em tempo real de um **Google Sheets publicado como CSV**.

### URL do CSV

```
https://docs.google.com/spreadsheets/d/e/2PACX-1vTEO4IMjkXaR1p93YZLfHZX3tMLDKPU4NAOtbb5S5iEBL877jNaQANtNeB2FmxwBlhoCYaJFK_yGA9g/pub?gid=0&single=true&output=csv
```

> **IMPORTANTE**: Esta URL está hardcoded em `src/hooks/useQuiz.ts` na constante `CSV_URL` (linha 5).

### Colunas esperadas no CSV

| Coluna                | Descrição                 | Exemplo                                                          |
| --------------------- | ------------------------- | ---------------------------------------------------------------- |
| `Nível`               | Nível de dificuldade      | `BÁSICO`, `MODERADO`, `AVANÇADO`, `DIFÍCIL`                      |
| `Pergunta`            | Texto da questão          | `The walls of the old Victorian house desperately need _______.` |
| `Alternativa A`       | Opção A                   | `to paint`                                                       |
| `Alternativa B`       | Opção B                   | `painting`                                                       |
| `Alternativa C`       | Opção C                   | `to be painting`                                                 |
| `Alternativa D`       | Opção D                   | `painted`                                                        |
| `Alternativa Correta` | Letra da resposta correta | `D`                                                              |
| `Justificativa`       | Explicação da resposta    | `The action happened recently...`                                |

### Parsing (em `useQuiz.ts`)

- A lib **PapaParse** faz o parse do CSV com `header: true`.
- Números no início da pergunta (ex: `1. The walls...`) são removidos automaticamente via regex.
- Se a coluna `Alternativa Correta` não contiver A/B/C/D, cai para fallback `A`.
- Questões com texto vazio são filtradas.

---

## 4. Estrutura de Diretórios

```
passive-voice/
├── index.html                  # Entry point HTML (carrega fontes + Material Symbols)
├── package.json                # Dependências do projeto
├── vite.config.ts              # Config do Vite (react + tailwindcss plugins)
├── tsconfig.json               # Config raiz do TypeScript
├── tsconfig.app.json           # Config TS para a aplicação
├── tsconfig.node.json          # Config TS para Node (vite config)
├── eslint.config.js            # Configuração do ESLint
├── .gitignore
│
├── branding/                   # Referências de design e identidade visual
│   ├── style.json              # Paleta de cores e tipografia extraída do site do Instituto
│   ├── images.md               # URLs de imagens/assets do Instituto J&F
│   ├── index.html              # Protótipo HTML/Tailwind completo (referência visual)
│   └── everything.json         # Dump completo de branding extraído
│
├── public/                     # Assets estáticos
│   ├── favicon.svg
│   └── icons.svg
│
├── src/
│   ├── main.tsx                # Entry point React (StrictMode + ReactDOM)
│   ├── App.tsx                 # Componente raiz — gerencia estados da aplicação
│   ├── index.css               # Design system: CSS variables, glassmorphism, resets
│   │
│   ├── types/
│   │   └── index.ts            # Tipos: Question, QuizSettings, AnswerRecord, AppState, OptionKey
│   │
│   ├── hooks/
│   │   └── useQuiz.ts          # Hook principal: fetch CSV, estado do quiz, lógica de seleção
│   │
│   ├── components/
│   │   ├── ConfigScreen.tsx    # Tela de configuração (slider, toggles, botão iniciar)
│   │   ├── QuizScreen.tsx      # Tela do quiz (questão, opções, timer, feedback)
│   │   └── ResultsScreen.tsx   # Tela de resultados (score, revisão, accordion)
│   │
│   └── assets/
│       ├── hero.png            # Imagem hero (usada no ConfigScreen)
│       ├── react.svg
│       └── vite.svg
│
└── dist/                       # Build de produção (gerado por `npm run build`)
```

---

## 5. Fluxo da Aplicação (State Machine)

```
LOADING → CONFIG → QUIZ → RESULTS → CONFIG (loop)
                              ↓
                            ERROR
```

| Estado    | Componente       | Descrição                                  |
| --------- | ---------------- | ------------------------------------------ |
| `LOADING` | Spinner          | Fetch do CSV do Google Sheets              |
| `CONFIG`  | `ConfigScreen`   | Configuração: nº questões, timer, feedback |
| `QUIZ`    | `QuizScreen`     | Respondendo questões uma a uma             |
| `RESULTS` | `ResultsScreen`  | Score final + revisão das questões         |
| `ERROR`   | Mensagem de erro | Falha no fetch ou parsing do CSV           |

### Tipos (definidos em `src/types/index.ts`)

```typescript
type AppState = "CONFIG" | "LOADING" | "QUIZ" | "RESULTS" | "ERROR";
type OptionKey = "A" | "B" | "C" | "D";

interface Question {
  id: string; // ex: "q_0", "q_1"
  level: string; // ex: "BÁSICO", "AVANÇADO"
  text: string; // Enunciado da questão
  options: Record<OptionKey, string>; // { A: "...", B: "...", C: "...", D: "..." }
  correctOption: OptionKey;
  justification: string;
}

interface QuizSettings {
  numQuestions: number;
  timerEnabled: boolean;
  immediateFeedback: boolean;
  timerDurationSeconds: number; // 15, 30, 45 ou 60
}

interface AnswerRecord {
  questionId: string;
  selectedOption: OptionKey | null; // null = não respondeu / tempo esgotou
  isCorrect: boolean;
  timeTakenSeconds: number;
}
```

---

## 6. Detalhes dos Componentes

### `App.tsx`

- Usa o hook `useQuiz()` para gerenciar todo o estado.
- Quando `appState === 'CONFIG'`, renderiza o `ConfigScreen` em tela cheia.
- Para os demais estados, renderiza dentro de um container centralizado com `glass-panel`.
- Possui decorações visuais (blobs gradiente) no background.
- Logo do Instituto J&F carregada de CDN.

### `ConfigScreen.tsx`

- Layout de tela cheia com hero image e gradiente.
- **Slider** para selecionar nº de questões (1 até o total disponível).
- **Toggle** para habilitar/desabilitar timer. Se habilitado, mostra seletor de duração (15s, 30s, 45s, 60s).
- **Toggle** para feedback imediato (mostrar justificativa após cada resposta).
- Botão **"Começar Quiz"**.

### `QuizScreen.tsx`

- Barra de progresso animada no topo.
- Badge de nível da questão (BÁSICO/MODERADO/AVANÇADO/DIFÍCIL) com cores diferentes.
- 4 opções de resposta (A/B/C/D) com animações de hover e feedback visual.
- Timer opcional com alerta visual quando ≤ 5s.
- Se feedback imediato está ativo: mostra justificativa + botão "Próxima Questão".
- Se feedback desativado: avança automaticamente após 600ms.
- Suporta navegação por teclado (teclas A/B/C/D + Enter).

### `ResultsScreen.tsx`

- Score circular animado (SVG com `motion.circle`).
- Mensagem motivacional baseada no score (≥80% verde, ≥50% azul, <50% laranja).
- Seção "Revisão das Questões" com background diferenciado.
- Cards accordion para cada questão (expandir/colapsar).
- Quando expandido: mostra resposta do usuário, resposta correta e justificativa.
- Botões "Jogar Novamente" e "Voltar ao Início".

---

## 7. Design System (CSS Variables)

Todas as variáveis estão definidas em `src/index.css`:

### Cores principais

| Variable                     | Valor     | Uso                                      |
| ---------------------------- | --------- | ---------------------------------------- |
| `--primary`                  | `#1c0c3c` | Cor principal (textos, botões, progress) |
| `--primary-light`            | `#52377b` | Hover em scrollbar                       |
| `--primary-container`        | `#312252` | Gradientes de CTA                        |
| `--on-primary`               | `#ffffff` | Texto sobre primary                      |
| `--surface`                  | `#f9f9f9` | Background da página                     |
| `--surface-container-lowest` | `#ffffff` | Background dos cards (glass-panel)       |
| `--surface-container-high`   | `#e8e8e8` | Background da seção de revisão           |
| `--error`                    | `#ba1a1a` | Respostas erradas                        |
| `--correct`                  | `#11C76F` | Respostas certas                         |
| `--incorrect`                | `#DC4405` | Decoração de erro                        |

### Classe `.glass-panel`

```css
.glass-panel {
  background: var(--surface-container-lowest); /* #ffffff */
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: var(--shadow-card);
  border-radius: var(--radius-xl); /* 16px */
  overflow: hidden;
}
```

---

## 8. Assets e URLs Externas

### Logo

```
https://institutojef.org.br/wp-content/uploads/2026/02/logo_instituto_negocios.png
```

### Favicon

```
https://institutojef.org.br/wp-content/themes/2026-instituto-jef/img/favicon.png
```

### Hero Image (local)

```
src/assets/hero.png
```

---

## 9. Persistência Local

- **localStorage key**: `passiveVoiceQuizHistory`
- **Conteúdo**: Array JSON de IDs de questões já respondidas (ex: `["q_0","q_3","q_7"]`).
- **Propósito**: Priorizar questões não vistas em sessões futuras.

---

## 10. Como Rodar

```bash
# Instalar dependências
npm install

# Dev server (http://localhost:5173)
npm run dev

# Build de produção
npm run build

# Preview do build
npm run preview
```

---

## 11. Problemas Conhecidos e Melhorias Pendentes

### Problemas de UI (em revisão)

- **ResultsScreen**: Os cards de questão dentro do `glass-panel` podem parecer "achatados" por ter a mesma cor de fundo que o container pai. A solução aplicada foi usar `--surface-container-high` como background da seção de revisão.

### Melhorias sugeridas

- [ ] Adicionar animação de transição nos accordions dos resultados
- [ ] Melhorar responsividade em telas muito pequenas (<360px)
- [ ] Adicionar modo escuro (dark mode)
- [ ] Permitir filtrar questões por nível de dificuldade na configuração
- [ ] Exportar resultado como imagem/PDF
- [ ] Adicionar som/efeito sonoro para acerto/erro

---

## 12. Branding / Protótipos HTML

O diretório `branding/` contém referências visuais:

| Arquivo                    | Descrição                                                                         |
| -------------------------- | --------------------------------------------------------------------------------- |
| `branding/style.json`      | Paleta de cores e tipografia extraída do site institucional                       |
| `branding/images.md`       | Lista de URLs de imagens/ícones do Instituto J&F                                  |
| `branding/index.html`      | Protótipo completo em HTML/Tailwind (referência visual para todos os componentes) |
| `branding/everything.json` | Dump completo de branding com todas as informações extraídas                      |

> O `branding/index.html` é a **fonte de verdade** para o design visual. Use como referência ao refatorar componentes.

---

## 13. Resumo para Recomeçar em Outro Diretório

Para recriar o projeto em outro lugar, você precisa:

1. **Copiar estes arquivos essenciais:**

   ```
   src/                  (toda a pasta)
   branding/             (toda a pasta — referências visuais)
   public/               (favicon e ícones)
   index.html            (entry point com fontes)
   package.json          (dependências)
   vite.config.ts        (configuração do bundler)
   tsconfig.json         (config TS raiz)
   tsconfig.app.json     (config TS app)
   tsconfig.node.json    (config TS node)
   eslint.config.js      (linting)
   .gitignore
   ```

2. **NÃO copiar:**

   ```
   node_modules/          (reinstalar com npm install)
   dist/                  (regenerar com npm run build)
   tsc.log                (arquivo temporário)
   package-lock.json      (será regenerado)
   ```

3. **Rodar:**

   ```bash
   npm install
   npm run dev
   ```

4. **Verificar que o CSV do Google Sheets está acessível** — a URL está em `src/hooks/useQuiz.ts` linha 5.
