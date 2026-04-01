import { useEffect, useState } from 'react';
import clsx from 'clsx';
import './QuizScreen.css';

const LEVEL_COLORS = {
  'BASIC': 'level-basic',
  'MODERATE': 'level-moderate',
  'ADVANCED': 'level-advanced',
  'HARD': 'level-hard',
};

const OPTION_KEYS = ['A', 'B', 'C', 'D'];

function QuizScreen({
  currentQuestion,
  currentIndex,
  totalQuestions,
  progress,
  quizQuestions,
  selections,
  currentSelection,
  timeLeft,
  settings,
  confirmedCount,
  allConfirmed,
  onSelect,
  onConfirm,
  onGoTo,
  onNext,
  onPrev,
  onFinish,
}) {
  const [showFinishModal, setShowFinishModal] = useState(false);
  const { selected, confirmed } = currentSelection;
  const showFeedback = confirmed && settings.immediateFeedback;

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e) {
      if (showFinishModal) return;
      const key = e.key.toUpperCase();
      if (OPTION_KEYS.includes(key) && !confirmed) {
        onSelect(key);
      }
      if (e.key === 'Enter' && selected && !confirmed) {
        onConfirm();
      }
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'ArrowLeft') onPrev();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmed, selected, onSelect, onConfirm, onNext, onPrev, showFinishModal]);

  if (!currentQuestion) return null;

  const levelClass = LEVEL_COLORS[currentQuestion.level] || 'level-basic';
  const timerWarning = settings.timerEnabled && timeLeft <= 5 && !confirmed;
  const timerPercent = settings.timerEnabled
    ? (timeLeft / settings.timerDurationSeconds) * 100
    : 100;

  function getOptionClass(key) {
    if (!confirmed) {
      return selected === key ? 'selected-neutral' : '';
    }
    if (settings.immediateFeedback) {
      if (key === currentQuestion.correctOption) return 'correct';
      if (key === selected && key !== currentQuestion.correctOption) return 'incorrect';
      return 'dimmed';
    }
    return selected === key ? 'selected-locked' : 'dimmed';
  }

  const handleFinishRequest = () => {
    setShowFinishModal(true);
  };

  const confirmFinish = () => {
    setShowFinishModal(false);
    onFinish();
  };

  return (
    <div className="quiz-screen">
      {/* Progress Bar */}
      <div className="quiz-progress-bar">
        <div className="quiz-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="quiz-body">
        <div className="quiz-container">
          {/* Top Info */}
          <div className="quiz-top-info">
            <span className={clsx('level-badge', levelClass)}>
              {currentQuestion.level}
            </span>
            <span className="question-counter">
              {currentIndex + 1} / {totalQuestions}
            </span>
          </div>

          {/* Question Card */}
          <div className="question-card">
            {/* The key on this wrapper creates a natural fade transition when switching questions */}
            <div className="question-wrapper animate-fade-in-fast" key={currentQuestion.id}>
              {/* Timer */}
              {settings.timerEnabled && !confirmed && (
                <div className={clsx('timer-section', timerWarning && 'timer-warning')}>
                  <div className="timer-bar">
                    <div
                      className="timer-fill"
                      style={{
                        width: `${timerPercent}%`,
                        transition: 'width 1s linear',
                      }}
                    />
                  </div>
                  <div className="timer-display">
                    <span className="material-symbols-outlined timer-icon">timer</span>
                    <span className="timer-value">{timeLeft}s</span>
                  </div>
                </div>
              )}

              {/* Question Text */}
              <p className="question-text">{currentQuestion.text}</p>

              {/* Options */}
              <div className="options-list">
                {OPTION_KEYS.map((key) => (
                  <button
                    key={key}
                    id={`option-${key}`}
                    className={clsx('option-btn', getOptionClass(key))}
                    onClick={() => !confirmed && onSelect(key)}
                    disabled={confirmed}
                    aria-label={`Option ${key}: ${currentQuestion.options[key]}`}
                  >
                    <span className="option-letter">{key}</span>
                    <span className="option-text">{currentQuestion.options[key]}</span>
                    
                    {/* Feedback icons */}
                    {confirmed && settings.immediateFeedback && key === currentQuestion.correctOption && (
                      <span className="material-symbols-outlined option-feedback-icon correct-icon animate-fade-in-fast">
                        check_circle
                      </span>
                    )}
                    {confirmed &&
                      settings.immediateFeedback &&
                      key === selected &&
                      key !== currentQuestion.correctOption && (
                        <span className="material-symbols-outlined option-feedback-icon incorrect-icon animate-fade-in-fast">
                          cancel
                        </span>
                      )}
                  </button>
                ))}
              </div>

              {/* Confirm button */}
              <div className="confirm-wrapper">
                {selected && !confirmed && (
                  <button className="btn-confirm animate-fade-in" onClick={onConfirm}>
                    <span className="material-symbols-outlined">task_alt</span>
                    Confirm Answer
                  </button>
                )}
              </div>

              {/* Immediate Feedback Justification */}
              {showFeedback && (
                <div className="feedback-section animate-slide-in-up">
                  <div
                    className={clsx(
                      'feedback-card',
                      selected === currentQuestion.correctOption
                        ? 'feedback-correct'
                        : 'feedback-incorrect'
                    )}
                  >
                    <div className="feedback-header">
                      <span className="material-symbols-outlined feedback-icon">
                        {selected === currentQuestion.correctOption
                          ? 'emoji_events'
                          : currentSelection.timedOut
                          ? 'timer_off'
                          : 'lightbulb'}
                      </span>
                      <span className="feedback-title">
                        {selected === currentQuestion.correctOption
                          ? 'Correct Answer!'
                          : currentSelection.timedOut
                          ? 'Time is up!'
                          : 'Incorrect Answer'}
                      </span>
                    </div>
                    {currentQuestion.justification && (
                      <p className="feedback-justification">
                        {currentQuestion.justification}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Timeout without feedback */}
              {confirmed && !settings.immediateFeedback && currentSelection.timedOut && (
                <div className="timeout-message animate-fade-in">
                  <span className="material-symbols-outlined">timer_off</span>
                  <span>Time is up!</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Floating Bottom Navigation Bar */}
        <div className="nav-bar-container">
          <div className="quiz-nav-bar">
            <div className="quiz-nav-inner">
              <button
                className="nav-arrow"
                onClick={onPrev}
                disabled={currentIndex === 0}
                aria-label="Previous question"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>

              <div className="nav-dots">
                {quizQuestions.map((_, i) => {
                  const sel = selections[i];
                  const dotClass = clsx(
                    'nav-dot',
                    i === currentIndex && 'current',
                    sel?.confirmed && sel?.selected === quizQuestions[i].correctOption && 'dot-correct',
                    sel?.confirmed && sel?.selected !== quizQuestions[i].correctOption && settings.immediateFeedback && 'dot-incorrect',
                    sel?.confirmed && !settings.immediateFeedback && 'dot-answered',
                    sel?.selected && !sel?.confirmed && 'dot-selected'
                  );
                  return (
                    <button
                      key={i}
                      className={dotClass}
                      onClick={() => onGoTo(i)}
                      aria-label={`Go to question ${i + 1}`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>

              <button
                className="nav-arrow"
                onClick={onNext}
                disabled={currentIndex === totalQuestions - 1}
                aria-label="Next question"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>

            <button
              className={clsx('btn-finish', allConfirmed && 'btn-finish-ready')}
              onClick={handleFinishRequest}
              id="finish-quiz-btn"
            >
              <span className="material-symbols-outlined">
                {allConfirmed ? 'assessment' : 'send'}
              </span>
              View Results
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showFinishModal && (
        <div className="modal-overlay animate-fade-in-fast">
          <div className="modal-card animate-slide-in-up">
            <div className="modal-icon-wrapper">
              <span className="material-symbols-outlined modal-icon">flag</span>
            </div>
            <h2 className="modal-title">Ready to finish?</h2>
            
            <p className="modal-text">
              {confirmedCount === totalQuestions 
                ? "You have answered all questions. Would you like to view your results?" 
                : `You have answered ${confirmedCount} out of ${totalQuestions} questions. Unconfirmed selections will be automatically captured.`}
            </p>

            <div className="modal-actions">
              <button className="btn-modal-cancel" onClick={() => setShowFinishModal(false)}>
                Resume Quiz 
              </button>
              <button className="btn-modal-confirm" onClick={confirmFinish}>
                Yes, Finish Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuizScreen;
