import { useState, useMemo } from 'react';
import clsx from 'clsx';
import './ResultsScreen.css';

const RADIUS = 70;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function ScoreRing({ percent }) {
  const dashOffset = CIRCUMFERENCE - (percent / 100) * CIRCUMFERENCE;
  const colorClass =
    percent >= 80 ? 'score-great' : percent >= 50 ? 'score-good' : 'score-low';

  return (
    <div className={clsx('score-ring-container', colorClass)}>
      <svg viewBox="0 0 160 160" className="score-ring-svg">
        {/* Background circle */}
        <circle
          cx="80"
          cy="80"
          r={RADIUS}
          fill="none"
          stroke="var(--surface-container-high)"
          strokeWidth="8"
        />
        {/* Progress circle */}
        <circle
          cx="80"
          cy="80"
          r={RADIUS}
          fill="none"
          className="score-ring-progress"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          style={{
            '--circumference': CIRCUMFERENCE,
            '--dash-offset': dashOffset,
          }}
          transform="rotate(-90 80 80)"
        />
      </svg>
      <div className="score-ring-label">
        <span className="score-ring-percent">{percent}%</span>
        <span className="score-ring-text">Correct</span>
      </div>
    </div>
  );
}

function ResultsScreen({
  score,
  scorePercent,
  answers,
  quizQuestions,
  onRestart,
  onBackToConfig,
}) {
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const motivationalMessage = useMemo(() => {
    if (scorePercent >= 80) return 'Excellent! You mastered the Passive Voice! 🏆';
    if (scorePercent >= 50) return 'Good job! Keep practicing to improve. 💪';
    return "Don't give up! Practice makes perfect. 📚";
  }, [scorePercent]);

  const statsText = `${score} out of ${answers.length} correct questions`;

  return (
    <div className="results-screen">
      <div className="results-container animate-fade-in">
        {/* Score Section */}
        <div className="results-score-section animate-scale-in">
          <ScoreRing percent={scorePercent} />
          <h2 className="results-title">{motivationalMessage}</h2>
          <p className="results-stats">{statsText}</p>
        </div>

        {/* Review Section */}
        <div className="results-review-section">
          <div className="review-header">
            <span className="material-symbols-outlined review-icon">
              fact_check
            </span>
            <h3 className="review-title">Questions Review</h3>
          </div>

          <div className="review-list stagger">
            {quizQuestions.map((question, i) => {
              const answer = answers[i];
              if (!answer) return null;

              const isCorrect = answer.isCorrect;
              const isExpanded = expandedId === question.id;
              const wasTimeout = answer.timedOut || (!answer.selectedOption && answer.confirmed) || (!answer.selectedOption);

              return (
                <div
                  key={question.id}
                  className={clsx(
                    'review-card',
                    isCorrect ? 'review-correct' : 'review-incorrect',
                    isExpanded && 'expanded'
                  )}
                >
                  {/* Card Header (clickable) */}
                  <button
                    className="review-card-header"
                    onClick={() => toggleExpand(question.id)}
                    aria-expanded={isExpanded}
                    id={`review-toggle-${i}`}
                  >
                    <div className="review-card-left">
                      <span
                        className={clsx(
                          'material-symbols-outlined review-status-icon',
                          isCorrect ? 'icon-correct' : 'icon-incorrect'
                        )}
                      >
                        {isCorrect ? 'check_circle' : 'cancel'}
                      </span>
                      <span className="review-question-number">
                        Question {i + 1}
                      </span>
                    </div>
                    <span
                      className={clsx(
                        'material-symbols-outlined review-chevron',
                        isExpanded && 'rotated'
                      )}
                    >
                      expand_more
                    </span>
                  </button>

                  {/* Card Body (collapsible) */}
                  {isExpanded && (
                    <div className="review-card-body animate-slide-up" style={{ animationDuration: '200ms' }}>
                      <p className="review-question-text">{question.text}</p>

                      <div className="review-answers">
                        <div className="review-answer-row">
                          <span className="review-answer-label">Your answer:</span>
                          <span
                            className={clsx(
                              'review-answer-value',
                              isCorrect ? 'text-correct' : 'text-incorrect'
                            )}
                          >
                            {wasTimeout
                              ? 'Time is up (No answer)'
                              : `${answer.selectedOption}) ${question.options[answer.selectedOption]}`}
                          </span>
                        </div>

                        {!isCorrect && (
                          <div className="review-answer-row">
                            <span className="review-answer-label">
                              Correct answer:
                            </span>
                            <span className="review-answer-value text-correct">
                              {question.correctOption}) {question.options[question.correctOption]}
                            </span>
                          </div>
                        )}
                      </div>

                      {question.justification && (
                        <div className="review-justification">
                          <span className="material-symbols-outlined justification-icon">
                            lightbulb
                          </span>
                          <p>{question.justification}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="results-actions">
          <button className="btn-restart" onClick={onRestart} id="restart-quiz-btn">
            <span className="material-symbols-outlined">replay</span>
            Play Again
          </button>
          <button className="btn-back" onClick={onBackToConfig} id="back-to-config-btn">
            <span className="material-symbols-outlined">home</span>
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResultsScreen;
