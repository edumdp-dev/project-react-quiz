import { useQuiz } from './hooks/useQuiz';
import ConfigScreen from './components/ConfigScreen';
import QuizScreen from './components/QuizScreen';
import ResultsScreen from './components/ResultsScreen';
import './App.css';

function App() {
  const quiz = useQuiz();

  return (
    <div className="app">
      <div className="bg-blobs" aria-hidden="true" />

      <main className="app-main">
        {quiz.appState === 'LOADING' && (
          <div className="loading-screen animate-fade-in">
            <div className="spinner" />
            <p className="loading-text">Loading questions...</p>
          </div>
        )}

        {quiz.appState === 'ERROR' && (
          <div className="error-screen animate-fade-in">
            <span className="material-symbols-outlined error-icon">error</span>
            <h2>Oops! Something went wrong</h2>
            <p>{quiz.errorMessage}</p>
          </div>
        )}

        {quiz.appState === 'CONFIG' && (
          <ConfigScreen
            settings={quiz.settings}
            setSettings={quiz.setSettings}
            totalAvailable={quiz.allQuestions.length}
            onStart={quiz.startQuiz}
          />
        )}

        {quiz.appState === 'QUIZ' && (
          <QuizScreen
            currentQuestion={quiz.currentQuestion}
            currentIndex={quiz.currentIndex}
            totalQuestions={quiz.totalQuestions}
            progress={quiz.progress}
            quizQuestions={quiz.quizQuestions}
            selections={quiz.selections}
            currentSelection={quiz.currentSelection}
            timeLeft={quiz.timeLeft}
            settings={quiz.settings}
            confirmedCount={quiz.confirmedCount}
            allConfirmed={quiz.allConfirmed}
            onSelect={quiz.selectOption}
            onConfirm={quiz.confirmAnswer}
            onGoTo={quiz.goToQuestion}
            onNext={quiz.goNext}
            onPrev={quiz.goPrev}
            onFinish={quiz.finishQuiz}
          />
        )}

        {quiz.appState === 'RESULTS' && (
          <ResultsScreen
            score={quiz.score}
            scorePercent={quiz.scorePercent}
            answers={quiz.answers}
            quizQuestions={quiz.quizQuestions}
            onRestart={quiz.restartQuiz}
            onBackToConfig={quiz.resetToConfig}
          />
        )}
      </main>
    </div>
  );
}

export default App;
