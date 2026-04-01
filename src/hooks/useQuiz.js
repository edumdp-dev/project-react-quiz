import { useState, useEffect, useCallback, useRef } from 'react';
import Papa from 'papaparse';

const CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTEO4IMjkXaR1p93YZLfHZX3tMLDKPU4NAOtbb5S5iEBL877jNaQANtNeB2FmxwBlhoCYaJFK_yGA9g/pub?gid=0&single=true&output=csv';

const HISTORY_KEY = 'passiveVoiceQuizHistory';

/** Difficulty level weighted distributions (BASIC, MODERATE, ADVANCED, HARD) */
const DIFFICULTY_DISTRIBUTIONS = {
  beginner:     { 'BASIC': 0.70, 'MODERATE': 0.20, 'ADVANCED': 0.10, 'HARD': 0.00 },
  intermediate: { 'BASIC': 0.30, 'MODERATE': 0.40, 'ADVANCED': 0.20, 'HARD': 0.10 },
  advanced:     { 'BASIC': 0.10, 'MODERATE': 0.20, 'ADVANCED': 0.40, 'HARD': 0.30 },
  master:       { 'BASIC': 0.00, 'MODERATE': 0.10, 'ADVANCED': 0.30, 'HARD': 0.60 },
};

const LEVEL_MAP = {
  'BÁSICO': 'BASIC',
  'MODERADO': 'MODERATE',
  'AVANÇADO': 'ADVANCED',
  'DIFÍCIL': 'HARD',
};

function parseQuestions(rows) {
  return rows
    .map((row, i) => {
      const rawText = (row['Pergunta'] || '').trim();
      const text = rawText.replace(/^\d+[\.\)\-]\s*/, '');
      if (!text) return null;

      const rawCorrect = (row['Alternativa Correta'] || '').trim().toUpperCase();
      const correctOption = ['A', 'B', 'C', 'D'].includes(rawCorrect) ? rawCorrect : 'A';

      const originalLevel = (row['Nível'] || 'BÁSICO').trim().toUpperCase();
      const level = LEVEL_MAP[originalLevel] || 'BASIC';

      return {
        id: `q_${i}`,
        level,
        text,
        options: {
          A: (row['Alternativa A'] || '').trim(),
          B: (row['Alternativa B'] || '').trim(),
          C: (row['Alternativa C'] || '').trim(),
          D: (row['Alternativa D'] || '').trim(),
        },
        correctOption,
        justification: (row['Justificativa'] || '').trim(),
      };
    })
    .filter(Boolean);
}

function getHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(ids) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(ids));
  } catch {
    // silently fail
  }
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function selectQuestions(allQuestions, count, difficultyLevel) {
  const history = getHistory();
  const dist = DIFFICULTY_DISTRIBUTIONS[difficultyLevel] || DIFFICULTY_DISTRIBUTIONS.intermediate;

  const byLevel = {};
  for (const q of allQuestions) {
    const lvl = q.level;
    if (!byLevel[lvl]) byLevel[lvl] = [];
    byLevel[lvl].push(q);
  }

  for (const lvl of Object.keys(byLevel)) {
    const unseen = byLevel[lvl].filter((q) => !history.includes(q.id));
    const seen = byLevel[lvl].filter((q) => history.includes(q.id));
    byLevel[lvl] = [...shuffle(unseen), ...shuffle(seen)];
  }

  const levels = ['BASIC', 'MODERATE', 'ADVANCED', 'HARD'];
  const targets = {};
  let remaining = count;

  for (let i = 0; i < levels.length; i++) {
    const lvl = levels[i];
    if (i === levels.length - 1) {
      targets[lvl] = remaining;
    } else {
      targets[lvl] = Math.round(count * (dist[lvl] || 0));
      remaining -= targets[lvl];
    }
  }

  const selected = [];
  const overflow = [];

  for (const lvl of levels) {
    const available = byLevel[lvl] || [];
    const target = targets[lvl] || 0;
    const picked = available.slice(0, target);
    selected.push(...picked);
    if (available.length > target) {
      overflow.push(...available.slice(target));
    }
  }

  if (selected.length < count) {
    const needed = count - selected.length;
    const selectedIds = new Set(selected.map((q) => q.id));
    const extras = shuffle(overflow.filter((q) => !selectedIds.has(q.id)));
    selected.push(...extras.slice(0, needed));
  }

  return shuffle(selected.slice(0, count));
}

export function useQuiz() {
  const [appState, setAppState] = useState('LOADING');
  const [allQuestions, setAllQuestions] = useState([]);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const [settings, setSettings] = useState({
    numQuestions: 10,
    timerEnabled: false,
    immediateFeedback: true,
    timerDurationSeconds: 30,
    difficultyLevel: 'intermediate',
  });

  // Array of time remaining for each question
  const [timesRemaining, setTimesRemaining] = useState([]);
  const timerRef = useRef(null);

  // Per-question selections: { [questionIndex]: { selected: 'A'|null, confirmed: bool, timedOut: bool } }
  const [selections, setSelections] = useState({});

  useEffect(() => {
    Papa.parse(CSV_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const questions = parseQuestions(results.data);
        if (questions.length === 0) {
          setErrorMessage('No questions found in CSV.');
          setAppState('ERROR');
          return;
        }
        setAllQuestions(questions);
        setAppState('CONFIG');
      },
      error: (err) => {
        setErrorMessage(`Error loading questions: ${err.message}`);
        setAppState('ERROR');
      },
    });
  }, []);

  // Timer logic for the current question
  useEffect(() => {
    const sel = selections[currentIndex];
    const isConfirmed = sel?.confirmed;
    const isTimedOut = sel?.timedOut;
    
    // Stop timer if not in QUIZ, disabled, already confirmed, or if time is up
    if (appState !== 'QUIZ' || !settings.timerEnabled || isConfirmed || isTimedOut) {
      clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimesRemaining((prevTimes) => {
        const newTimes = [...prevTimes];
        const currentLeft = newTimes[currentIndex];
        
        if (currentLeft <= 1) {
          clearInterval(timerRef.current);
          newTimes[currentIndex] = 0;
          handleTimeout(currentIndex);
        } else {
          newTimes[currentIndex] = currentLeft - 1;
        }
        
        return newTimes;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appState, currentIndex, settings.timerEnabled, selections]);
  
  // Need to use a ref to prevent stale closures in handleTimeout.
  // Actually, we can just pass the specific index to it.
  const handleTimeout = useCallback((indexToTimeout) => {
    setSelections((prev) => ({
      ...prev,
      [indexToTimeout]: { 
        selected: prev[indexToTimeout]?.selected || null, 
        confirmed: true, 
        timedOut: true 
      },
    }));
  }, []);

  const startQuiz = useCallback(() => {
    const selected = selectQuestions(allQuestions, settings.numQuestions, settings.difficultyLevel);
    setQuizQuestions(selected);
    setCurrentIndex(0);
    setSelections({});
    // Initialize times remaining array
    setTimesRemaining(Array(settings.numQuestions).fill(settings.timerDurationSeconds));
    setAppState('QUIZ');
  }, [allQuestions, settings]);

  const selectOption = useCallback(
    (option) => {
      const sel = selections[currentIndex];
      if (sel?.confirmed) return;

      setSelections((prev) => ({
        ...prev,
        [currentIndex]: {
          ...prev[currentIndex],
          selected: prev[currentIndex]?.selected === option ? null : option,
          confirmed: false,
        },
      }));
    },
    [currentIndex, selections]
  );

  const confirmAnswer = useCallback(() => {
    const sel = selections[currentIndex];
    if (!sel?.selected || sel?.confirmed) return;

    clearInterval(timerRef.current);
    setSelections((prev) => ({
      ...prev,
      [currentIndex]: { ...prev[currentIndex], confirmed: true },
    }));
  }, [currentIndex, selections]);

  const goToQuestion = useCallback(
    (index) => {
      if (index < 0 || index >= quizQuestions.length) return;
      setCurrentIndex(index);
    },
    [quizQuestions.length]
  );

  const goNext = useCallback(() => {
    goToQuestion(currentIndex + 1);
  }, [currentIndex, goToQuestion]);

  const goPrev = useCallback(() => {
    goToQuestion(currentIndex - 1);
  }, [currentIndex, goToQuestion]);

  const finishQuiz = useCallback(() => {
    // Auto-confirm any question that has a selected option but wasn't confirmed
    setSelections((prev) => {
      const nextSelections = { ...prev };
      for (let i = 0; i < quizQuestions.length; i++) {
        const item = nextSelections[i];
        if (item && item.selected && !item.confirmed) {
          nextSelections[i] = { ...item, confirmed: true };
        }
      }
      return nextSelections;
    });

    const history = getHistory();
    const newIds = quizQuestions.map((q) => q.id);
    const merged = [...new Set([...history, ...newIds])];
    saveHistory(merged);
    setAppState('RESULTS');
  }, [quizQuestions]);

  const resetToConfig = useCallback(() => {
    setAppState('CONFIG');
    setQuizQuestions([]);
    setCurrentIndex(0);
    setSelections({});
    setTimesRemaining([]);
  }, []);

  const restartQuiz = useCallback(() => {
    startQuiz();
  }, [startQuiz]);

  const currentQuestion = quizQuestions[currentIndex] || null;
  const totalQuestions = quizQuestions.length;
  const progress = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;
  
  const currentSelection = selections[currentIndex] || { selected: null, confirmed: false };
  const timeLeft = timesRemaining[currentIndex] !== undefined ? timesRemaining[currentIndex] : settings.timerDurationSeconds;

  const answers = quizQuestions.map((q, i) => {
    // Treat any selected option as confirmed for the purposes of the results screen
    const sel = selections[i];
    const isActuallyConfirmed = sel?.confirmed || (appState === 'RESULTS' && sel?.selected);
    return {
      questionId: q.id,
      selectedOption: sel?.selected || null,
      isCorrect: sel?.selected === q.correctOption,
      confirmed: !!isActuallyConfirmed,
      timedOut: sel?.timedOut || false,
    };
  });

  const confirmedCount = Object.values(selections).filter((s) => s.confirmed || s.selected).length;
  const allConfirmed = confirmedCount >= totalQuestions;

  const score = answers.filter((a) => a.isCorrect).length;
  const scorePercent = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  return {
    appState,
    errorMessage,
    allQuestions,
    settings,
    setSettings,

    currentQuestion,
    currentIndex,
    totalQuestions,
    progress,
    quizQuestions,
    answers,
    selections,
    currentSelection,
    timeLeft,
    score,
    scorePercent,
    confirmedCount,
    allConfirmed,

    startQuiz,
    selectOption,
    confirmAnswer,
    goToQuestion,
    goNext,
    goPrev,
    finishQuiz,
    resetToConfig,
    restartQuiz,
  };
}
